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

import {Environment} from './environment.js';
import {ArcsRepo} from './repo.js';

import commander from 'commander';

import util from 'util';
import fs from 'fs';
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

/**
 * Top level entry point for the arcs command
 */
commander
  .version('1.0.0') // TODO add version from git
  .description('Arcs System');

commander
  .command('init')
  .description('Initialize Arcs')
  .action(async () => {
    const path = Environment.getRepoPath();
    
    console.log('Initializing Arcs for storage: ' + path);
    const arcsRepo = new ArcsRepo(path);
    await arcsRepo.init();
  });

commander
  .command('status')
  .description('Show the arcs status')
  .action(async () => {
    const path = Environment.getRepoPath();
    const arcsRepo = new ArcsRepo(path);
    await arcsRepo.open();

    console.log("Arcs Repo in " + arcsRepo.repoPath);
    console.log();

    // get recent audit
    console.log('AuditDb recent entries: ');

    const entries = await arcsRepo.recentAuditLogs();

    entries.forEach((entry) => {
      console.log(entry.timestamp + ' ' + entry.msg);
    });
    // TODO(lindner): add more
    
    await arcsRepo.close();
  });

commander
  .command('export')
  .description('Export Repo Contents')
  .action(async() => {
    const path = Environment.getRepoPath();
    const arcsRepo = new ArcsRepo(path);
    await arcsRepo.open();
    await arcsRepo.export();
    await arcsRepo.close();
  });

// External subcommands
commander
  .command('ingest', 'Ingest Data into Arcs');

commander
  .command('flowcheck', 'Analyze and Diagnose Dataflow');

commander
  .command('manifest', 'Handle Manifest files');


// Extra help at the end
commander.on('--help', () => {
  console.log(`
NOTES

  Arcs uses a repository in the local filesystem for configuration and
  default storage. By default, the repo is located at ~/.arcs. To
  change the repo location, set the $ARCS_PATH environment variable:

    export ARCS_PATH=/path/to/ipfsrepo
`);
});

// And finally parse the optionss
commander.parse(process.argv);

// Output help if nothing passed
if (!process.argv.slice(2).length) {
  commander.outputHelp();
}
