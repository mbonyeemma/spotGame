import * as Interfaces from '@interfaces';
import { Console } from 'console';
import * as express from 'express';
import {
  RESPONSES,
  RES_MSG
} from '../../constant/response';
import * as Helpers from '../../helpers';
import * as Middlewares from '../../middlewares';
const setResponse = Helpers.ResponseHelper;

class WalletController implements Interfaces.Controller {
  public path = '';
  public router = express.Router();
  constructor() {
    this.initializeRoutes();
  }
  private initializeRoutes() {
    this.router
      .all(`${this.path}/*`)
      .get(
        `${this.path}/player`,
        Middlewares.apiRateLimitMiddleware,
        Middlewares.jwtMiddleware,
        this.Player,
      )
      .post(
        `${this.path}/wallet/:accountId/debit`,
        Middlewares.apiRateLimitMiddleware,
        Middlewares.jwtMiddleware,
        this.DebitUser
      )
      .post(
        `${this.path}/wallet/:accountId/credit`,
        Middlewares.apiRateLimitMiddleware,
        this.CreditUser
      )
      .delete(
        `${this.path}/wallet/:accountId/:transactionId`,
        Middlewares.apiRateLimitMiddleware,
        this.RevertTransaction,
      )
      .get(
        `${this.path}/wallet/:accountId/:transactionId`,
        Middlewares.apiRateLimitMiddleware,
        this.GetTransaction,
      )
      .post(
        `${this.path}/user`,
        //Middlewares.jwtMiddleware,
        Middlewares.apiRateLimitMiddleware,
        this.addUser,
      )


  }

  private Player = async (
    request: Interfaces.RequestWithUser,
    response: express.Response,
  ) => {
    try {

      const address = request.userInfo
      const accountInfo: any = await Helpers.WalletHelper.isAccountExist(address, true);
      if (accountInfo == false) {
        return setResponse.error(response, "not found", RESPONSES.UNAUTHORIZED);
      }
      const balanceInfo: any = await Helpers.WalletHelper.GetAccountBalance(address, process.env.DEFAULT_CURRENCY);
      return setResponse.success(response, {
        "accountId": address,
        "displayName": accountInfo.username,
        "balance": balanceInfo
      });

    } catch (error) {
      console.log('coms in err section');
      const responseObj = { message: RES_MSG.CURRENCY_NOT_FOUND };
      return setResponse.error(response, responseObj);
    }
  };

  private GetTransaction = async (request: Interfaces.RequestWithUser, response: express.Response,
  ) => {
    const transactionId = request.params.transactionId;
    const accountId = request.params.accountId;
    const address = accountId
    // request.userInfo;

    if (address != accountId) {
      return setResponse.error(response, { message: "Account id does not match auth token" });
    }
    const transInfo: any = await Helpers.WalletHelper.GetTransaction(transactionId);
    if (transInfo.length == 0) {
      return setResponse.error(response, { message: "Not found, transaction ID could not be found" }, 404);
    }
    const currencyId = transInfo.currency_id
    const txId = transInfo.tx_id;

    const balanceInfo: any = await Helpers.WalletHelper.GetAccountBalance(address, currencyId);
    return setResponse.success(response, {
      "operatorTransactionId": txId,
      "balance": balanceInfo,
      "timestamp": new Date()
    });
  }

  private RevertTransaction = async (request: Interfaces.RequestWithUser, response: express.Response,
  ) => {
    console.log("RevertTransaction")
    const transactionId = request.params.transactionId;
    const accountId = request.params.accountId;
    const address = accountId //request.userInfo;
    const poolAccount = process.env.POOL_ACCOUNT


    const transInfo: any = await Helpers.WalletHelper.GetTransaction(transactionId);
    if (transInfo.length == 0) {
      return setResponse.error(response, { message: "Not found, transaction ID could not be found" }, 404);
    }
    const txStatus = transInfo.status
    const transType = transInfo.transType
    const currencyId = transInfo.currency_id
    const amount = transInfo.amount
    const currency = transInfo.currency_code
    const txId = transInfo.tx_id;



    if (txStatus == 'REVERSED') {
      return setResponse.error(response, { message: "error" }, 304);
    }

    var userWallet: any = await Helpers.WalletHelper.GetWallet(address, currencyId);
    var poolWallet: any = await Helpers.WalletHelper.GetWallet(poolAccount, currencyId);

    var debitWallet = userWallet;
    var creditWallet = poolWallet;

    if (transType == 'WITHDRAW') {
      debitWallet = userWallet
      creditWallet = poolWallet
    }

    const drBalance = debitWallet.balance
    const crBalance = creditWallet.balance

    const newDrBalance = drBalance - amount
    const newCrBalance = crBalance + amount

    const drAccount = debitWallet.wallet_id
    const crAccount = creditWallet.wallet_id

    try {


      await Helpers.WalletHelper.callQuery('START TRANSACTION;');
      var updateBalanceDr, updateBalanceCr: any = false;
      const txResponse: any = await Helpers.WalletHelper.UpdateTransactionStatus(txId, "REVERSED");
      if (txResponse) {
        updateBalanceDr = await Helpers.WalletHelper.UpdateBalance(drAccount, newDrBalance);
        updateBalanceCr = await Helpers.WalletHelper.UpdateBalance(crAccount, newCrBalance);
      }

      if (txResponse == false || updateBalanceDr == false || updateBalanceCr == false) {
        await Helpers.WalletHelper.callQuery('ROLLBACK;');
        return setResponse.error(response, { message: "error" }, 304);
      }

      await Helpers.WalletHelper.callQuery('COMMIT;');
      var datetime = new Date();

      const resp = {
        "operatorTransactionId": txId,
        "balance": {
          "amount": newCrBalance,
          "currency": currency,
          "updatedOn": datetime
        },
        "timestamp": datetime
      }

      return setResponse.success(response, resp);



    } catch (error) {
      await Helpers.WalletHelper.callQuery('ROLLBACK;');
      return setResponse.error(response, { message: "error" }, 304);

    }



  }

  private DebitUser = async (
    request: Interfaces.RequestWithUser,
    response: express.Response,
  ) => {
    console.log("body", request.body)
    const accountId = request.params.accountId;
    const address = request.userInfo;
    const transactionId = request.body.transactionId
    const gameId = request.body.gameId
    const gameKind = request.body.gameKind
    const gameVariant = request.body.gameVariant
    const gamePlayId = request.body.gamePlayId
    const stake = request.body.stake
    var amount = stake.amount
    const currency = stake.currency
    const isFreeRound = request.body.isFreeRound
    const poolAccount = process.env.POOL_ACCOUNT
    if (isFreeRound) {
      amount = 0
    }

    if (transactionId == undefined || gameId == undefined || gameKind == undefined || gameId == gamePlayId || amount == undefined || accountId == undefined) {
      return setResponse.error(response, { message: "some fields are missing" });

    }


    if (accountId != address) {
      return setResponse.error(response, { message: "Account mismatch" });
    }
    const transInfo: any = await Helpers.WalletHelper.GetTransaction(transactionId);
    if (transInfo.length > 0) {
      return setResponse.error(response, { message: "already processed" }, 304);
    }

    const currencyInfo: any = await Helpers.WalletHelper.GetCurrencyId(currency);
    if (currencyInfo == false) {
      return setResponse.error(response, { message: "Currency not supported" });
    }
    const currencyId = currencyInfo.id;
    const debitWallet: any = await Helpers.WalletHelper.GetWallet(address, currencyId);
    const creditWallet: any = await Helpers.WalletHelper.GetWallet(poolAccount, currencyId);

    if (debitWallet == false) {
      return setResponse.error(response, { message: "Account not found" });
    }
    if (creditWallet == false) {
      return setResponse.error(response, { message: "credit Wallet not found" });
    }

    const drBalance = debitWallet.balance
    const crBalance = creditWallet.balance

    const newDrBalance = drBalance - amount
    const newCrBalance = crBalance + amount

    const drAccount = debitWallet.wallet_id
    const crAccount = creditWallet.wallet_id

    if (newDrBalance < 0) {
      return setResponse.error(response, { message: "Insufficent funds" }, 402);
    }

    try {

      const txId = await Helpers.Utilities.randomString(32);

      await Helpers.WalletHelper.callQuery('START TRANSACTION;');
      const txObject = {
        txId: txId,
        walletId: drAccount,
        amount: amount,
        currency_id: currencyId,
        tx_hash: transactionId,
        fromAddress: drAccount,
        toAddress: crAccount,
        transType: "WITHDRAW",
        status: "SUCCESS"
      }

      var updateBalanceDr, updateBalanceCr: any = false;

      const txResponse: any = await Helpers.WalletHelper.PostTransaction(txObject);
      if (txResponse) {
        updateBalanceDr = await Helpers.WalletHelper.UpdateBalance(drAccount, newDrBalance);
        updateBalanceCr = await Helpers.WalletHelper.UpdateBalance(crAccount, newCrBalance);
      }

      if (txResponse == false || updateBalanceDr == false || updateBalanceCr == false) {
        await Helpers.WalletHelper.callQuery('ROLLBACK;');
        return setResponse.error(response, { message: "error" }, 304);
      }

      await Helpers.WalletHelper.callQuery('COMMIT;');
      var datetime = new Date();

      const resp = {
        "operatorTransactionId": txId,
        "balance": {
          "amount": newCrBalance,
          "currency": currency,
          "updatedOn": datetime
        },
        "timestamp": datetime
      }

      return setResponse.success(response, resp);



    } catch (error) {
      await Helpers.WalletHelper.callQuery('ROLLBACK;');
      return setResponse.error(response, { message: "error" }, 304);

    }

  };

  private CreditUser = async (
    request: Interfaces.RequestWithUser,
    response: express.Response,
  ) => {
    console.log("Body", request.body)
    const accountId = request.params.accountId;
    const address = accountId; //request.userInfo;
    const transactionId = request.body.transactionId
    const gameId = request.body.gameId
    const gameKind = request.body.gameKind
    const gameVariant = request.body.gameVariant
    const gamePlayId = request.body.gamePlayId
    const stake = request.body.payout
    var amount = stake.amount
    const currency = stake.currency
    const poolAccount = process.env.POOL_ACCOUNT

    if (transactionId == undefined || gameId == undefined || gameKind == undefined || gameId == gamePlayId || amount == undefined || accountId == undefined) {
      return setResponse.error(response, { message: "some fields are missing" });

    }

    const transInfo: any = await Helpers.WalletHelper.GetTransaction(transactionId);

    if (transInfo != false) {
      return setResponse.error(response, { message: "already processed" }, 304);
    }


    const currencyInfo: any = await Helpers.WalletHelper.GetCurrencyId(currency);
    if (currencyInfo == false) {
      return setResponse.error(response, { message: "Currency not supported" });
    }
    const currencyId = currencyInfo.id;
    const creditWallet: any = await Helpers.WalletHelper.GetWallet(address, currencyId);
    const debitWallet: any = await Helpers.WalletHelper.GetWallet(poolAccount, currencyId);

    if (debitWallet == false) {
      return setResponse.error(response, { message: "Account not found" });
    }
    if (creditWallet == false) {
      return setResponse.error(response, { message: "credit Wallet not found" });
    }

    const drBalance = debitWallet.balance
    const crBalance = creditWallet.balance

    const newDrBalance = drBalance - amount
    const newCrBalance = crBalance + amount

    const drAccount = debitWallet.wallet_id
    const crAccount = creditWallet.wallet_id

    if (newDrBalance < 0) {
      return setResponse.error(response, { message: "Insufficent funds" }, 402);
    }

    try {

      const txId = await Helpers.Utilities.randomString(32);

      await Helpers.WalletHelper.callQuery('START TRANSACTION;');
      const txObject = {
        txId: txId,
        walletId: drAccount,
        amount: amount,
        currency_id: currencyId,
        tx_hash: transactionId,
        fromAddress: drAccount,
        toAddress: crAccount,
        transType: "DEPOSIT",
        status: "SUCCESS"
      }

      var updateBalanceDr, updateBalanceCr: any = false;

      const txResponse: any = await Helpers.WalletHelper.PostTransaction(txObject);
      if (txResponse) {
        updateBalanceDr = await Helpers.WalletHelper.UpdateBalance(drAccount, newDrBalance);
        updateBalanceCr = await Helpers.WalletHelper.UpdateBalance(crAccount, newCrBalance);
      }

      if (txResponse == false || updateBalanceDr == false || updateBalanceCr == false) {
        await Helpers.WalletHelper.callQuery('ROLLBACK;');
        return setResponse.error(response, { message: "error" }, 304);
      }
      var datetime = new Date();


      const resp = {
        "operatorTransactionId": txId,
        "balance": {
          "amount": newCrBalance,
          "currency": currency,
          "updatedOn": datetime
        },
        "timestamp": datetime
      }


      await Helpers.WalletHelper.callQuery('COMMIT;');

      return setResponse.success(response, resp);



    } catch (error) {
      await Helpers.WalletHelper.callQuery('ROLLBACK;');
      return setResponse.error(response, { message: "error" }, 304);

    }
  };

  private addUser = async (
    request: Interfaces.RequestWithUser,
    response: express.Response,
  ) => {
    try {
      await Helpers.WalletHelper.callQuery('START TRANSACTION;');
      var username = request.body.username;
      const address = request.body.address;
      var token = await Helpers.Utilities.randomString(32);
      var createAccount: any = true

      const accountInfo: any = await Helpers.WalletHelper.isAccountExist(address, true);
      console.log(accountInfo)
      if (accountInfo != false) {
        username = accountInfo.user_id
        token = accountInfo.token
      } else {
        createAccount = await Helpers.WalletHelper.createAccount(username, address, token);
        if (createAccount === true) {
          const tokenResponse = await Helpers.WalletHelper.createSession(username, token);
        }
      }

      const responseObj = { message: "success", token: token, username: username, address: address };

      if (createAccount === true) {
        await Helpers.RedisHelper.setString('jwt_token_' + token, address);
        await Helpers.WalletHelper.callQuery('COMMIT;');
        return setResponse.success(response, responseObj);
      }
      await Helpers.WalletHelper.callQuery('ROLLBACK;');
      return setResponse.error(response, { message: "username exists" });

    } catch (error) {
      await Helpers.WalletHelper.callQuery('ROLLBACK;');

      return setResponse.error(response, { message: "error" });

    }
  };



}
export default WalletController;
