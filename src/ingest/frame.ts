import {RxDatabase, RxCollection, RxJsonSchema, RxDocument} from 'rxdb';

export type Frame = {
  name: string;
  timestamp: string;
  loc?: {x: number, y: number};   // consider using GeoJSON
  srcid?: string; // backref to imported data
};

export type FrameDocument = RxDocument<Frame>;
export type FrameCollection = RxCollection<Frame>;

// tslint:disable-next-line: variable-name
export const FrameSchema: RxJsonSchema = {
  title: 'frame schema',
  description: 'describes a specific activity',
  version: 0,
  type: 'object',
  properties: {
    name: { type: 'string' },
    timestamp: { type: 'string', format: 'date-time', index: true},
    loc: {type: 'object', properties: {x: {type: 'number'}, y: {type: 'number'}}},
    srcid: { type: 'string' }
  },
  required: ['timestamp', 'name']
};
