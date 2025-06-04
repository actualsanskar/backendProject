import dotenv from 'dotenv';
import connectDB from './db/db.js'
import {app} from './app.js'

dotenv.config();


connectDB().then(()=> {
    app.listen(process.env.PORT || 7000, ()=> {
        console.log(`Server started successfully at port: http://localhost:${process.env.PORT}`);
    })
}).catch((err)=> {
    console.log(`MongoDB not connected because of error: ${err}`);
    
})

