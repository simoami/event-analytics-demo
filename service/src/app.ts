import * as fastify from 'fastify'
import * as path from 'path'
import * as config from 'config'
import { Server, IncomingMessage, ServerResponse } from 'http'
import router from './router'
import * as DisplayInteraction from './controllers/display'

const host = config.get<string>('host')
const port = config.get<number>('port')
const prefix = config.get<string>('restApiRoot')

const serverOptions: fastify.ServerOptions = {
  // Logger only for production
  logger: !!(process.env.NODE_ENV !== 'development'),
  ignoreTrailingSlash: true
};

const app: fastify.FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify(serverOptions)

const openApiOptions = {
  specification: `${__dirname}/api-specs/displays.v1.yaml`,
  service: DisplayInteraction, // this is required for openapi-glue to inittialize
  prefix: prefix,
};

app.register(require('fastify-sensible'))
app.register(require('fastify-helmet'), { hidePoweredBy: true })
app.register(require("fastify-openapi-glue"), openApiOptions)
app.register(router)
app.register(require('fastify-static'), { root: path.join(__dirname, 'assets') })

app.listen(port, host, (err, address) => {
  if (err) throw err
  console.log(`❄️ server is listening on port ${port}`)
})

export default app
