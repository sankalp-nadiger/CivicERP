import { Router } from "express";
import { AuthController } from "../controllers/index.js";
import { verifyToken} from "../utils/verifyUser.js";


const authRouter=Router()

authRouter.post('/signup',AuthController.signup);
authRouter.post('/signin',AuthController.signin);
authRouter.get('/signout',AuthController.signout);

export default authRouter;