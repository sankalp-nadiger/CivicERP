import { Router } from "express";
import ChatbotController from "../controllers/ChatbotController.js";

const chatbotRouter = Router();

chatbotRouter.post("/", ChatbotController.chat.bind(ChatbotController));

export default chatbotRouter;