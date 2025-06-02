import dotenv from 'dotenv';
import connectDB from './db/db.js'
import {app} from './app.js'

dotenv.config();


connectDB().then(()=> {
    app.listen(process.env.PORT || 8000, ()=> {
        console.log("Server started successfully at port: ", process.env.PORT);
    })
}).catch((err)=> {
    console.log(`MongoDB not connected because of error: ${err}`);
    
})

