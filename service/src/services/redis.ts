import * as config from 'config'
import * as IORedis from 'ioredis'
import { IConfigRedisService } from 'typings/config';

let redis: IORedis.Redis

export const getRedis = async () => {
  if (!redis) redis = await connect()
  return redis
}

export const connect = (): Promise<IORedis.Redis> => {
      const redisConfig = config.get<IConfigRedisService>('services.redis')

  const redisPromise = new Promise<IORedis.Redis>((resolve, reject) => {
    const redisInstance = new IORedis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
    });
    redisInstance.on('ready', () => resolve(redisInstance));
    redisInstance.on('error', e => {
      redisInstance.quit();
      return reject(e);
    });
  })
  return redisPromise
}
