import type { FastifyRequest, FastifyReply } from "fastify";


export const helloWorldController = (req: FastifyRequest, res: FastifyReply) => {
  return {hello: 'world'}
}

export const helloWorldController2 = (req: FastifyRequest<{Params: {id:number}}>, res: FastifyReply) => {
  const params = req.params 
  return {hello: params.id}
}