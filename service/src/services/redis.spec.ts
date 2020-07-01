import { getRedis } from './redis';

let redis

describe('Redis', () => {
  
  afterAll(async () => await redis.disconnect())
  
  describe('check key exists', () => {    
    it('runs', async () => {
      const fn = async () => {
        redis = await getRedis()
        await redis.exists('key')
      }
      await expect(fn()).resolves.toBeUndefined()
    })
  })
})
