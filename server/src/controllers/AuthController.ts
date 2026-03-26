import { Request, Response } from 'express';
import { User, Contractor } from "../models/index.js";
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 } from "uuid";

class AuthController{
    async signin(req:Request,res:Response){
        const { email, password } = req.body;
        try {
            const validUser = await User.findOne({ email });
            if (!validUser) {res.status(404).json({"message":"User not found"}); return;};
            const validPassword = bcryptjs.compareSync(password, validUser.password);
            if (!validPassword){res.status(401).json({"message":"Enter valid Password"});return;};
            const token = jwt.sign({ id: validUser._id ,role : validUser.role}, process.env.JWT_SECRET||"abcdef");
            
            // Convert to plain object and remove password
            const userObject = validUser.toObject();
            const { password: hashedPassword, ...rest } = userObject;
            
            const expiryDate = new Date(Date.now() + 3600000); // 1 hour
            res
            .cookie('access_token', token, { httpOnly: true, expires: expiryDate })
            .header('Authorization', 'Bearer ' + token) 
            .status(200)
            // Also return token in JSON so SPAs can store it (avoids cross-site cookie issues)
            .json({ ...rest, token });
        } catch (error:any) {
            res.status(400).json({"message":error.message})
        }
    }

    async signup(req:Request,res:Response){
        const { username, email, password,phoneNo,role } = req.body;
        const hashedPassword = bcryptjs.hashSync(password, 10);
        let uid=v4();
        const newUser = new User({ username, email, password: hashedPassword,uuid:uid,complaints:[],phoneNo, role});
        try {
            await newUser.save();
            res.status(201).json({ message: 'User created successfully' });
        } catch (error:any) {
           res.status(400).json({"message":error.message})
        }
    }

    async contractorSignin(req: Request, res: Response) {
        const { email, password } = req.body || {};
        if (!email || !password) {
            res.status(400).json({ message: 'email and password are required' });
            return;
        }

        try {
            const contractorWithPassword = await Contractor.findOne({
                email: String(email).trim().toLowerCase(),
            })
                .select('+password _id name email userId departmentId departmentName phoneNumber area latitude longitude availabilityStatus currentAssignedTask zone ward lastLocationUpdateAt')
                .lean();

            if (!contractorWithPassword) {
                res.status(401).json({ message: 'Invalid email or password' });
                return;
            }

            const hashedPassword = String((contractorWithPassword as any).password || '');
            const validPassword = hashedPassword ? bcryptjs.compareSync(String(password), hashedPassword) : false;
            if (!validPassword) {
                res.status(401).json({ message: 'Invalid email or password' });
                return;
            }

            const token = jwt.sign({ id: (contractorWithPassword as any)._id, role: 'Contractor' }, process.env.JWT_SECRET || "abcdef");

            const expiryDate = new Date(Date.now() + 3600000);

            const { password: _password, ...contractor } = (contractorWithPassword as any) || {};

            res
                .cookie('access_token', token, { httpOnly: true, expires: expiryDate })
                .header('Authorization', 'Bearer ' + token)
                .status(200)
                .json({
                    token,
                    contractor: contractor || null,
                });
        } catch (error: any) {
            res.status(400).json({ message: error?.message || 'Contractor signin failed' });
        }
    }

    async signout (req:Request, res:Response){
        res.clearCookie('access_token').status(200).json('Signout success!');
    }

}

export default new AuthController()