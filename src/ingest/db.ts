import RxDB, {RxDatabase, RxJsonSchema} from 'rxdb';
import PouchDbMemory from 'pouchdb-adapter-memory';
import PouchDbLevelDb from 'pouchdb-adapter-leveldb';
import PouchDbHttp from 'pouchdb-adapter-http';

RxDB.plugin(PouchDbMemory);
RxDB.plugin(PouchDbLevelDb);
RxDB.plugin(PouchDbHttp);

import {MyActivityDocument, MyActivityCollection, MyActivitySchema} from './myactivity';
import {FrameCollection, FrameSchema} from './frame';
import {ImportSchema} from './import';

export class Db {
  private constructor(public db: RxDatabase, public auditdb: RxDatabase, public memdb: RxDatabase) {
  }

  static async create(adapter: string = 'memory'): Promise<Db> {
    const db = await RxDB.create({
      name: 'ingest',
      adapter
    });

    const auditdb =  await RxDB.create({
      name: '/tmp/audit',
      adapter
    });

    const memdb = await RxDB.create({
      name: 'mem',
      adapter: 'memory'
    });

    db.$.subscribe(changeEvent => console.log('audit ' + changeEvent.data.op));
    
    return new Db(db, auditdb, memdb);
  }
  
  async createCollections(): Promise<RxDatabase> {
    // Replication could be enabled here
    const frameCollection = await this.db.collection({
      name: 'frames',
      schema: FrameSchema
      // optional per-doc, per-collection methods could go here
    });

    const myactivityCollection = await this.db.collection({
      name: 'myactivity',
      schema: MyActivitySchema
      // optional per-doc, per-collection methods could go here
    });

    const imports = await this.db.collection({
      name: 'imports',
      schema: ImportSchema
    });

    // postInsert Hook that maps from MyActivity to Frames
    this.db.myactivity.postInsert(
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

        await this.db.frames.insert({
          name: doc.title,
          timestamp: doc.time,
          loc,
          srcid: docData['_id'] + docData['_rev']
        });
        console.log('re-inserted ' + doc.title, loc);
      },
      true // async
    );

    return this.db;
  }
  
  shutdown() {
    this.db.destroy();
    this.auditdb.destroy();
    this.memdb.destroy();
  }
}
