#!/usr/bin/env node --require esm
import commander from 'commander';

import RxDB, {RxDatabase, RxJsonSchema} from 'rxdb';
import PouchDbMemory from 'pouchdb-adapter-memory';
import PouchDbLevelDb from 'pouchdb-adapter-leveldb';

RxDB.plugin(PouchDbMemory);
RxDB.plugin(PouchDbLevelDb);

import {interval, from, of, combineLatest, bindNodeCallback} from 'rxjs';
import {concatMap, delay, take, combineAll, expand } from 'rxjs/operators';
import {map, pairwise} from 'rxjs/operators';

import process from 'process';
const processObserve = bindNodeCallback(process.on);

const main = async () => {
  const db = await RxDB.create({
    name: 'mydb',
    adapter: 'leveldb'
  });

  console.log('-- A R C S -- I N G E S T -- S Y S T E M --');
  
  const quitme = setInterval(() => {console.log('still running');}, 1000);
  
  process.on('SIGINT', () => {
    console.log('Exiting');
    clearInterval(quitme);
  });
};

(async () => {
  await main();
})();
