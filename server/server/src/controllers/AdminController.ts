import { Request, Response } from 'express';
import { Complaint } from "../models/index.js";
import { User } from "../models/index.js";
import { GoogleGenerativeAI } from '@google/generative-ai';

class AdminController {
    // Get all complaints
    async getAllComplaints(req: Request, res: Response) {
        try {
           
            let complaint_list = await Complaint.find();
            res.status(200).json({ "complaints": complaint_list });
            console.log('cooo',complaint_list )
        } catch (e) {
            res.status(400).json({ "message": "Something went wrong" });
        }
    }

    // Update complaint status and comments
    async updateCurStatusAndComments(req: Request, res: Response) {
        try {
            const { complaint_id, comments, status } = req.body;
            let complaintToBeUpdated = await Complaint.findOne({ complaint_id });
            
            if (complaintToBeUpdated != null) {
                const commentString = [
                    status.toLowerCase(),
                    "Admin",
                    new Date().toISOString(),
                    comments || `Marked as ${status}`
                ].join('|');
                console.log(status)
                complaintToBeUpdated.status = status === "completed" ? "resolved" : "in-progress";
                complaintToBeUpdated.comments.push(commentString);
                complaintToBeUpdated.lastupdate = new Date(Date.now());
                await complaintToBeUpdated.save();
              
            } else {
                res.status(404).json({ "message": "Complaint Not Found" });
                return;
            }
            
            res.status(203).json({ "message": "Updated Successfully", "data": complaintToBeUpdated });
        } catch (e) {
            res.status(400).json({ "message": "Something Went Wrong" });
        }
    }

    // Get complaints by status
    async complaintsByStatus(req: any, res: any) {
        try {
            const { status } = req.body;
            
             // Define role-based access control
      const accessControl:any= {
        "vc": ["infrastructure", "maintenance","others","hostel","faculty","library"],
        "prince":["infrastructure", "maintenance","others","hostel","faculty","library"],
        "admin":["infrastructure", "maintenance","others","hostel","faculty","library"],
        "warden":["hostel","ragging","women Safety"],
        "estate" : ["infrastructure"]
        // Add more roles and their permitted categories as needed
      };
      // Get user role
      let role = req.body.user.role??"";
      role=role.toLowerCase();
  
      // If role not found in access control, deny access
      if (!accessControl[role]) {
        return res.status(403).json({ message: "Unauthorized role" });
      }
  
      const allowedCategories = accessControl[role];
      console.log(allowedCategories)
      // Fetch all complaints
      let complaints = await Complaint.find({ status});
  
      // Filter complaints based on allowed categories
      let complaintsOfCategory = complaints.filter((complaint) =>
        complaint.issue_category.some((category: string) =>
          allowedCategories.includes(category.toLowerCase())
        )
      );

  
      res.status(200).json({ complaints: complaintsOfCategory });
        } catch (e) {
            res.status(404).json({ "message": "Something Went Wrong" });
        }
    }

    // Get complaints by category
    async complaintsByCategory(req: Request, res: Response) {
        try {
            const { category } = req.body;
            let complaints = await Complaint.find({});
            let complaintsOfCategory = complaints.filter((x) =>
                x.issue_category.some((y) => y.toLowerCase() === category.toLowerCase())
            );
            res.status(200).json({ "complaints": complaintsOfCategory });
        } catch (e) {
            res.status(404).json({ "message": "Something Went Wrong" });
        }
    }
   // render complaints according to role
   // render complaints according to role
    async getComplaintByRole(req: any, res: any) {
    try {
      // Define role-based access control
      const accessControl:any= {
        "vc": ["infrastructure", "maintenance","others","hostel","faculty","library"],
        "prince":["infrastructure", "maintenance","others","hostel","faculty","library"],
        "admin":[ "infrastructure"],
        "warden":["hostel","ragging","women Safety"],
        "estate" : ["infrastructure"]
        // Add more roles and their permitted categories as needed
      };
  
      // Get user role
      let role = req.body.user.role??"";
      role=role.toLowerCase();
  
      // If role not found in access control, deny access
      if (!accessControl[role]) {
        return res.status(403).json({ message: "Unauthorized role" });
      }
  
      const allowedCategories = accessControl[role];
      console.log(allowedCategories)
      // Fetch all complaints
      let complaints = await Complaint.find({});
  
      // Filter complaints based on allowed categories
      let complaintsOfCategory = complaints.filter((complaint) =>
        complaint.issue_category.some((category: string) =>
          allowedCategories.includes(category.toLowerCase())
        )
      );

  
      res.status(200).json({ complaints: complaintsOfCategory });
  
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Something Went Wrong" });
    }
  }
  

    // Get complaints by category for admin
    async complaintsByCategoryAdmin(req: Request, res: Response) {
        try {
            const { uuid } = req.body;
            let user = await User.findOne({ uuid });
            if (user === null) {
                res.status(404).json({ "message": "User Not Found" });
                return;
            }
            
            const category: string = "Infrastructure";
            let complaints = await Complaint.find({});
            let complaintsOfCategory = complaints.filter((x) =>
                x.issue_category.some((y) => y.toLowerCase() === category.toLowerCase())
            );
            
            res.status(200).json({ "complaints": complaintsOfCategory });
        } catch (e) {
            res.status(404).json({ "message": "Something Went Wrong" });
        }
    }

    // Get complaint by ID
    async  getComplaintById(req: Request, res: Response): Promise<any> {
        try {
            const { id } = req.body; // Assuming complaint_id is passed as URL param
           
            // Find complaint by ID
            const complaint = await Complaint.findOne({ complaint_id: id });
            console.log(complaint)
     
    
            // Parse comments (if stored as strings in "type|by|date|activity" format)
            const parsedComments = complaint?.comments.map(commentStr => {
                const [type, by, date, activity] = commentStr.split('|');
                return {
                    type,
                    by: { name: by },
                    date: new Date(date),
                    activity
                };
            });
    
            // Return structured response
           res.status(200).json({
                success: true,
                data: {
                    ...complaint?.toObject(), // Spread all complaint fields
                    comments: parsedComments, // Replace with parsed comments
                }
            });
    
        } catch (error) {
            console.error("Error fetching complaint:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    // Get complaint statistics
    async getComplaintStats(req: Request, res: Response) {
        const { uuid } = req.body;
        try {
            let complaints = await Complaint.find();
            let total = complaints.length;
            let completed = 0;
            let inProgress = 0;
            let todos = 0;

            for (let j = 0; j < complaints.length; j++) {
                if (complaints[j]?.status === "resolved") {
                    completed++;
                } else if (complaints[j]?.status === "Under Investigation" || complaints[j]?.status === "in-progress") {
                    inProgress++;
                } else if (complaints[j]?.status === "todo") {
                    todos++;
                }
            }

            res.status(200).json({
                "complaints": complaints,
                "stats": {
                    "total": total,
                    "completed": completed,
                    "inProgress": inProgress,
                    "todos": todos
                }
            });
        } catch (e: any) {
            console.log(e.message);
            res.status(500).json({ "message": "Internal server error" });
        }
    }

    // Generate custom reports using AI
    async getResultsFromGenAi(req: any, res: any) {
        try {
            const { question } = req.body;
            
            if (!question) {
                return res.status(400).json({ success: false, message: "Question is required" });
            }

            // Initialize Generative AI
            const genAI = new GoogleGenerativeAI(process.env.API_KEY || '');
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            
            // Generate prompt for Complaint model queries only
            const admin=new AdminController()
            const prompt = admin.generateCustomQueryPrompt(question);
            const result = await model.generateContent([prompt]);
            
            // Extract and clean the generated query
            let generatedQuery = result.response.text()
                .replace("javascript", "")

            // Security validation
            if(!admin.isValidQuery(generatedQuery)) {
                throw new Error('Invalid query generated - only Complaint model queries are allowed');
            }

            // Execute the query safely
            const data = await admin.executeGeneratedQuery(generatedQuery);

            // Return the results
            res.status(200).json({
                success: true,
                query: generatedQuery,
                data: data
            });

        } catch (e: any) {
            console.error("Error in custom query:", e);
            res.status(400).json({
                success: false,
                message: e.message || "Error processing custom query"
            });
        }
    }

    private generateCustomQueryPrompt(question: string): string {
        return `Generate a mongoose query for the Complaint model based on: "${question}".
        
        The Complaint schema has these fields:
        {
            title: String,
            complaint: String (required),
            summarized_complaint: String (required),
            complaint_proof: String,
            issue_category: [String] (required),
            complaint_id: String (required, unique),
            status: String (required),
            statusProof: String (required),
            lastupdate: Date,
            date: Date,
            priority_factor: Number (required),
            comments: [String]
        }

        Rules:
        1. Only return a Complaint.find(), Complaint.aggregate(), or Complaint.count() query
        2. No explanations or additional text
        3. Use proper query syntax for filtering, sorting, etc.
        4. For text searches, use regex when appropriate
        5. Never include any JavaScript code blocks or markdown formatting
        
        Query for: ${question}`;
    }

    private isValidQuery(query: string): boolean {
        const allowedPrefixes = ['Complaint.find', 'Complaint.aggregate', 'Complaint.count'];
        return allowedPrefixes.some(prefix => query.startsWith(prefix));
    }

    private async executeGeneratedQuery(query: string): Promise<any> {
        try {
            // Create a safe execution context
            const safeContext = {
                Complaint,
                console,
                Date,
                process,
                setTimeout,
                clearTimeout,
                setInterval,
                clearInterval
            };

            // Create the function in the safe context
            const fn = new Function('context', `
                with(context) {
                    return (async () => {
                        try {
                            return await ${query};
                        } catch (e) {
                            throw new Error('Query execution failed: ' + e.message);
                        }
                    })();
                }
            `);

            // Execute the function with the safe context
            return await fn(safeContext);
        } catch (e) {
            throw new Error('Failed to execute query: ' + (e instanceof Error ? e.message : String(e)));
        }
    }
}

export default new AdminController()