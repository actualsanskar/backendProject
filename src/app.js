import express from 'express';
import dotenv from 'dotenv';
const app = express();
dotenv.config();

app.use(express.json({limit: '16kb'}));
app.cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
})