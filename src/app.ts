
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { registerErrorHandler } from "./middlewares/errorHandler.ts";
import { mainRoutes } from "./routes/helloRoute.ts";
import { uploadRoutes } from "./routes/uploadRoute.ts";


const app = Fastify({ logger: { file: "./app.log" } });

app.addContentTypeParser(
	"application/octet-stream",
	(request, payload, done) => {
		done(null, payload);
	}
);

app.register(multipart, {
	limits: {
		fileSize: 10 * 1024 * 1024,
		files: 1,
	},
});

registerErrorHandler(app);
mainRoutes(app);
uploadRoutes(app);

export default app