import * as cluster from 'cluster';
import * as os from 'os';
import * as config from '../src/config/';
// Loading Config
(async () => {
  await config.initiate();
})();
import App from './app';
import WallettController from './modules/wallet/wallet.controller';
const clusterEnable = process.env.CLUSTER === 'false' ? false : true ;
if (cluster.isMaster && clusterEnable) {
  const numWorkers = os.cpus().length;
  console.log('Master cluster setting up ' + numWorkers + ' workers...');
  for (let i: number = 0; i < numWorkers; i += 1) {
    cluster.fork();
  }
  cluster.on('online', (worker) => {
    console.log('Worker ' + worker.process.pid + ' is online');
  });

  cluster.on('exit', (worker, code, signal) => {
    console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
    console.log('Starting a new worker');
    cluster.fork();
  });

} else {
  const app = new App(
    [
      new WallettController(),
    ],
  );
  app.listen();
}
