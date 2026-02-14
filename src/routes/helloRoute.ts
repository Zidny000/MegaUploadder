import type { FastifyInstance } from "fastify";
import { helloWorldController, helloWorldController2 } from "../controllers/helloController.ts";

export const mainRoutes = (app: FastifyInstance) => {
  app.get('/', helloWorldController)
  app.get<{Params: {id:number}}>('/hello/:id', {handler: helloWorldController2})
}