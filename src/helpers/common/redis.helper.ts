import * as redis from 'redis';
class RedisHelper {
  public client: redis.RedisClient;
  private host: any = process.env.REDIS_HOSTNAME;
  private port: string = process.env.REDIS_PORT;
  private auth: string = process.env.REDIS_AUTH;
  constructor() {
    this.client = redis.createClient(this.port, this.host);
    if (this.auth !== '') {
      this.client.auth(this.auth);
    }
    this.client.on('connect', () => {
      console.log('Redis Connected');
    });
  }
  // Set String value for given key
  // Note expires time secounds
  public setString(key: string, value: string, expires: number = 0, database: any = '') {
    if (database !== '') {
      this.client.select(database);
    }
    return new Promise((resolve, reject) => {
      this.client.set(key, value, (err, reply) => {
        if (err) {
          return reject(err);
        }
        // Add Expire Time if provided
        if (expires !== 0) {
          this.client.expire(key, (expires * 60));
        }
        resolve(reply);
      });
    });
  }
  // Get String value for given key
  public getString(key: string, database: any = '') {
    if (database !== '') {
      this.client.select(database);
    }
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, reply) => {
        if (err) {
          return reject(err);
        }
        resolve(reply);
      });
    });
  }

  public async deleteKey(key: string) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err, response) => {
        if (response === 1) {
          console.log(`in delte key response section ${key}`);
          resolve(response);
        } else {
          console.log(`in delte key error section ${key}`, err);
          return reject(err);
        }
      });
    });
  }
}
export default new RedisHelper();
