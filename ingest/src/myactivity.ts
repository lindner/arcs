import RxDB, {RxDatabase, RxCollection, RxJsonSchema, RxDocument, QueryChangeDetector} from 'rxdb';

export type MyActivity = {
  header: string;
  title: string;
  time: string;
  description: string;
  products: string[];
  locations?: {name: string, url: string}[];
}

export type MyActivityDocument = RxDocument<MyActivity>;
export type MyActivityCollection = RxCollection<MyActivity>;

export const MyActivitySchema: RxJsonSchema = {
  title: 'MyActivity schema',
  description: 'describes an item from MyActivity',
  version: 0,

  type: 'object',
  properties: {
    header: {type: 'string'},
    title: {type: 'string'},
    time: {type: 'string'},
    description: {type: 'string'},
    products: {type: 'array', items: {'type': 'string'}},
    locations: {type: 'array', items:
                {'type': 'object', properties: {
                  name: {type: 'string'},
                  url: {type: 'string'}
                }}
               }
  },
  required: ['header', 'title', 'description', 'products']
};
