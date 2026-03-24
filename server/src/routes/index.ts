import { Router } from "express";
import authRouter from "./AuthRouter.js";
import complaintRouter from "./ComplaintRouter.js";
import adminRouter from "./AdminRouter.js";
import healthRouter from "./HealthRouter.js";
import governanceRouter from "./GovernanceRouter.js";
import contractorRouter from "./ContractorRouter.js";
import uploadRouter from "./UploadRouter.js";
import { verifyToken, verifyAdmin, verifyUser } from "../utils/verifyUser.js";

const mainRouter = Router();

mainRouter.use('/health', healthRouter);
mainRouter.use('/auth', authRouter);

mainRouter.use('/uploads', uploadRouter);

mainRouter.use('/complaints', complaintRouter);
mainRouter.use('/admin', adminRouter);
mainRouter.use('/governance', governanceRouter);
mainRouter.use('/contractors', contractorRouter);

export default mainRouter;