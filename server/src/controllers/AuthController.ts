import pkg from 'express';
const { Request, Response } = pkg;
import { User } from "../models/index.ts";
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
            const { password: hashedPassword, ...rest } = validUser;
            const expiryDate = new Date(Date.now() + 3600000); // 1 hour
            res
            .cookie('access_token', token, { httpOnly: true, expires: expiryDate })
            .header('Authorization', 'Bearer ' + token) 
            .status(200)
            .json(rest);
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

    async signout (req:Request, res:Response){
        res.clearCookie('access_token').status(200).json('Signout success!');
    }

}

export default new AuthController()