import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshingAccessToken, registerUser, loginUser, logoutUser, refreshingAccessToken, changePassword } from "../controllers/user.controller.js";
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

export default router;