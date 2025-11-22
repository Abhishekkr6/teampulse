import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use("/api/v1/webhooks/github", express.raw({ type: "*/*" }));

app.use(express.json());
app.use(cors());

// Webhooks
import webhookRoutes from "./routes/webhook.routes.js";

// Auth
import authRoutes from "./routes/auth.routes.js";
import meRoutes from "./routes/me.routes.js";

// Org + Repo
import orgRoutes from "./routes/org.routes.js";

import dashboardRoutes from "./routes/dashboard.routes.js";

app.use("/api/v1", dashboardRoutes);

/* -----------------------------------------------------
   REGISTER ROUTES
------------------------------------------------------ */
app.use("/api/v1/webhooks", webhookRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", meRoutes);
app.use("/api/v1", orgRoutes); // org, repos, connect repo

/* -----------------------------------------------------
   MONGO CONNECTION
------------------------------------------------------ */
mongoose
  .connect(process.env.MONGO_URL!)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

/* -----------------------------------------------------
   HEALTH CHECK
------------------------------------------------------ */
app.get("/api/v1/health", (req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

/* -----------------------------------------------------
   EXPORT APP
------------------------------------------------------ */
export { app };
