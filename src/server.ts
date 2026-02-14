import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import 'dotenv/config'
import Fastify from "fastify";
import mongoose from 'mongoose'
import { registerErrorHandler } from "./middlewares/errorHandler.ts";
import { mainRoutes } from "./routes/helloRoute.ts";

mongoose.connect(process.env.MONGODB_URI || "")
.then(() => console.log("Connected to the database"))
.catch((e) => {
  console.log("Error connecting to database", e)
})

const app = Fastify({ logger: { file: "./app.log" } });

const start = async () => {
  try{
    registerErrorHandler(app);
    mainRoutes(app);

    const port = parseInt( process.env.PORT || '7000' )

    await app.listen({ port , host: "0.0.0.0" });
  }catch(e){
    console.log(e)
  }
  
};

start(); 
