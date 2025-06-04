import { Router } from "express";
import { AdminController } from "../controllers/index.js";


const adminRouter=Router()

adminRouter.post('/',AdminController.getComplaintByRole)
adminRouter.post('/all',AdminController.getAllComplaints)
adminRouter.put('/status',AdminController.updateCurStatusAndComments)
adminRouter.post('/getStatus',AdminController.complaintsByStatus)
adminRouter.post('/category',AdminController.complaintsByCategory)
adminRouter.post('/category2',AdminController.complaintsByCategoryAdmin)
adminRouter.post('/id', AdminController.getComplaintById); 
adminRouter.post('/mystats', AdminController.getComplaintStats); 
adminRouter.post('/report', AdminController.getResultsFromGenAi); 
export default adminRouter;