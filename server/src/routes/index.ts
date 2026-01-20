import { Router } from "express";
import authRouter from "./AuthRouter";
import complaintRouter from "./ComplaintRouter";
import adminRouter from "./AdminRouter";
import healthRouter from "./HealthRouter";
import governanceRouter from "./GovernanceRouter";
import { verifyToken, verifyAdmin, verifyUser } from "../utils/verifyUser"; // Import your middleware

const mainRouter = Router();

// Public routes (no authentication required)
mainRouter.use('/health', healthRouter);
mainRouter.use('/auth', authRouter);

// Authenticated routes
mainRouter.use('/complaints', complaintRouter); // All complaints routes require authentication
mainRouter.use('/admin', adminRouter); // Admin routes require both authentication and admin role
mainRouter.use('/governance', governanceRouter); // Governance routes for departments, areas, officers

export default mainRouter;