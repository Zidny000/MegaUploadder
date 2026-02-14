import Fastify from 'fastify'
import { mainRoutes } from './routes/helloRoute.ts';

const app = Fastify({logger: {file:'./app.log'}})

const start = async () => {
  mainRoutes(app);
  await app.listen({port: 3000, host: '0.0.0.0'})
}

start();
