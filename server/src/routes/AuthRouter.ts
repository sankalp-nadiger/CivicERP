import { Router } from "express";
import { AuthController } from "../controllers/index";
import { verifyToken} from "../utils/verifyUser";


const authRouter=Router()

authRouter.post('/signup',AuthController.signup);
authRouter.post('/signin',AuthController.signin);
authRouter.get('/signout',AuthController.signout);

export default authRouter;