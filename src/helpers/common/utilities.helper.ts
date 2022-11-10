import * as BigNumber from 'bignumber.js';
import * as jwt from 'jsonwebtoken';
import * as request from 'request';
import { CALCULATIONS } from '../../constant/response';
import BaseModel from '../../model/base.model';
import RedisHelper from './redis.helper';
const saltRounds = 10;
class UtilitiesHelper extends BaseModel {
  constructor() {
    super('');
    // this.redisCreateWithdrawList();
  }
  public generateJwt(jwtData: string) {
    return new Promise((resolve, reject) => {
      try {
        const JWT = jwt.sign({ jwtData }, process.env.JWTSECRET, {
          expiresIn: 86400,
        });
        console.log('JWT ' + JWT);
        resolve(JWT);
      } catch (error) {
        console.log('error', error);
        reject(error);
      }
    });
  }
  public getDateTime() {
    const currentUTCDate = new Date()
      .toISOString()
      .replace(/T/, ' ')
      .replace(/\..+/, '');
    return currentUTCDate;
  }
  public randomString(length: number): string {
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i += 1) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  public bn_operations(firstNum: string, secondNum: string, operation: string) {
    console.log('firstNum typeof', typeof firstNum);
    console.log('secondNum typeof', typeof secondNum);
    const a: any = new BigNumber.default(firstNum.toString());
    const b: any = new BigNumber.default(secondNum.toString());

    // const a: any = new BigNumber.default(firstNum);
    // const b: any = new BigNumber.default(secondNum);

    console.log('---------------debug----bn_operations--', { a, b });
    switch (operation.toLowerCase()) {
      case '-':
        return a.minus(b).toString();
        break;
      case '+':
        return a.plus(b).toString();
        break;
      case '*':
      case 'x':
        return a.multipliedBy(b).toString();
        break;
      case '÷':
      case '/':
        return a.dividedBy(b).toString();
        break;
      case '>=':
        return a.isGreaterThanOrEqualTo(b);
        break;
      case '>':
        return a.isGreaterThan(b);
        break;
      case '<=':
        return a.isLessThanOrEqualTo(b);
        break;
      case '<':
        return a.isLessThan(b);
        break;
      case '==':
        return a.isEqualTo(b);
        break;
      default:
        break;
    }
  }

  public convert_to_bn(value: number) {
    const x: any = new BigNumber.default(value);
    const y = new BigNumber.default(CALCULATIONS.SMALLEST_UNITS);
    return x.multipliedBy(y).toNumber();
  }
  public getDepostTransaction(tx: string = '', memId: string = '') {
    return new Promise(async (resolve) => {
      await this.callQuery(
        `CALL spGetDepsoitTransaction('${tx}','${memId}');`,
      ).then(
        (res) => {
          resolve(res);
        },
        (error) => {
          resolve(false);
        },
      );
    });
  }
  public async curlRequest(
    endpoint: string,
    header: object,
    data: any = '',
    rType: string = 'GET',
  ) {
    console.log(endpoint);
    return new Promise((resolve, reject) => {
      const options = {
        url: endpoint,
        // tslint:disable-next-line:object-shorthand-properties-first
        data,
        headers: header,
      };

      try {
        if (rType === 'GET') {
          request.get(options, (error, response, body) => {
            if (error) {
              reject(error);
            }
            const obj = {
              statusCode: response ? response.statusCode : 0,
              response: body,
            };
            resolve(obj);
          });
        }
        if (rType === 'POST') {
          const sendData = JSON.stringify(data);
          const options1 = {
            url: endpoint,
            // tslint:disable-next-line:object-shorthand-properties-first
            body: sendData,
            headers: header,
          };
          request.post(options1, (error, response, body) => {
            if (error) {
              console.log('post error', error);
              reject(error);
            }
            const obj = {
              statusCode: response ? response.statusCode : 0,
              response: body,
            };
            resolve(obj);
          });
        }
      } catch (error) {
        console.log('error curl', error);
        reject(error);
      }
    });
  }
  public async getWithdrawRequestAdmin(id: any) {
    return new Promise(async (resolve) => {
      // tslint:disable-next-line:max-line-length
      this.callQuery(`CALL spGetWithdrawById('${id}');`).then(
        (res: any) => {
          resolve(res);
        },
        (error: any) => {
          resolve(false);
        },
      );
    });
  }

}

export default new UtilitiesHelper();
