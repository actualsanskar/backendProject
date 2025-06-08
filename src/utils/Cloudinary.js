import { v2 as cloudinary } from "cloudinary";
import fs from 'fs';
import { ApiError } from "./ApiError.js";

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {

        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })

        //upload successful message
        // console.log("File uploaded at", response.url);

        fs.unlinkSync(localFilePath)

        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) // removed the locally saved temporary file as the upload got failed
        return null;
    }
}

const deleteFromCloudinary = async (url) => {
    try {
        const urlParts = url.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        const public_id = lastPart.split('.')[0];
        if (!public_id) {
            throw new ApiError(500, "No public_id provided");
        }

        await cloudinary.uploader.destroy(public_id);
    } catch (error) {
        console.log(`error: ${error.message}`);

    }
}

export { uploadOnCloudinary, deleteFromCloudinary }; 