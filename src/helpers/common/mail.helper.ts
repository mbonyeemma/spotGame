import * as express from 'express';
import * as nodemailer from 'nodemailer';
import * as striptags from 'striptags';
import App from '../../app';

class MailHelper  {
  public appObject: any;
  private mailerObj: any;
  constructor() {
    this.mailerObj =  this.mailConn();
  }
  public async sendMail(sendTo: string, subjectLine: string, textLine: string, template: string, res: any= '') {
    return new Promise(async(resolve, reject) => {
      await this.appObject.render(
          template, {
            subject:subjectLine,
            message: textLine},
          async (err: any, htmlview: any) => {
            try {
              this.mailerObj.sendMail({
                from: process.env.SMTP_FROM, // sender address
                to: sendTo, // list of receivers
                subject: subjectLine, // Subject line
                text: striptags(htmlview), // plain text body
                html: htmlview, // html body
              });
              resolve(true);
            } catch (e) {
              resolve(false);
            }
          });
    });
  }

  private mailConn() {
    const hostName: string = process.env.SMTP_HOST;
    const transporter = nodemailer.createTransport({
      host: hostName, // 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // generated ethereal user
        pass: process.env.SMTP_PASSWORD, // generated ethereal password
      },
    });
    return transporter;
  }
}
export default new MailHelper();
