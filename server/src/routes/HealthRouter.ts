import { Router } from "express";

const healthRouter=Router()

healthRouter.get('/',(_,res)=>{
    res.json({"message":"Working fine"});
})

export default healthRouter;