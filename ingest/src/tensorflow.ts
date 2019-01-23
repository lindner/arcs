import util from 'util';
import fs from 'fs';
import * as tf from '@tensorflow/tfjs';
const readFile = util.promisify(fs.readFile);

export class TensorFlow {

  /**
   * Return rows from the tab-separated last.fm data in tracks.txt.  Data is timestamp, track, artist and album;
   * ``` 
   * 1547086768	Turn on the News	Hüsker Dü	Zen Arcade
   * ```
   */
  static async getLastFM(): Promise<tf.data.Dataset<tf.data.DataElement>> {
    const tracksFile = await readFile('./tracks.txt', 'utf-8');

    const lastFmData = new tf.data.CSVDataset(
      new tf.data.FileDataSource(Buffer.from(tracksFile)),
      {hasHeader: true, delimiter: '\t'}
    ).take(50);

    // Support filter, map, batch, concatenate, shuffle, foreach etc.
    // see https://js.tensorflow.org/api/latest/#Data
    
    return lastFmData;
  }
}
