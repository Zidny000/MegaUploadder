import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import 'dotenv/config'
import { initializeDatabase } from './config/mongodb.ts'
import app from './app.ts'


const start = async () => {
  try{
    initializeDatabase()
    const port = parseInt( process.env.PORT || '3000' )
    await app.listen({ port , host: "0.0.0.0" });

  }catch(e){
    console.log(e)
  }
  
};

start(); 
