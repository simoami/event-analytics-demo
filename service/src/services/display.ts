import { getRedis } from './redis'
import * as moment from 'moment'
import { ServerError } from '../lib/ServerError'

const EVENTS_SET_KEY = 'events'
const FILTERED_EVENTS_SET_KEY = 'filteredevents'

const storeEvent = async (event): Promise<number> => {
  try {
    const redis = await getRedis()
    const id = await redis.incr('event:id')
    const eventKey = `event:${id}`
    const typeKey = `events:${event.type}`
    const productKey = `products:${event.productId}`

    let [[, result]] = await redis
      .pipeline()
      // store event hash
      .hmset(eventKey, { ...event, id })
      // add event id/timestamp to sorted set for future querying by time range
      .zadd(EVENTS_SET_KEY, event.timestamp, String(id))
      // alternatively store events per various metrics to use for filtering 
      .zadd(typeKey, event.timestamp, String(id))
      .zadd(productKey, event.timestamp, String(id))
      .exec()

    if (result !== 'OK') {
      throw new ServerError(500, 'Could not insert data to Redis')
    }
    return id
  } catch (error) {
    throw new ServerError(500, error.message)
  }
}

/**
 * store a pick up event
 * @param displayId 
 * @param productId 
 * @param productName 
 * @param timestamp 
 */
export const pickUp = async (displayId: string, productId: string, productName: string, timestamp: string) => {
  try {
    const redis = await getRedis()
    const id = await redis.incr('event:id')
    const event = {
      displayId,
      productId,
      productName,
      type: 'pickup',
      timestamp: moment(timestamp).valueOf(),
    }
    return await storeEvent(event)
  } catch(error) {
    throw new ServerError(500, error.message)
  }
}

/**
 * store a screen touch event
 * @param displayId 
 * @param productId 
 * @param productName 
 * @param target 
 * @param timestamp 
 */
export const screenTouch = async (displayId: string, productId: string, productName: string, target: string, timestamp: string) => {
  try {
    const event = {
      displayId,
      productId,
      productName,
      type: 'screentouch',
      target,
      timestamp: moment(timestamp).valueOf(),
    }
    return await storeEvent(event)
  } catch (error) {
    throw new ServerError(500, error.message)
  }
}

/**
 * store a put down event
 * @param displayId 
 * @param productId 
 * @param productName 
 * @param timestamp 
 */
export const putDown = async (displayId: string, productId: string, productName: string, timestamp: string) => {
  try {
    const event = {
      displayId,
      productId,
      productName,
      type: 'putdown',
      timestamp: moment(timestamp).valueOf(),
    }
    return await storeEvent(event)
  } catch (error) {
    throw new ServerError(500, error.message)
  }
}

/**
 * get all events in a given range
 * @param from The start unix timestamp of the requested range
 * @param to The end unix timestamp of the requested range
 * @param productId (optional) The product id to filter by
 * @param eventTypes (optional) The events to filter by
 */
export const getEvents = async (from: number, to: number, productId: string, eventTypes: string[] = []) => {
  try {
    const redis = await getRedis()
    const filterKeys = []
    if (eventTypes.length > 0) {
      eventTypes.forEach(type => filterKeys.push(`events:${type}`))
    }
    // determine what set to use for filtering 
    let targetSet = filterKeys.length > 0 ? FILTERED_EVENTS_SET_KEY : EVENTS_SET_KEY

    if (filterKeys.length > 0) {
      // perform filtering by events using union of the event specific sets
      await redis.zunionstore(targetSet, filterKeys.length, ...filterKeys, 'AGGREGATE', 'min')
    }

    if (productId) {
      // perform filtering to a product id using intersection with the previous filtered set or the whole set
      await redis.zinterstore(targetSet, 2, targetSet, `products:${productId}`, 'AGGREGATE', 'min')
    }

    // perform range filtering
    const ids = await redis.zrangebyscore(targetSet, from, to)
    if (!ids.length) return []

    // fetch all the events objects individually. 
    // Note that this might be a performance bottleneck depending on matching record volume and whether transactions are efficients this way or not.
    // one way to avoid performance issues is by limiting the query range to max 2 weeks or less.
    const multi = await redis.multi()
    console.log('result ids', ids)
    ids.forEach(id => {
      multi.hgetall(`event:${id}`)
    });
    const result = await multi.exec()
  
    return result.map(([, data]) => data)
  } catch (error) {
    console.error(error)
    throw new ServerError(500, error.message)
  }
}
