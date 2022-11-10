import * as cron from 'cron';

const CronJob = cron.CronJob;
class CronService {
  constructor() {
    console.log('cron service running');
    this.depositConfirmations();
  }
  public depositConfirmations() {
    const deposit = new CronJob(
      '*/59 * * * * *',
      async () => {
        // do something in the clone job
      },
      null,
      true,
      'America/Los_Angeles',
    );
  }

}
export default new CronService();
