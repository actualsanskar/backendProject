import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose"; 

const generateAccessAndRefreshTokens = async (user) => {
    try {
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        // console.log("Before save - RefreshToken:", refreshToken);

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });

        // console.log("refresh token inside generate function: ", refreshToken);
        return { accessToken, refreshToken };

    } catch (error) {
        console.error("Token generation error:", error);
        throw new ApiError(500, "something went wrong while generating access or refresh tokens")
    }
}

const registerUser = asyncHandler(async (req, res, next) => {

    // take data from user ✅
    // check if data is not empty ✅
    // check if the username or email already exists ✅
    // check for images, check for avatar ✅
    // upload them to cloudinary - avatar ✅
    // save the details in database ✅
    // the user is successfully registered ✅

    const { username, email, fullName, password } = req.body;
    // console.log(email);


    if ([username, email, fullName, password].some((field) => field.trim() === "")) {
        throw new ApiError(400, "all fields are required");
    }

    const exisingUser = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (exisingUser) {
        throw new ApiError(409, "User with email or username already exist!")
    }

    console.log(req.files);


    const avatarLocalPath = req.files?.avatar[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file path is required!")
    }

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    // console.log(coverImageLocalPath);


    if (!avatar) {
        throw new ApiError(400, "Avatar file is required!")
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User regisered successsfully")
    )


})

const loginUser = asyncHandler(async (req, res, next) => {
    // take data from req.body ✅
    // check if the user has given username or email ✅
    // check if the username or email already exist ✅
    // if yes then isPasswordCorrect ✅
    // if yes then generate access token and refresh token ✅
    // send cookie ✅

    // console.log(req.body);
    const { email, username, password } = req.body;


    if (!(email && username)) {
        throw new ApiError(401, "email or username is required!")
    }

    const user = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (!user) {
        throw new ApiError(401, "user doesn't exist!")
    }


    const checkPassword = await user.isPasswordCorrect(password)

    if (!checkPassword) {
        throw new ApiError(401, "Invaid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }



    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            // sending this is optional
            // we are sending because in our case, we are assuming that the user might need it for something
            new ApiResponse(200, {
                user: loggedInUser, accessToken, refreshToken
            }, "user logged in successfully")
        )
})

const logoutUser = asyncHandler(async (req, res, next) => {
    // clear cookies from browser and destroy tokens

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    ).select("-password");


    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshingAccessToken = asyncHandler(async (req, res, next) => {
    // req.body is for someone sending request from an app
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request!")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user)

        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(200, {}, "access token refressed successfully!")
            )
    } catch (error) {

    }

})

const changePassword = asyncHandler(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);
    const isPasswordCorrectValue = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrectValue) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "password updated successfully!")
        )

})

const getCurrentUser = asyncHandler(async (req, res, next) => {
    return res.status(200)
        .json(
            new ApiResponse(200, req.user, "current user fetched successfully")
        )
})

const updateAccountDetails = asyncHandler(async (req, res, next) => {
    const { email, fullName } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findOneAndUpdate(req.user._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res.status(200)
        .json(
            new ApiResponse(200, user, "Account details updated successfully")
        )

})

const updateUserAvatar = asyncHandler(async (req, res, next) => {
    const url = req.user.avatar;
    const newAvatarFilePath = req.file?.path;

    if (!newAvatarFilePath) {
        throw new ApiError(400, "Avatar file path is required!")
    }


    const avatar = await uploadOnCloudinary(newAvatarFilePath)

    deleteFromCloudinary(url)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required!")
    }

    const user = await User.findByIdAndUpdate(req.user._id, {
        $set: {
            avatar: avatar.url
        }
    }, { new: true }).select("-password")


    return res.status(200)
        .json(
            new ApiResponse(200, user, "avatar updated successfully")
        )

})

const updateUserCoverImage = asyncHandler(async (req, res, next) => {
    const newCoverImageFilePath = req.file?.path;
    const url = req.user.coverImage;

    if (!newCoverImageFilePath) {
        throw new ApiError(400, "Cover Image file path is required!")
    }

    const coverImage = await uploadOnCloudinary(newCoverImageFilePath)

    deleteFromCloudinary(url)

    if (!coverImage) {
        throw new ApiError(400, "Cover Image file is required!")
    }

    const user = await User.findByIdAndUpdate(req.user._id, {
        $set: {
            coverImage: coverImage.url
        }
    }, { new: true }).select("-password")

    return res.status(200)
        .json(
            new ApiResponse(200, user, "cover image updated successfully")
        )

})

const getUserChannelProfile = asyncHandler(async (req, res, next) => {
    const { username } = req.params;
    // console.log(username);
    

    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if (!channel.length) {
        throw new ApiError(404, "channel does not exists")
    }

    // console.log(`logging the channel in getUserChannelProfile : ${JSON.stringify(channel, null, 2)}`);

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel, "User channel successfully fetched")
        )


})

const watchHistory = asyncHandler(async (req, res, next) => {
    // this will return the entire user with fields filled perfectly (watchHistory)    

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "videoOwner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fileName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },

                    // below code is to make work at frontend easy. we are talking whatever we got ( which is an array ) and talking first object out of it(which is the owner)

                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }

    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Watch history fetched successfully"
            )
        )
})




export {
    registerUser,
    loginUser,
    logoutUser,
    refreshingAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    watchHistory
}