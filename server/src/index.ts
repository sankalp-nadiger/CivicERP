import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
import { connect } from "mongoose";
import { config } from "dotenv";
import mainRouter from "./routes/index.js";
import { initRedis } from "./utils/RedisSetup.js";

config();

if (!process.env.LIBRETRANSLATE_URL) {
  console.warn('⚠️  LibreTranslate not configured: set LIBRETRANSLATE_URL in server/.env (e.g., http://localhost:5000)');
}

const app = express();

/* ========================
   Middleware
======================== */

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:8080', // Development server
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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