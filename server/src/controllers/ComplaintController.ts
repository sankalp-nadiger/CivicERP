import { Request, Response } from 'express';
import { Complaint, User } from "../models/index.js";
import { v4 } from "uuid";
import bcryptjs from 'bcryptjs';
import client from "../utils/RedisSetup.js";
import axios from "axios";

class ComplaintController {
    async addComplaint(req: Request, res: Response) {
        const { uuid, complaint, complaint_proof, issue_category, title } = req.body;
        try {
            let mycomplaint = new Complaint()
            let user = await User.findOne({ uuid })
            console.log("title"+title)
            if (user == null) {
                res.status(404).json({ "message": "User Not Found" })
                return;
            }
            let non_hashed_complaint_id = uuid + v4()
            const saltrounds = 10;
            let salt = await bcryptjs.genSalt(saltrounds);
            let complaint_id = await bcryptjs.hash(non_hashed_complaint_id, salt);
            user.previous_complaints.push(non_hashed_complaint_id);
            await user.save();
            let complaint_to_be_added = complaint;
            
            // ML model calls
            try {
                let response = await axios.post('http://127.0.0.1:5002/getSummary', {
                    message: complaint_to_be_added
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
        
                let data = response.data;
                mycomplaint.summarized_complaint = data.summary;

                // Get score and normalize
                response = await axios.post('http://127.0.0.1:5002/getScore', {
                    complaint: complaint_to_be_added
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                data = response.data;
                let score = data.index;
                let mylist=issue_category;
                response = await axios.post('http://127.0.0.1:5002/normalize', {
                    score: score,
                    categories: mylist,
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                data = response.data;
                mycomplaint.priority_factor = data.complaint_severity_score;
                console.log(mycomplaint.priority_factor)
            } catch (e) {
                console.log("Error:", e);
            }

            // Save complaint
            mycomplaint.complaint = complaint_to_be_added;
            mycomplaint.complaint_proof = complaint_proof;
            mycomplaint.issue_category = issue_category;
            // Reference the user who raised the complaint
            mycomplaint.raisedBy = user._id;
            mycomplaint.complaint_id = complaint_id;
            mycomplaint.title = title;
            mycomplaint.status = "todo"; // Default status
        
            await mycomplaint.save();
            await client.set(non_hashed_complaint_id, complaint_id);
            res.status(201).json({ "message": "Added Complaint Successfully" })
        } catch (e: any) {
            console.log(e.message);
            res.status(400).json({ "message": e.message })
        }
    }

    async getMyComplaints(req: Request, res: Response) {
        const { user } = req.body;
        const uuid = user.uuid;
        try {
            let user = await User.findOne({ uuid })
            if (user === null) {
                res.status(404).json({ "message": "User Not Found" })
                return;
            }
            let complaints = user.previous_complaints;
            let newlist = []
            for (let i = 0; i < complaints.length; i++) {
                try {
                    let x = await client.get(complaints[i]);
                    if (x !== null) {
                        let complaint = await Complaint.findOne({ complaint_id: x });
                            if (complaint !== null) {
                            // populate raisedBy for each complaint
                            complaint = await Complaint.findById(complaint._id).populate('raisedBy', 'name uuid email');
                            newlist.push(complaint)
                        }
                    }
                } catch (e: any) {
                    console.log(e.message)
                }
            }
            res.status(200).json({ "complaints": newlist })
        } catch (e: any) {
            console.log(e.message)
            res.status(500).json({ "message": "Internal server error" })
        }
    }

    async getComplaintStats(req: Request, res: Response) {
        const { user } = req.body;
        const uuid = user.uuid;
        try {
            let user = await User.findOne({ uuid })
            if (user === null) {
                res.status(404).json({ "message": "User Not Found" })
                return;
            }
            let complaints = user.previous_complaints;
            let newlist = []
            for (let i = 0; i < complaints.length; i++) {
                try {
                    let x = await client.get(complaints[i]);
                    if (x !== null) {
                        let complaint = await Complaint.findOne({ complaint_id: x });
                        if (complaint !== null) {
                            // populate raisedBy for each complaint
                            complaint = await Complaint.findById(complaint._id).populate('raisedBy', 'name uuid email');
                            newlist.push(complaint)
                        }
                    }
                } catch (e: any) {
                    console.log(e.message)
                }
            }
    
            // Calculate stats using newlist without changing existing logic
            let total = newlist.length;
            let completed = 0;
            let inProgress = 0;
            let todos = 0;
    
            for (let j = 0; j < newlist.length; j++) {
                if (newlist[j].status === "completed") {
                    completed++;
                } else if (newlist[j].status === "Under Investigation" || newlist[j].status === "in-progress") {
                    inProgress++;
                } else if (newlist[j].status === "todo") {
                    todos++;
                }
            }
    
            res.status(200).json({ 
                "complaints": newlist,
                "stats": {
                    "total": total,
                    "completed": completed,
                    "inProgress": inProgress,
                    "todos": todos
                }
            })
        } catch (e: any) {
            console.log(e.message)
            res.status(500).json({ "message": "Internal server error" })
        }
    }
}

export default new ComplaintController();