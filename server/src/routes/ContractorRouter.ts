import { Router } from 'express';
import ContractorController from '../controllers/ContractorController.js';
import { verifyToken } from '../utils/verifyUser.js';

const contractorRouter = Router();

// All contractor routes require authentication
contractorRouter.use(verifyToken);

contractorRouter.get('/', ContractorController.list.bind(ContractorController));
contractorRouter.post('/', ContractorController.upsert.bind(ContractorController));
contractorRouter.put('/:id', ContractorController.update.bind(ContractorController));

export default contractorRouter;
