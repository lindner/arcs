/**
 * @license
 * Copyright (c) 2017 Google Inc. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import path from 'path';
import util from 'util';
import fs from 'fs';
import defaultConfig from './repo-config-default.json';

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const mkdir = util.promisify(fs.mkdir);

import {ArcsRepoConfig} from './repo-config.js';

// RxDb stuff
import RxDB, {RxDatabase, RxCollection, RxJsonSchema} from 'rxdb';
import PouchDbMemory from 'pouchdb-adapter-memory';
import PouchDbLevelDb from 'pouchdb-adapter-leveldb';
import PouchDbHttp from 'pouchdb-adapter-http';

RxDB.plugin(PouchDbMemory);
RxDB.plugin(PouchDbLevelDb);
RxDB.plugin(PouchDbHttp);

import {AuditLog} from './schemas/audit-log.js';
import AuditLogSchema from './schemas/audit-log.json';
import SchemaSchema from './schemas/schemas.json';

import {MyActivityDocument, MyActivityCollection, MyActivitySchema} from '../ingest/myactivity.js';
import {FrameCollection, FrameSchema} from '../ingest/frame.js';
import {ImportSchema} from '../ingest/import.js';

// RxJs stuff
import {Subject} from 'rxjs';
import {QueueingSubject} from 'queueing-subject';
import {timestamp} from 'rxjs/operators';


/**
 * A wrapper around the storage in the Arcs repo.  The structure of a repo is
 *
 * ```
 *   config.js
 *   db
 *     dbname-...
 *   dat
 *   uploads
 * ```
 * 
 */

export class ArcsRepo {
  // TODO emit events based on changes.
  private config?: ArcsRepoConfig;
  private version?: number;
  
  private dbAdapter = 'leveldb';

  public auditDb?: RxDatabase;
  public auditSubject = new QueueingSubject<string>();

  public arcsDb?: RxDatabase;
  
  // TODO lock?
  
  // TODO rxjs timestamp clock
  
  /**
   * Constructs a new Arcs Repo.
   * @param repoPath a directory used to store the internal structure of an Arcs Node
   */
  constructor(public readonly repoPath: string) {
  }

  public async init(): Promise<void> {
    this.auditSubject.next('Initializing Repo in ' + this.repoPath);
    
    // Create directories if needed
    for (const path of ['', '/db', '/dat', '/uploads']) {
      try {
        await mkdir(this.repoPath + path);
      } catch (e) {
        if (e.code !== 'EEXIST') {
          throw e;
        }
      }
    }

    // TODO keygen/crypto

    // Create config.json
    const configData = JSON.stringify(defaultConfig, null, 2);
    const configPath = this.repoPath + '/config.json';
    if (fs.existsSync(configPath)) {
      console.error('Not initializing existing repo in  ' + this.repoPath);
      return;
    }
    await writeFile(configPath, configData);

    // Make sure we can open (also creates databases)
    await this.open();

    // Bootstrap data

    // TODO dat, other data structures
    
    // Close repo
    await this.close();

    // emit init'd
    this.auditSubject.next('Initialized Repo in ' + this.repoPath);

    // TODO(lindner): Use cert transparency to publish the creation of this repo
  }


  /**
   * Opens an existing repo
   */
  public async open(): Promise<void> {
    this.auditSubject.next('Opened Repo');

    // TODO(lindner) start file watching

    // Load config.json
    const data = await readFile(this.repoPath + '/config.json');

    this.config = JSON.parse(data.toString()) as ArcsRepoConfig;
    this.version = this.config.version;
    
    // TODO(lindner): verify internal structure cryptographically

    // Create base level data structures
    this.arcsDb = await this.createArcsDb();
    this.auditDb = await this.createAuditDb();
    
    // subscribe to audit events and write to DB
    this.auditSubject
      .pipe(timestamp())
      .subscribe(entry => {
        console.log('AUDIT:' + entry.timestamp + ' ' + entry.value);
        this.auditDb.log.insert({
          timestamp: new Date(entry.timestamp).toISOString(),
          msg: entry.value});
      });
    
    // TODO emit open'd
  }

  /**
   * Close the Repo, clean up databases, etc.
   */
  public async close() {
    this.arcsDb.destroy();
    this.auditDb.destroy();
  }

  /**
   * @return true if the arcs repo exists
   */
  public async exists(): Promise<boolean> {
    // TODO(lindner): consider a simpler check.
    try {
      await this.open();
      return true;
    } catch (e) {
      return false;
    }
  }

  public auditLogsQuery() {
    return this.auditDb.log.find();
  }
  
  public async recentAuditLogs(): Promise<AuditLog[]> {
    return this.auditDb.log.find()
      .sort('-timestamp')
      .limit(5)
      .exec();
  }

  private async createAuditDb(): Promise<RxDatabase> {
    // Open Audit Database
    const db = await RxDB.create({
      name: this.repoPath + '/db/audit',
      adapter: this.dbAdapter
    });

    // Create the audit collection
    const schema: RxJsonSchema = {...AuditLogSchema, version: this.version};

    await db.collection({
      name: 'log',
      schema,
      migrationStrategies: {
        1: doc => doc
      }
    });
    return db;
  }

  private async createArcsDb(): Promise<RxDatabase> {
    const db = await RxDB.create({
      name: this.repoPath + '/db/arcs',
      adapter: this.dbAdapter
    });
    // Replication could be enabled here
    
    const frameCollection = await db.collection({
      name: 'frames',
      schema: FrameSchema
      // optional per-doc, per-collection methods could go here
    });

    const myactivityCollection = await db.collection({
      name: 'myactivity',
      schema: MyActivitySchema
      // optional per-doc, per-collection methods could go here
    });

    const imports = await db.collection({
      name: 'imports',
      schema: ImportSchema
    });

    // postInsert Hook that maps from MyActivity to Frames
    db.myactivity.postInsert(
      async (docData, doc: MyActivityDocument) => {
        // Parse location from MyActivity
        const locUrl = doc.locations ? doc.locations[0].url : undefined;
        const locRegex = /q=([^,]+),(.*)$/;

        let loc: {x: number, y: number}|undefined = undefined;
        if (locUrl) {
          const result = locRegex.exec(locUrl);
          if (result && result[0] && result[1]) {
            const [y, x]  = [Number(result[1]), Number(result[2])];
            loc = {x, y};
          }
        }

        await db.frames.insert({
          name: doc.title,
          timestamp: doc.time,
          loc,
          srcid: docData['_id'] + docData['_rev']
        });
        console.log('re-inserted ' + doc.title, loc);
      },
      true // async
    );
    return db;
  }

  public async export(dir = './') {
    let data = await this.arcsDb.dump();
    await writeFile('export-arcs.json', JSON.stringify(data, null, 2));
    data = await this.auditDb.dump();
    await writeFile(dir + 'export-audit.json', JSON.stringify(data, null, 2));
  }
}
