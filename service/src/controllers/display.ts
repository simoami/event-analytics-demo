import * as moment from 'moment'
import * as Joi from '@hapi/joi'
import { joiValidate } from '../lib/validation'
import * as DisplayService from '../services/display'

export const postEvent = async (request, reply) => {
  const { displayId } = request.params
  const { productId, productName, type, target, timestamp } = request.body

  try {
    joiValidate({
      displayId: Joi.string().required(),
      productId: Joi.string().required(),
      productName: Joi.string().required(),
      type: Joi.string().valid('pickup', 'screentouch', 'putdown').required(),
      target: Joi.string().allow(null).optional(),
      timestamp: Joi.string().required(),
    }, { displayId, productId, productName, type, target, timestamp })
  } catch (error) {
    reply.badRequest(error.message)
    return
  }

  switch (type) {
    case 'pickup':
      await DisplayService.pickUp(displayId, productId, productName, timestamp)
      break
    case 'putdown':
      await DisplayService.putDown(displayId, productId, productName, timestamp)
      break
    case 'screentouch':
      await DisplayService.screenTouch(displayId, productId, productName, target, timestamp)
      break
  
  }
  reply.send({
    success: true
  })
}

export const getEvents = async (request, reply) => {
  // const { displayId } = request.params
  const { from, to, productId, events } = request.query

  try {
    joiValidate({
      from: Joi.string().required(),
      to: Joi.string(),
      productId: Joi.string(),
      events: Joi.string(),
    }, { from, to, productId, events })
  } catch (error) {
    reply.badRequest(error.message)
    return
  }

  const fromDate = moment(from)
  const toDate = to ? moment(to) : fromDate.add(1, 'days')
  const results = await DisplayService.getEvents(fromDate.valueOf(), toDate.valueOf(), productId, events ? events.split(',') : [])
  reply.send({ events: results })
}