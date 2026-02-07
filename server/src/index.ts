import express from 'express';
import cors from 'cors';
import { connect } from 'mongoose';
import { config } from 'dotenv';
import mainRouter from './routes/index.ts';
import { initRedis } from './utils/RedisSetup.ts';

config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mainRouter);

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        const mongoURI = process.env.MONGO_URI || "";

        await connect(mongoURI);
        console.log("Connection to mongo successful");

        await initRedis();
        console.log("Redis initialized");

        // ✅ Start server LAST
        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        });

    } catch (e: any) {
        console.log("Startup error:", e.message);
        process.exit(1); // important for Render
    }
}

startServer();
