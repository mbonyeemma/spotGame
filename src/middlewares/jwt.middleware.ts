import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { MIDDLEWARE_RESPONSE, RESPONSES } from '../constant/response';
import * as Helpers from '../helpers';
declare module 'express' {
    interface Request {
      userInfo: any;
    }
}
const setResponse = Helpers.ResponseHelper;
async function validateToken(request: Request, response: Response, next: NextFunction) {
  const token = request.body.token || request.query.token || request.headers['x-stp-token'];
  const sentApiKey =  request.headers['x-stp-api-key'];
  const api_key =  process.env.API_KEY;
  console.log(token);

  try {
    if(sentApiKey !=api_key){
      return setResponse.error(response, "Invalid API Key", RESPONSES.UNAUTHORIZED );
    }
    const exist = await Helpers.RedisHelper.getString('jwt_token_' + token, 0);
    console.log('exist', exist);
      // check if token exist or not
    if (exist != null) {
      request.userInfo = exist;
      console.log('next and decode is ', exist);
      return  next();
    } else {
      return setResponse.error(response, MIDDLEWARE_RESPONSE.JWTERROR, RESPONSES.UNAUTHORIZED );
    }
  } catch (error) {
    console.log('catch Error', error);
    return setResponse.error(response, MIDDLEWARE_RESPONSE.JWTERROR);
  }
}

export default validateToken;
