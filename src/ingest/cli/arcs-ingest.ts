#!/usr/bin/env -S node --require esm --require source-map-support/register
import commander from 'commander';

import {Db} from '../db';
import {Dat} from '../dat';

import {RxDatabase, RxCollection, RxJsonSchema, RxDocument} from 'rxdb';

import * as tf from '@tensorflow/tfjs';
import {TensorFlow} from '../tensorflow';

import {interval, from, of, combineLatest} from 'rxjs';
import {concatMap, delay, take, combineAll } from 'rxjs/operators';
import {map, pairwise} from 'rxjs/operators';

import {Import} from '../import';

import util from 'util';
import fs from 'fs';
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

commander
  .version('1.0.0')
  .option('-a --adapter [type]', 'Choose DB Adapter', 'leveldb');

//------------------------------------------------------------------
commander.command('dat')
  .description('basic dat')
  .action(async () => {
    const ingestdb = await Db.create(commander.adapter);
    const dat = await Dat.construct();
    console.log('works');
    console.log(dat);
    ingestdb.shutdown();
  });

commander.command('insert')
  .description('basic insert/query')
  .action(async () => {
    const ingestdb = await Db.create(commander.adapter);
    await ingestdb.createCollections();

    try {
      const db = ingestdb.db;
    
      // insert a doc, could also upsert
      const doc = await db.frames.insert({
        timestamp: new Date().toISOString(),
        name: 'foo',
        loc: {x: 37.7932834, y:-122.39435510000001}
      });
      
      console.log('SEARCH');
      
      const result = await db.frames.find()
            .where('name').eq('foo')
            .exec();
      console.log('RESULTS = ', result.length);
      
      result.forEach((f) => {console.log(f.name + ' ' + f.timestamp);});
    } finally {
      ingestdb.shutdown();
    }
  });

//------------------------------------------------------------------
commander.command('dump')
  .description('dump database to json')
  .action(async() => {
    const ingestdb = await Db.create(commander.adapter);
    await ingestdb.createCollections();

    // Dump the DB
    console.log('DB DUMP to dump.json');
    const dbData = await ingestdb.db.dump();
    await writeFile("dump.json", JSON.stringify(dbData, null, '  '));
    ingestdb.shutdown();
  });

//------------------------------------------------------------------
commander.command('query-observe')
  .description('demo of query observers')
  .action(async () => {
    const db = (await Db.create(commander.adapter)).db;

    // query -> observable
    db.frames.find().sort('-timestamp').limit(1).$.subscribe((hh) => {
      console.log('FRAME Changed ', hh[0].timestamp);
    });

    const doc = await db.frames.insert({
      timestamp: new Date().toISOString(),
      name: 'foo',
      loc: {x: 37.7932834, y:-122.39435510000001}
    });
    db.destroy();
  });


//------------------------------------------------------------------
commander.command('rxdbtensor')
  .description('Convert rxdb data to a tensorflowdata')
  .action(async () => {
    const db = (await Db.create(commander.adapter)).db;
    
    const result2 = await db.frames
      .find()
      .exec();

    // Convert to Tensorflow data
    console.log('TENSORFLOW');
    const tfd = tf.data.array(result2.map((o) => o.toJSON()));
    
    // Process tf.data
    const tfdNew = tfd
      .filter(o => o.name === 'foo')
      .map(o =>({'name': o.name}))
      .concatenate(tfd);

    // TODO Execute Machine Learning Model here.
    await tfdNew.forEach(e => console.log(e));
    db.destroy();
  });

//------------------------------------------------------------------
commander.command('lastfm')
  .description('Convert rxdb data to a tensorflowdata')
  .action(async () => {
    const db = (await Db.create(commander.adapter)).db;
    
    const lastFm = await TensorFlow.getLastFM();
    await lastFm.forEach( async e => {
      // common time based parsing needed
      const timestamp = new Date(e['timestamp'] * 1000).toISOString();
      
      const doc = await db.frames.insert({
        name: e['artist'] + ' ' + e['track'],
        timestamp
      });
    });
      
    db.destroy();
  });

//------------------------------------------------------------------
commander.command('myactivity')
  .description('import myactivity data')
  .action(async() => {
    try {
      const ingestdb = await Db.create(commander.adapter);
      
      await ingestdb.createCollections();
      
      const db = ingestdb.db;
      const data = await readFile('MyActivity.json', 'utf-8');
      
      const importdoc = await ingestdb.db.imports.insert({sourceuri: 'file://MyActivity.json', timefound: Date.now()});
      const attachment = await importdoc.putAttachment({id: 'MyActivity.json', data, type: 'application/json'});
      
      // TODO move to hook

      const items = JSON.parse(data);
      console.log("Read " + items.length + " myactivity items");
      
      
      for (const entry of items.slice(0,5)) {
        await db.myactivity.insert(entry);
      }
      console.log('Imported 5 items');
      ingestdb.shutdown();
    } catch(e) {
      console.log('error', e);
    }
    
  });
          
//------------------------------------------------------------------
commander.command('rxjs')
  .description('Convert rxdb data to a tensorflowdata')
  .action(async () => {

    // rxjs
    const musicdetector = from([null, null, 'Led Zeppelin', 'Led Zeppelin', null])
        .pipe(concatMap(item => of(item).pipe(delay(1200))
        ));
    const gps = from ([[0,0], [0,1], [0,2], [1,2], [2,2]])
        .pipe(concatMap(item=> of(item).pipe(delay(1000))));
    
    // Heartbeat provides timestamps
    const heartbeat = interval(1000)
          .pipe(map((x) =>({seq: x, now: Date.now()})));

    const allSensors = combineLatest(heartbeat, musicdetector, gps);
    
    const subscribe = allSensors.subscribe(
      ([heartbeat, musicdetector, gps]) => {
        console.log("heartbeat",heartbeat);
        console.log("music", musicdetector);
        console.log("gps", gps);
        // Weave together data
      }
    );
    // weave together.
    await setTimeout(() => {console.log('died');}, 3000);
  });

commander.parse(process.argv);
