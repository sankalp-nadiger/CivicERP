import express from 'express';
import cors from 'cors';
import {connect} from 'mongoose';
import { config } from 'dotenv';
import mainRouter from './routes/index';

config();

const app=express()

app.use(cors())

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(mainRouter);

const PORT=process.env.PORT||3000

async function mongoConnect(){
    try{
    const mongoURI=process.env.MONGO_URI||"";
    await connect(mongoURI);
    console.log("Connection to mongo successful")
    }catch(e:any){
        console.log('Mongo connection error:', e.message);
    }
}

import { initRedis } from './utils/RedisSetup';

app.listen(PORT,async()=>{
    await mongoConnect();
    await initRedis();
    console.log(`PORT started on port ${PORT}`)
})