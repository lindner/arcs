import {RxDatabase, RxCollection, RxJsonSchema, RxDocument} from 'rxdb';
import geojson from './geojson.json';

// tslint:disable-next-line: variable-name
export const GeoJsonSchema: RxJsonSchema = {
  ...geojson,
  // TODO: calculate a version from the underlying geojson.json
  version: 0
}
