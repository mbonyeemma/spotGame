import {
  RES_MSG,
} from '../../constant/response';
import BaseModel from '../../model/base.model';

class WalletHelper extends BaseModel {
  constructor() {
    super('');
    this.tableName = 'assets';
  }
  // Gives currrency list on status
  public async createAccount(userId: string, address:string, walletId:string) {
    return new Promise(async (resolve) => {
      const isAlreadyCreated: any = await this.isAccountExist(address);
      if (isAlreadyCreated === false) {
        this.callQuery(`CALL spCreateUser('${userId}','${address}');`).then(
          async (res) => {
           resolve( await this.createWallet(walletId,address))
          },
          (error) => {
            console.log(error)
            resolve(RES_MSG.ERROR);
          },
        );
      } else {
        resolve(RES_MSG.ACCOUNT_CREATED);
      }
    });
  }

  public async createWallet(walletId:string,address: string) {
    return new Promise(async (resolve) => {
        this.callQuery(`CALL wpCreateWallet('${walletId}','${address}','${process.env.DEFAULT_CURRENCY}');`).then(
          async (res) => {
            // await this.getAddress(memberId);
            resolve(true);
          },
          (error) => {
            console.log(error)
            resolve(RES_MSG.ERROR);
          },
        );
     
    });
  }

  public async createSession(userId: string, token:string) {
    return new Promise(async (resolve) => {
        this.callQuery(`CALL spCreateSession('${userId}','${token}');`).then(
          async (res) => {
            // await this.getAddress(memberId);
            resolve(true);
          },
          (error) => {
            resolve(RES_MSG.ERROR);
          },
        );
     
    });
  }


  public async getDepositesType(status: string) {
    return new Promise(async (resolve) => {
      // tslint:disable-next-line:max-line-length
      this.callQuery(
        `SELECT BIN_TO_UUID(id) as id ,key_name,name, status, payment_fee,extra_fee,orders, created_at, updated_at from deposits_type WHERE status = '${status}' ORDER BY orders ASC;`,
        'normal',
        true
      ).then(
        (res: any) => {
          resolve(res);
        },
        (error: any) => {
          resolve(false);
        },
      );
    });
  }


  public async isDepositesTypeExist(
    name: string,
    isDataRequired: boolean = false,
  ) {
    return new Promise((resolve) => {
      this.callQuery(`CALL spGetDepositesType('${name}');`).then(
        (res: any) => {
          if (res.length > 0) {
            if (isDataRequired) {
              resolve(res);
            } else {
              resolve(true);
            }
          } else {
            resolve(false);
          }
        },
        (error) => {
          resolve(false);
        },
      );
    });
  }

  

  public async PostTransaction(obj: any) {
    return new Promise((resolve) => {
      this.callQuery(`CALL wpCreateTransaction(
      '${obj.txId}',
      '${obj.walletId}',
      '${obj.amount}',
      '${obj.currency_id}',
      '${obj.tx_hash}',
      '${obj.fromAddress}',
      '${obj.toAddress}',
      '${obj.transType}'`).then(
        (res: any) => {
            resolve(true);
        },
        (error) => {
          console.log(error)
          resolve(false);
        },
      );
    });
  }

  public async UpdateBalance(walletId: string, newBalance:number) {
    return new Promise((resolve) => {
      this.callQuery(`CALL wpUpdateBalance('${walletId}',${newBalance});`).then(
        (res: any) => {
            resolve(true);
        },
        (error) => {
          console.log(error)
          resolve(false);
        },
      );
    });
  }

  public async GetAccountBalance(Address: string, currencyId:string) {
    return new Promise((resolve) => {
      this.callQuery(`CALL wpGetWallet('${Address}','${currencyId}');`).then(
        (res: any) => {
          if (res.length > 0) {
            const balanceInfo = res[0];
            const balance = {
              "amount": balanceInfo.balance,
              "currency": balanceInfo.currency_code,
              "updatedOn": balanceInfo.updated_on,
            }
               resolve(balance);
          } else {
            resolve(false);
          }
        },
        (error) => {
          resolve(false);
        },
      );
    });
  }

  public async GetCurrencyId(currency:string) {
    return new Promise((resolve) => {
      this.callQuery(`CALL GetCurrencyId('${currency}');`).then(
        (res: any) => {
          if (res.length > 0) {
               resolve(res[0]);
          } else {
            resolve(false);
          }
        },
        (error) => {
          resolve(false);
        },
      );
    });
  }

  public async GetWallet(Address: string,currencyId:string) {
      return new Promise((resolve) => {
        this.callQuery(`CALL wpGetWallet('${Address}','${currencyId}');`).then(
          (res: any) => {
            if (res.length > 0) {
                 resolve(res[0]);
            } else {
              resolve(false);
            }
          },
          (error) => {
            resolve(false);
          },
        );
      });
    }

  public async isAccountExist(
    Address: string,
    isDataRequired: boolean = false,
  ) {
    return new Promise((resolve) => {
      this.callQuery(`CALL spGetUserByAddress('${Address}');`).then(
        (res: any) => {
          if (res.length > 0) {
            if (isDataRequired) {
              resolve(res[0]);
            } else {
              resolve(true);
            }
          } else {
            resolve(false);
          }
        },
        (error) => {
          console.log(error)
          resolve(false);
        },
      );
    });
  }
  /**
   *
   * @param memberId
   * @param type // DEPOSIT OR WITHDRAW
   * @param amount
   */
 


  public async getWithdrawFeeRevenue(data: any) {
    return new Promise(async (resolve, reject) => {
      this.callQuery(`CALL spWithdrawFeeRevenue('${data.fromDate}','${data.toDate}')`)
        .then((res: any) => {
          resolve(res[0]);
        }, error => {
          resolve(false);
        });
    });
  }
  //---------------------------------------------_

}

export default new WalletHelper();
