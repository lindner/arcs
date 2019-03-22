import RxDB, {RxDatabase, RxCollection, RxJsonSchema, RxDocument, QueryChangeDetector} from 'rxdb';

export type MyActivity = {
  header: string;
  title: string;
  time: string;
  description: string;
  products: string[];
  locations?: {name: string, url: string}[];
};

export type MyActivityDocument = RxDocument<MyActivity>;
export type MyActivityCollection = RxCollection<MyActivity>;

// tslint:disable-next-line: variable-name
export const MyActivitySchema: RxJsonSchema = {
  title: 'MyActivity schema',
  description: 'describes an item from MyActivity',
  version: 0,

  type: 'object',
  properties: {
    header: {type: 'string'},
    titleUrl: {type: 'string', format: 'uri'},
    title: {type: 'string'},
    time: {type: 'string', format: 'date-time'},
    description: {type: 'string'},
    products: {type: 'array', items: {'type': 'string'}},
    locations: {type: 'array', items:
                {'type': 'object', properties: {
                  name: {type: 'string'},
                  url: {type: 'string', format: "uri"}
                }}
               }
  },
  required: ['header', 'title', 'description', 'products']
};
