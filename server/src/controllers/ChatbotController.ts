import { Request, Response } from "express";
import axios from "axios";
import { Complaint } from "../models/index.js";

const DEFAULT_RAG_CHAT_URL = "https://rag-pipeline-civic.onrender.com/ragChat";

type RagChatResponse = {
  answer?: string;
  response?: string;
  reply?: string;
  result?: string;
  data?: {
    answer?: string;
    response?: string;
    reply?: string;
    result?: string;
  };
};

const extractComplaintId = (message: string): string | null => {
  const match = message.match(/\b(CMP-[A-Z0-9-]+)\b/i);
  return match?.[1] || null;
};

class ChatbotController {
  private normalizeTopK(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 5;
    return Math.max(1, Math.min(20, Math.floor(parsed)));
  }

  private normalizeGovemp(value: unknown): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      return normalized === "true" || normalized === "1" || normalized === "yes";
    }
    if (typeof value === "number") return value === 1;
    return true;
  }

  private async buildStatusReply(message: string): Promise<string> {
    const complaintId = extractComplaintId(message);

    if (complaintId) {
      const complaint = await Complaint.findOne({
        complaint_id: { $regex: `^${complaintId}$`, $options: "i" },
      })
        .select("complaint_id status lastupdate date")
        .lean();

      if (complaint) {
        const lastUpdatedAt = complaint.lastupdate || complaint.date;
        const formattedDate = lastUpdatedAt
          ? new Date(lastUpdatedAt).toLocaleString()
          : "not available";

        return `Complaint ${complaint.complaint_id} is currently ${complaint.status}. Last updated: ${formattedDate}.`;
      }

      return `I could not find complaint ${complaintId}. Please re-check the complaint ID and try again.`;
    }

    const [total, open, inProgress, resolved] = await Promise.all([
      Complaint.countDocuments({}),
      Complaint.countDocuments({
        status: { $regex: "todo|registered|open", $options: "i" },
      }),
      Complaint.countDocuments({
        status: { $regex: "progress|investigation|in[\\s_-]?progress", $options: "i" },
      }),
      Complaint.countDocuments({
        status: { $regex: "completed|resolved|closed", $options: "i" },
      }),
    ]);

    if (total === 0) {
      return "No complaints are available right now.";
    }

    return `Current complaint status summary: total ${total}, open ${open}, in progress ${inProgress}, resolved ${resolved}. For a specific complaint, include the complaint ID such as CMP-123-ABC.`;
  }

  async chat(req: Request, res: Response) {
    const rawMessage = req.body?.message;
    const rawQuestion = req.body?.question;
    const topK = this.normalizeTopK(req.body?.topK);
    const govemp = this.normalizeGovemp(req.body?.govemp);

    const incomingText =
      typeof rawMessage === "string" && rawMessage.trim()
        ? rawMessage
        : typeof rawQuestion === "string" && rawQuestion.trim()
        ? rawQuestion
        : "";

    if (!incomingText) {
      res.status(400).json({ message: "message or question is required" });
      return;
    }

    const message = incomingText.trim();

    try {
      if (message.toLowerCase().includes("status")) {
        const reply = await this.buildStatusReply(message);
        res.status(200).json({ reply });
        return;
      }

      const ragUrl = process.env.RAG_CHAT_URL || DEFAULT_RAG_CHAT_URL;
      const ragResponse = await axios.post<RagChatResponse>(
        ragUrl,
        {
          question: message,
          topK,
          govemp,
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 30000,
        }
      );

      const answer =
        ragResponse.data?.answer ||
        ragResponse.data?.response ||
        ragResponse.data?.reply ||
        ragResponse.data?.result ||
        ragResponse.data?.data?.answer ||
        ragResponse.data?.data?.response ||
        ragResponse.data?.data?.reply ||
        ragResponse.data?.data?.result;

      if (!answer || typeof answer !== "string") {
        res.status(502).json({ message: "Invalid response from RAG service" });
        return;
      }

      res.status(200).json({ reply: answer });
    } catch (error: any) {
      const fallbackMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Chatbot service failed";

      res.status(502).json({ message: fallbackMessage });
    }
  }
}

export default new ChatbotController();