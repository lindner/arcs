// @license
// Copyright (c) 2018 Google Inc. All rights reserved.
// This code may only be used under the BSD style license found at
// http://polymer.github.io/LICENSE.txt
// Code distributed by Google as part of this project is also
// subject to an additional IP rights grant found at
// http://polymer.github.io/PATENTS.txt

/**
 * External interface into remote planning to allow for clean
 * separation/isolation.
 */

import {UserPlanner} from './user-planner.js';
import {UserContext} from './shell/user-context.js';
import {ArcFactory} from './arc-factory.js';

//const userid = '-LMtek9Mdy1iAc3MAkNx'; // Doug
//const userid = '-LMtek9Nzp8f5pwiLuF6'; // Maria
const userid = '-LMtek9LSN6eSMg97nXV'; // Cletus

const manifest = `
  import 'https://$artifacts/canonical.manifest'
`;

export class ShellPlanningInterface {
  static async start(assetsPath) {

    const factory = new ArcFactory(assetsPath);
    const context = await factory.createContext(manifest);
    const user = new UserContext();
    user._setProps({userid, context});
    const planner = new UserPlanner(factory, context, userid);
  }
}