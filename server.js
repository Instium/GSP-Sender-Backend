import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import campaignRoutes from "./routes/campaigns.js";
import messageRoutes from "./routes/messages.js";
import webhookRoutes from "./routes/webhook.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/campaigns", campaignRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/webhook", webhookRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 GSP-Sender backend activo en puerto ${PORT}`));
