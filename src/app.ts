
import Fastify from "fastify";
import { registerErrorHandler } from "./middlewares/errorHandler.ts";
import { mainRoutes } from "./routes/helloRoute.ts";


const app = Fastify({ logger: { file: "./app.log" } });

registerErrorHandler(app);
mainRoutes(app);

export default app