import {Router} from "express";
import { registerUser } from "../controllers/user.controller";
const router = Router();

router.get('/register', registerUser);


export default router;