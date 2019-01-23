#!/usr/bin/env node --require esm
import commander from 'commander'

import {Db} from '../db';
import * as tf from '@tensorflow/tfjs';
import {TensorFlow} from '../tensorflow';
import {interval} from 'rxjs';
import {map, pairwise} from 'rxjs/operators';

import util from 'util';
import fs from 'fs';
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

commander
  .version('1.0.0')
  .description('Arcs Ingest System')
  .option('-a --adapter [type]', 'Choose DB Adapter', 'leveldb')

//------------------------------------------------------------------
commander.command('insert')
  .description('basic insert/query')
  .action(async () => {
    const db = await new Db(commander.adapter).createDb();

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
    db.destroy();
  });

//------------------------------------------------------------------
commander.command('dump')
  .description('dump database to json')
  .action(async() => {
    const db = await new Db(commander.adapter).createDb();

    // Dump the DB
    console.log('DB DUMP to dump.json');
    const dbData = await db.dump();
    await writeFile("dump.json", JSON.stringify(dbData, null, '  '));
    db.destroy();
  });


//------------------------------------------------------------------
commander.command('query-observe')
  .description('demo of query observers')
  .action(async () => {
    const db = await new Db(commander.adapter).createDb();

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
    const db = await new Db(commander.adapter).createDb();
    
    const result2 = await db.frames
      .find()
      .exec();

    // Convert to Tensorflow data
    console.log('TENSORFLOW');
    const tfd = tf.data.array(result2.map((o) => o.toJSON()))
    
    // Process tf.data
    const tfdNew = tfd
      .filter(o => o.name === 'foo')
      .map(o => {return {'name': o.name};})
      .concatenate(tfd);

    // TODO Execute Machine Learning Model here.
    await tfdNew.forEach(e => console.log(e));
    db.destroy();
  });

//------------------------------------------------------------------
commander.command('lastfm')
  .description('Convert rxdb data to a tensorflowdata')
  .action(async () => {
    const db = await new Db(commander.adapter).createDb();
    
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
    const db = await new Db(commander.adapter).createDb();
    const data = await readFile('MyActivity.json', 'utf-8');
    const items = JSON.parse(data);
    console.log("Read " + items.length + " myactivity items");

    for (const entry of items.slice(0,5)) {
      await db.myactivity.insert(entry);
    }
    console.log('Imported 5 items');
    db.destroy();
  });
          
//------------------------------------------------------------------
commander.command('rxjs')
  .description('Convert rxdb data to a tensorflowdata')
  .action(async () => {

    // rxjs
    // Make heartbeat that can override Date
    const heartbeat = interval(1000)
      .pipe(map((x) => {return {seq: x, now: Date.now()};}))
      .pipe(pairwise());

    // TODO random song (or generate from json?)
    const subscribe = heartbeat.subscribe(val => console.log(val));
    const subscribe2 = heartbeat.subscribe(val => console.log('v' + val));

    // weave together.
    await setTimeout(() => {console.log('died');}, 3000);
  });


commander.parse(process.argv);
