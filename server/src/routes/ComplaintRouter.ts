import { Router } from "express";
import { ComplaintController } from "../controllers/index.js";
import { verifyToken } from "../utils/verifyUser.js";

const complaintRouter=Router()

complaintRouter.post('/mystats',ComplaintController.getComplaintStats);
complaintRouter.post('/addComplaint',ComplaintController.addComplaint);
complaintRouter.post('/myComplaint',ComplaintController.getMyComplaints);

// Officer-scoped complaints (Zone/Ward officers)
complaintRouter.get('/scoped', verifyToken, ComplaintController.getScopedComplaints);


export default complaintRouter;