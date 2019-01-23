import RxDB, {RxDatabase, RxCollection, RxJsonSchema, RxDocument, QueryChangeDetector} from 'rxdb';
import PouchDbMemory from 'pouchdb-adapter-memory';
import PouchDbLevelDb from 'pouchdb-adapter-leveldb';

RxDB.plugin(PouchDbMemory);
RxDB.plugin(PouchDbLevelDb);

import {MyActivityDocument, MyActivityCollection, MyActivitySchema} from './myactivity';
import {FrameCollection, FrameSchema} from './frame';

// All Collections in the Database
type DbCollections = {
  myactivity: MyActivityCollection;
  frames: FrameCollection;
}

export type IngestDb = RxDatabase<DbCollections>;

export class Db {
  constructor(private adapter: string = 'memory') {
  }
  
  async createDb(): Promise<IngestDb> {
    const db = await RxDB.create<DbCollections>({
      name: 'mydb',
      adapter: this.adapter
    });
    
    const myActivityCollection = await db.collection({
      name: 'myactivity',
      schema: MyActivitySchema
    });

    // Replication could be enabled here
    
    const frameCollection = await db.collection({
      name: 'frames',
      schema: FrameSchema
      // optional per-doc, per-collection methods could go here
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
          loc
        });
        console.log('re-inserted ' + doc.title, loc);
      },
      true // async
    );

    return db;
  }
}
