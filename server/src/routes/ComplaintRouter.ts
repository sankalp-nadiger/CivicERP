import { Router } from "express";
import { ComplaintController } from "../controllers/index";

const complaintRouter=Router()

complaintRouter.post('/mystats',ComplaintController.getComplaintStats);
complaintRouter.post('/addComplaint',ComplaintController.addComplaint);
complaintRouter.post('/myComplaint',ComplaintController.getMyComplaints);


export default complaintRouter;