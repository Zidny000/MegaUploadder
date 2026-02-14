import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export const registerErrorHandler = (app: FastifyInstance) => {
  app.setErrorHandler((error: FastifyError, _req: FastifyRequest, reply: FastifyReply) => {
    const statusCode = error.statusCode ?? 500;
    const message = statusCode >= 500 ? "Internal Server Error" : error.message;

    app.log.error(error);

    reply.status(statusCode).send({
      error: {
        message,
        statusCode,
      },
    });
  });
};
