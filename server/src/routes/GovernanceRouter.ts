import { Router } from 'express';
import { GovernanceController } from '../controllers/index.js';
import { verifyToken } from '../utils/verifyUser.js';

const governanceRouter = Router();

// All governance routes require authentication
// Temporarily disabled for testing - REMOVE IN PRODUCTION
// governanceRouter.use(verifyToken);

// Department routes
governanceRouter.post('/departments', GovernanceController.createDepartment);
governanceRouter.get('/departments', GovernanceController.getDepartments);

// Area routes
governanceRouter.post('/areas', GovernanceController.createArea);
governanceRouter.get('/areas', GovernanceController.getAreas);

// Officer routes
governanceRouter.post('/officers', GovernanceController.addOfficer);
governanceRouter.get('/officers', GovernanceController.getOfficers);

export default governanceRouter;
