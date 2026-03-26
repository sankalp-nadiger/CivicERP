import { Router } from "express";
import { ComplaintController } from "../controllers/index.js";
import { verifyToken } from "../utils/verifyUser.js";

const complaintRouter=Router()

complaintRouter.post('/mystats',ComplaintController.getComplaintStats);
complaintRouter.post('/addComplaint',ComplaintController.addComplaint);
complaintRouter.post('/myComplaint',ComplaintController.getMyComplaints);

// Officer-scoped complaints (Zone/Ward officers)
complaintRouter.get('/scoped', verifyToken, ComplaintController.getScopedComplaints);

// Contractor-scoped complaints (logged-in contractor)
complaintRouter.get('/assigned/me', verifyToken, ComplaintController.getAssignedComplaintsForContractor);

// Level 2 workflow: assign a complaint to a contractor
complaintRouter.put('/assign', verifyToken, ComplaintController.assignComplaintToContractor);

// Translate dynamic/free-text complaint fields
complaintRouter.post('/translate', verifyToken, ComplaintController.translateTexts);


export default complaintRouter;