/**
 * @license
 * Copyright (c) 2017 Google Inc. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
import util from 'util';
import fs from 'fs';
import os from 'os';

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

/**
 * A place to get and store static configuration for Arcs
 *
 * TODO(lindner) graduate this out of the cli world and reconcile with
 * other global storage mechanisms.  Also move all usages that
 * interact with the global environmen there.
 */
export class Environment {
  /**
   * Returns the Arcs repo directory based on:
   * - The `ARCS_PATH` environment variable, if set.
   * - Defaults to ~/.arcs
   */
  static getRepoPath(): string {
    return process.env.ARCS_PATH || os.homedir() + '/.arcs';
  }
}
