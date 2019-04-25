/**
 * @license
 * Copyright (c) 2017 Google Inc. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {PouchDB, PouchDbDebug, PouchDbMemory} from '../../../platform/pouchdb-web.js';

export interface UpsertDoc {
  version: number; // TODO version
}

export interface UpsertMutatorFn<T extends UpsertDoc> {
  (arg: T): Promise<T>;
}

/**
 * Provides a way to read-modify-write data for a given PouchDB key
 * based on the following rules:
 *
 * - A new entry based on defaultValue is stored if it doesn't exist.
 * - If the existing entry is available it is fetched.
 * - A copy of the existing document is pass passed to `mutatorFn`
 * - If the model is new or mutated by `mutatorFn`, write a new revision.
 *
 * @return the current value of data for `docId`
 * @param db The database where we send our get/put calls.
 * @param docId The value to get and set
 * @param mutatorFn A function that can optionally make changes to the existing entry.
 * @param defaultValue If the docId does not exist use this and also pass through mutatorFn.
 */
export async function upsert<T extends UpsertDoc>(
    db: PouchDB.Database,
    docId: string,
    mutatorFn?: UpsertMutatorFn<T>,
    defaultValue?: PouchDB.Core.NewDocument<T>): Promise<T> {

  // Keep retrying the operation until it succeeds.
  // TODO(lindner): add backoff and error out if this goes on for too long

  while (1) {
    let doc: T;
    let existingDoc = false;

    // Check for an existing document.
    try {
      doc = await db.get(docId);
      existingDoc = true;
    } catch (err) {
      if (err.name !== 'not_found') {
        throw err;
      }
      doc = {_rev: undefined, _id: docId, ...defaultValue};
    }

    // TODO deepClone? Readonly?  For now just use a shallow clone to avoid weirdness..
    const newDoc = await mutatorFn({...doc}) as PouchDB.Core.PutDocument<T>;

    // Just return if the doc exists and mutator didn't make any changes
    if (existingDoc && JSON.stringify(newDoc) === JSON.stringify(doc)) {
      return newDoc;
    }

    // Update the PouchDb docId key with data, bump the version number
    try {
      newDoc._id = docId;
      newDoc.version++;

      const putResult = await db.put(newDoc);
      return newDoc;
    } catch (err) {
      // If there's a conflict, keep trying, otherwise error out
      if (err.name !== 'conflict') {
        console.warn('PouchDbCollection.getModelAndUpdate (err,doc)=', err, doc);
        throw err;
      }
    }
  } // end while (1)

  // can never get here..
  throw new Error('unable to store');
}
