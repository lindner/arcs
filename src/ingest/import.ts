import {RxDatabase, RxCollection, RxJsonSchema, RxDocument} from 'rxdb';

export type Import = {
  sourceuri: string;
  timefound: Date;
  // TODO metadata about the import, details about the code, machine, etc.
};

// tslint:disable-next-line: variable-name
export const ImportSchema: RxJsonSchema = {
  title: 'import schema',
  description: 'a specific file import',
  version: 0,
  attachments: {encrypted: false},
  type: 'object',
  properties: {
    sourceuri: { type: 'string' },
    timefound: { type: 'number',  index: true},
  },
  required: ['sourceuri', 'timefound']
};
