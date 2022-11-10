import { RESPONSES } from '../../constant/response';

class ResponseHelper {
  public success(response: any, responseData: any = {}) {
    return response.status(RESPONSES.SUCCESS).send(responseData);
  }
  public error(response: any, responseData: any = {}, statusCode:any=RESPONSES.BADREQUEST) {
    return response.status(statusCode).send(responseData);
  }
  
  public notfound(response: any, responseData: any = {}) {
    return response.status(RESPONSES.NOTFOUND).send(responseData);
  }
}
export default new ResponseHelper();
