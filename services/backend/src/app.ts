import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(
  "/api/v1/webhooks/github",
  express.raw({ type: "*/*" })
);

app.use(cors());
app.use(express.json());

/* -------------------- ROUTES ------------------------ */
import webhookRoutes from "./routes/webhook.routes.js";
app.use("/api/v1/webhooks", webhookRoutes);

import authRoutes from "./routes/auth.routes.js";
import meRoutes from "./routes/me.routes.js";

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", meRoutes);

/* ---------------- MONGO CONNECTION ------------------ */
mongoose
  .connect(process.env.MONGO_URL!)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

/* ---------------- HEALTH CHECK ---------------------- */
app.get("/api/v1/health", (req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

export { app };
