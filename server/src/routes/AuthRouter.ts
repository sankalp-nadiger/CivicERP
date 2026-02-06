import { Router } from "express";
import { AuthController } from "../controllers/index.ts";
import { verifyToken} from "../utils/verifyUser.ts";


const authRouter=Router()

authRouter.post('/signup',AuthController.signup);
authRouter.post('/signin',AuthController.signin);
authRouter.get('/signout',AuthController.signout);

export default authRouter;