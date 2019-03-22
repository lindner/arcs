import createDat from 'dat';


export class Dat {
  constructor() {
  }
  static async construct() {
    createDat("tmp", {temp: true}, (err, dat) => {
      console.log('hi');
      const network = dat.joinNetwork();
      network.once('connection', () => {
        console.log('Connected');
      });
    });
  }
}
