import * as DisplayInteraction from './controllers/display'
import { join } from 'path'

export default function router(fastify, opts, next) {
  fastify.get('/healthcheck', (request, reply) => reply.send('OK'));
  fastify.get('/ui', (request, reply) => reply.sendFile('api-doc-ui.html'));
  fastify.get('/spec', (request, reply) => reply.type("application/yaml").sendFile('displays.v1.yaml', join(__dirname, './api-specs')));
  next();
}
