import { Router } from 'express';
import { GovernanceController } from '../controllers/index.ts';
import { verifyToken } from '../utils/verifyUser.ts';

const governanceRouter = Router();

// All governance routes require authentication
governanceRouter.use(verifyToken);

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
