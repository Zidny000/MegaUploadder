import type { FastifyInstance } from "fastify";
import { uploadSmallFileController } from "../controllers/uploadController.ts";

export const uploadRoutes = (app: FastifyInstance) => {
  app.post("/upload/small", uploadSmallFileController);
};
