import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (user) => {
    try {
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        // console.log("Before save - RefreshToken:", refreshToken);
        
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

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

    res.status(201).json(
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
    
    const loggedInUser = await User.findById(user._id).select( "-password -refreshToken" )
    
    const options = {
        httpOnly: true,
        secure: true
    }



    res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            // sending this is optional
            // we are sending because in our case, we are assuming that the user might need it for something
            new ApiResponse(200, {
                user: loggedInUser, accessToken, refreshToken
            })
        )
})

const logoutUser = asyncHandler(async (req, res, next) => {
    // clear cookies from browser
    // destroy access and refresh token

    await User.findByIdAndUpdate(req.user._id,
        {
            $set: { refreshToken: undefined },
        },
        {
            new: true // will make return the new updated user document
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out!"))
    
})


export { registerUser, loginUser, logoutUser }