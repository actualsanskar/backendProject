import { Router } from "express";
import {
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
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verify_JWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/register').post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ])
    , registerUser);


router.route('/login').post(loginUser);

// verified routes
router.route('/logout').post(verify_JWT, logoutUser);
router.route('/refresh-token').post(refreshingAccessToken);
router.route('/change-password').post(verify_JWT, changePassword)
router.route('/get-current-user').post(verify_JWT, getCurrentUser)
router.route('/update-account').patch(verify_JWT, updateAccountDetails)
router.route('/update-avatar').patch(verify_JWT, upload.single("avatar"), updateUserAvatar)
router.route('update-cover-image').patch(verify_JWT, upload.single("coverImage"), updateUserCoverImage),
router.route('/channel/:username').get(verify_JWT, getUserChannelProfile)
router.route('/watch-hostory').get(verify_JWT, watchHistory)


export default router;