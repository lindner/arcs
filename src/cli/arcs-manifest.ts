#!/usr/bin/env -S node --require esm --require source-map-support/register
/**
 * @license
 * Copyright (c) 2019 Google Inc. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import commander from 'commander';
import {Runtime} from '../runtime/runtime.js';

import util from 'util';
import fs from 'fs';
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

/**
 * The `arcs manifest` command.
 */
commander.command('parse <filename>')
    .description('Parse a Manifest')
    .action(async (filename) => {
        try {
            const data = await readFile(filename, 'utf-8');
            const manifest = await Runtime.parseManifest(data, {fileName: filename});
            console.log(manifest);
        } catch (e) {
            console.warn(e);
        }
    })
    .parse(process.argv);
