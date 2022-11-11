import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import * as ejs from 'ejs';
import * as express from 'express';
import * as fileUpload from 'express-fileupload';
import * as path from 'path';
import * as config from '../src/config/';
import * as Helper from './helpers/index';
import { Controller } from './interfaces';
import { errorMiddleware } from './middlewares';
const mailHelper = Helper.mailHelper;
class App {
  public app: express.Application;
  constructor(controllers: Controller[]) {
    // config.initiate();
    this.app = express();
    this.app.use(cors())

    this.getProcessInfo();
    this.initializeMiddlewares();
    this.initializeControllers(controllers);
    this.initializeErrorHandling();
  }

  public listen() {
    this.app.listen(process.env.PORT ? process.env.PORT : 8081, () => {
      console.log(`App listening on the port ${process.env.PORT ? process.env.PORT : 8081}`);
      // console.log('Process ' + process.pid + ' is listening to all incoming requests');

    });
  }
  public getServer() {
    return this.app;
  }
  private initializeMiddlewares() {
    this.app.use(bodyParser.json());
    this.app.use(cookieParser());
    this.app.set('views', path.join(__dirname, 'views'));
    this.app.set('view engine', 'ejs');
    this.app.use(cors());
  }
  private initializeControllers(controllers: Controller[]) {
    console.log('this is base path =========== ','/' +process.env.BASE_PATH + '/status');
    controllers.forEach((controller) => {
      this.app.use('/' + process.env.BASE_PATH, controller.router);
    });
    this.app.get('/' +process.env.BASE_PATH + '/status', (req, res) => {
      return res.json({ status : 'success' });
    });
  }
  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  private getProcessInfo() {
    this.app.use((req, res, next) => {
      mailHelper.appObject = res;
      // console.log(`Process ID ${process.pid} has request`);
      next();
    });
  }
}
export default App;
