import * as db from '../helpers/common/db.helper';
class BaseModel {
  public tableName: string;
  public insertion: string;
  public selectCols: string;
  public selectWhere: string = '';
  public offsets: number = 0;
  public limits: number = 10;
  public orderBy: string = '';
  public orderIs: string = '';
  public updation: string;
  public updateWhere: string = '';
  public insertPrimaryKey: string;
  constructor(value: string) {
    this.tableName = value;
  }
  public inserRecords() {
    // tslint:disable-next-line:max-line-length
    const query = 'CALL insertData("' + this.tableName + '","'
      + this.insertion + '","' + this.insertPrimaryKey + '");';
    console.log(query);
    const result = db.default.pdo(query);
    return result;

  }
  public selectRecords() {
    // tslint:disable-next-line:max-line-length
    const query = 'call SelectData("' + this.selectCols + '","' + this.tableName + '","' + this.selectWhere + '",' + this.offsets + ',' + this.limits + ',"' + this.orderBy + '","' + this.orderIs + '");';
    console.log(query);
    const result = db.default.pdo(query);
    this.resetSelectSettings();
    return result;
  }

  public updateRecords() {
    // tslint:disable-next-line:max-line-length
    const query = 'call updateData("' + this.tableName + '","' + this.updation + '","' + this.updateWhere + '");';
    // console.log(query);
    const result = db.default.pdo(query);
    return result;
  }
  public async callQuery(query: string, connType: string = 'normal', isAll = false) {
    console.log("query",query);
    const result = db.default.pdo(query, connType, isAll);
    this.resetSelectSettings();
    return result;
  }
  private resetSelectSettings() {
    this.selectWhere = '';
    this.orderBy = '';
    this.orderIs = '';
    this.selectCols = '';
  }
}
export default BaseModel;
