import { Router } from "express";
import authRouter from "./AuthRouter.js";
import complaintRouter from "./ComplaintRouter.js";
import adminRouter from "./AdminRouter.js";
import healthRouter from "./HealthRouter.js";
import governanceRouter from "./GovernanceRouter.js";
import { verifyToken, verifyAdmin, verifyUser } from "../utils/verifyUser.js";

const mainRouter = Router();

mainRouter.use('/health', healthRouter);
mainRouter.use('/auth', authRouter);

mainRouter.use('/complaints', complaintRouter);
mainRouter.use('/admin', adminRouter);
mainRouter.use('/governance', governanceRouter);

export default mainRouter;