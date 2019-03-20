#!/usr/bin/env -S node --require esm --require source-map-support/register
/**
 * @license
 * Copyright (c) 2017 Google Inc. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import commander from 'commander';

/**
 * Top level entry point for the arcs command
 */
commander
  .version('1.0.0') // TODO add version from git
  .description('Arcs System')
  .command('ingest', 'Ingest Data into Arcs')
  .command('flowcheck', 'Analyze and Diagnose Dataflow')
  .command('manifest', 'Handle Manifest files')
  .parse(process.argv);
