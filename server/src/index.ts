import express from "express";
import cors from "cors";
import { connect } from "mongoose";
import { config } from "dotenv";
import mainRouter from "./routes/index.js";
import { initRedis } from "./utils/RedisSetup.js";

config();

const app = express();

/* ========================
   Middleware
======================== */

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ========================
   Routes
======================== */

app.use(mainRouter);

/* ========================
   Server Setup
======================== */

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // MongoDB connection
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error("MONGO_URI not defined");
    }

    await connect(mongoURI);
    console.log("✅ MongoDB connected");

    // Redis init
    await initRedis();
    console.log("✅ Redis initialized");

    // IMPORTANT: Start server LAST
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error: any) {
    console.error("❌ Startup error:", error.message);
    process.exit(1);
  }
}

startServer();