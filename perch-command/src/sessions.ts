import {Moment} from 'moment'
import * as ora from 'ora'
import got from 'got'

const MIN_SESSION_DURATION = 5
const MAX_SESSION_DURATION = 180
const MIN_PAUSE_BETWEEN_SESSIONS = 120
const MAX_PAUSE_BETWEEN_SESSIONS = 60 * 60 * 2 // 2 hour in this example. Would require checking stats
const MIN_PAUSE_BETWEEN_INTERACTIONS = 5
const MAX_PAUSE_BETWEEN_INTERACTIONS = 30
const MAX_INTERACTIONS = 10
const BASE_URL = 'http://localhost:8080/api'
const DISPLAY_ID = 1

const targetButtons = ['button:reviews', 'button:video', 'button:accessories']

async function asyncForEach(list: any[], callback): Promise<any[]> {
  const results: any[] = []
  for (let index = 0; index < list.length; index++) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await callback(list[index], index, list))
  }
  return results
}

function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const pushEvent = async event => {
  const url = `${BASE_URL}/v1/displays/${DISPLAY_ID}/events`
  const response = await got.post(url, {json: event})
  // simulate a .5s network latency purely to see console interactions
  await timeout(100)
  return response.body
}

/**
 * Increases the current date time by a few seconds for the next interaction
 * @param {Moment} time The current date time to mutate
 */
const augmentTimeAfterInteraction = time => {
  const increment = MIN_PAUSE_BETWEEN_INTERACTIONS + Math.floor(Math.random() * (MAX_PAUSE_BETWEEN_INTERACTIONS - MIN_PAUSE_BETWEEN_INTERACTIONS))
  time.add(increment, 'seconds')
}

/**
 * Increases the current date time by a random time range for the next session
 * @param {Moment} time The current date time to mutate
 */
const augmentTimeAfterSession = time => {
  const increment = MIN_PAUSE_BETWEEN_SESSIONS + Math.floor(Math.random() * (MAX_PAUSE_BETWEEN_SESSIONS - MIN_PAUSE_BETWEEN_SESSIONS))
  time.add(increment, 'seconds')
}

/**
 * Get a random session duration between min and max
 * @param {number} max The max session duration
 * @returns {number} duration in seconds
 */
const getRandomSessionDuration = (max: number): number => MIN_SESSION_DURATION + Math.floor((max - MIN_SESSION_DURATION) * Math.random())

/**
 * Pick a random product from a given list
 * @param {Record[]} products list of products to pick from
 * @returns {Record} the randomly picked product
 */
const pickRandomProduct = products => products[Math.floor(Math.random() * products.length)]
/**
 * Pick a random button from a given list
 * @param {Record[]} buttons list of buttons to pick from
 * @returns {Record} the randomly picked button
 */
const pickRandomButton = buttons => buttons[Math.floor(Math.random() * buttons.length)]
/**
 * generate events for a single customer session
 * @param {Object} product the product to interact with
 * @param {Moment} from the start date time of the session to generate
 * @param {number} duration the duration in seconds
 * @returns {Record[]} the generated array of events
 */
const generateSingleSession = (product: { id: string; name: string}, from: Moment, duration: number) => {
  // capture the max possible timestamp for this session
  const putDownTime = from.clone().add(duration, 'seconds')

  const events: Record<string, any>[] = []
  // First event is always a pick up
  events.push({
    productId: product.id,
    productName: product.name,
    timestamp: from.toISOString(),
    type: 'pickup',
  })
  augmentTimeAfterInteraction(from)
  // a session can have a variable number of screen touch interactions, so we get a random count first
  const maxTouchInteractions = Math.floor(Math.random() * MAX_INTERACTIONS)
  let touchInteractions = 0
  // walk though the current timestamp and limit touch events by max possible interactions and duration limit
  while (putDownTime.diff(from, 'seconds') > 0 && touchInteractions < maxTouchInteractions) {
    events.push({
      productId: product.id,
      productName: product.name,
      timestamp: from.toISOString(),
      type: 'screentouch',
      target: pickRandomButton(targetButtons),
    })
    augmentTimeAfterInteraction(from)
    touchInteractions++
  }

  // Last event is always a put down
  events.push({
    productId: product.id,
    productName: product.name,
    timestamp: from.toISOString(),
    type: 'putdown',
  })
  return events
}

/**
 * generates multi session events
 * @param {Object[]} products the start date time of the sessions to generate
 * @param {Moment} from the start date time of the sessions to generate
 * @param {Moment} to the end date time of the sessions to generate
 */
export const generateSessions = async (products: { id: string; name: string }[], from: Moment, to: Moment) => {
  let events: Record<string, any>[] = []
  const durationName = to.from(from, true)
  let spinner = ora(`generating interaction events for ${durationName}`).start()
  while (to.diff(from, 'seconds') > 0) {
    const singleSessionDuration = getRandomSessionDuration(MAX_SESSION_DURATION)
    // pick a random target product for this session
    const product = pickRandomProduct(products)
    events = events.concat(generateSingleSession(product, from, singleSessionDuration))
    augmentTimeAfterSession(from)
  }
  spinner.succeed()
  await timeout(1000) // pause between steps
  spinner = ora('start session simulation with remote server...').start()
  await timeout(1000) // pause between steps
  try {
    await asyncForEach(events, async (event, index) => {
      spinner.start(`(${index + 1}/${events.length}) event: ${event.type}${event.target ? `:${event.target}` : ''}, product: ${event.productId},${event.productName}, timestamp: ${event.timestamp}`)
      await pushEvent(event)
      spinner.stopAndPersist({symbol: '→'})
    })
    spinner.succeed(`completed sending ${events.length} events`)
  } catch (error) {
    // parse server response and fetch validation or error message if any
    const message = error?.response?.body ? JSON.parse(error.response.body).message : error.message
    spinner.fail(`Failed to submit events to server. Error: ${message}`)
  }
}
