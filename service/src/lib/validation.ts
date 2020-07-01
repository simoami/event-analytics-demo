import * as Joi from '@hapi/joi'
import { ServerError } from './ServerError'

/**
 * validate a request parameter
 * @param {*} schemaMap the validation schema object
 * @param {*} data The data to validate
 *
 *    joiValidate(
 *      { id: Joi.string().required() },
 *      { id }
 *    );
 */
export const joiValidate = <T>(schemaMap: Joi.SchemaMap, data: T): boolean => {
  const schema = Joi.object().keys(schemaMap)
  const result = schema.validate<T>(data)
  if (result.error) {
    const message = Array.isArray(result.error.details) ? result.error.details.map(d => d.message).join('. ') : result.error.message
    throw new ServerError(400, message)
  }
  return true
}
