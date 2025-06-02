import { v2 as cloudinary } from "cloudinary";
import fs from 'fs';

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFileOnCloudinary = async (localFilePath) => {
    try {

        if(!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: auto,
        })

        //upload successful message
        console.log("File uploaded at", response.url);
        fs.unlinkSync(localFilePath); // removing the file as it's no longer needed in system

        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) // removed the locally saved temporary file as the upload got failed
        return null;
    }
}