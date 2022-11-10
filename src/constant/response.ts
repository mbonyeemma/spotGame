export const RESPONSES = {
  SUCCESS: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NOCONTENT: 204,
  BADREQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOTFOUND: 404,
  TIMEOUT: 408,
  TOOMANYREQ: 429,
  INTERNALSERVER: 500,
  BADGATEWAYS: 502,
  SERVICEUNAVILABLE: 503,
  GATEWAYTIMEOUT: 504,
};

export const RES_MSG = {
  CURRENCY_LIST: 'Data has been saved successfully.',
  CURRENCY_DOES_NOT_EXIST: 'Currency does not exist.',
  CURRENCY_NOT_FOUND: 'Currency not found in db.',
  ERROR: 'There is something wrong. Please try later.',
  ACCOUNT_CREATED: 'Account has been created successfully.',
  DEPOSIT_TYPE_ADDED: 'Deposits type added successfully.',
};

export const MIDDLEWARE_RESPONSE = {
  JWTERROR: 'Unauthorize Request',
  PERMISSION_DENIED: 'Permission has been denied for this user.',
};
export const CALCULATIONS = {
  SMALLEST_UNITS: process.env.SMALLEST_UNIT,
};

export const MAIL_MSG = {
  BITGO_TRANSFER_ERROR: {
    TITLE: 'BitGO Process Not Working on {{env}}',
    BODY: 'Bitgo process has been stoped, Please check it.',
    SUBJECT: 'BitGo Error High Alert! on {{env}}',
    TEMPLATE: 'common',
  },
};

export const API_END_POINTS = {
  GET_USER_INFO: 'share/get-user-info',
};

export enum AccountVersionTypes {
  Deposit = 0,
  Withdraw = 1,
  OrderPlaced = 2,
  Trade = 3,
  Refferal = 4,
  Cancelled = 5,
  Giftcard = 6,
  BuySell = 7,
}


export const QUEUE_NAME = {
  UPDATEBALANCE: "updateAllBalances"
};