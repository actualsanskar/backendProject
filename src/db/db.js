import mongoose from 'mongoose';
import express from 'express'
import { DB_NAME } from '../constants.js';
import dotenv from 'dotenv';
dotenv.config();
const app = express();



const connectDB = async ()  => {    
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`MongoDB connected!! Host: ${connectionInstance.connection.host}`);
        app.on("error", (err)=> {
            console.log(`facing issue: ${err}`);
        })
        
    } catch(error){
        console.log(`MONGODB connection failed: ${error}`);
        process.exit(1);
    }
}

export default connectDB;