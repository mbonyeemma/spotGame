import * as Interfaces from '@interfaces';
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
        Middlewares.jwtMiddleware,
        this.Player,
      )
      .post(
        `${this.path}/wallet/:accountId/debit`,
        Middlewares.jwtMiddleware,
        this.DebitUser,
      )
      .post(
        `${this.path}/user`,
        //Middlewares.jwtMiddleware,
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
  private DebitUser = async (
    request: Interfaces.RequestWithUser,
    response: express.Response,
  ) => {
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
        tx_hash: txId,
        fromAddress: drAccount,
        toAddress: crAccount,
        transType: "WITHDRAW"
      }

      const txResponse: any = await Helpers.WalletHelper.PostTransaction(txObject);
      const updateBalanceDr: any = await Helpers.WalletHelper.UpdateBalance(drAccount, newDrBalance);
      const updateBalanceCr: any = await Helpers.WalletHelper.UpdateBalance(crAccount, newCrBalance);

      await Helpers.WalletHelper.callQuery('COMMIT;');

      const resp = {
        "operatorTransactionId": txId,
        "balance": {
          "amount": newCrBalance,
          "currency": currency,
          "updatedOn": "2021-12-31T23:59:59Z"
        },
        "timestamp": "2021-12-31T23:59:59Z"
      }

      return setResponse.success(response, resp);



    } catch (error) {
      await Helpers.WalletHelper.callQuery('ROLLBACK;');
      return setResponse.error(response, { message: "error" }, 304);

    }







    if (address != accountId) {
      return setResponse.error(response, { message: "Token doesn't match account Id" });
    }


    // tslint:disable-next-line:max-line-length
    return setResponse.success(response, {
      message: RES_MSG.ACCOUNT_CREATED
    });
  };

  private addUser = async (
    request: Interfaces.RequestWithUser,
    response: express.Response,
  ) => {
    try {



      await Helpers.WalletHelper.callQuery('START TRANSACTION;');

      var username = request.body.username;
      const address = request.body.address;
      const token = await Helpers.Utilities.randomString(32);
      var createAccount: any = true

      const accountInfo: any = await Helpers.WalletHelper.isAccountExist(address, true);
      console.log(accountInfo)
      if (accountInfo != false) {
        username = accountInfo.user_id
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
      return setResponse.error(response, { message: createAccount });

    } catch (error) {
      await Helpers.WalletHelper.callQuery('ROLLBACK;');

      return setResponse.error(response, { message: "error" });

    }
  };



}
export default WalletController;
