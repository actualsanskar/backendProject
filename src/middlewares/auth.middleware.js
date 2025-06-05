import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// main objective of this middleware is to verify user before fulfilling it's request
// in this first we took the token from cookie or header
// verified the token which gave us decoded value
// used the verified token to get _id and check if the user with that id exists in database
// if yes then return the user as it's verified + next middleware

const verify_JWT = asyncHandler(async (req, _, next)=> {
    const token = req.cookies?.accessToken || req.header("authorization")?.replace("Bearer ", "");
    console.log(token);
    

    if(!token){
        throw new ApiError(400, "Unauthorized request!");
    }

    
    const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = User.findById(decodedToken?._id).select("-password -refreshToken");

    if(!user){
        throw new ApiError(401, "Invalid Access Token")
    }

    req.user = user;
    next();
})


export {verify_JWT}