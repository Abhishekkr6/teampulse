import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();

/* -----------------------------------------------------
   1) RAW BODY FOR GITHUB → MUST BE FIRST
------------------------------------------------------ */
app.use(
  "/api/v1/webhooks/github",
  express.raw({ type: "application/json" })
);

/* -----------------------------------------------------
   2) REGISTER WEBHOOK ROUTES IMMEDIATELY AFTER RAW
------------------------------------------------------ */
import webhookRoutes from "./routes/webhook.routes.js";
app.use("/api/v1/webhooks", webhookRoutes);

/* -----------------------------------------------------
   3) NORMAL PARSERS AFTER WEBHOOK ONLY
------------------------------------------------------ */
app.use(express.json());
app.use(cors());

/* -----------------------------------------------------
   4) OTHER ROUTES
------------------------------------------------------ */
import authRoutes from "./routes/auth.routes.js";
import meRoutes from "./routes/me.routes.js";
import orgRoutes from "./routes/org.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", meRoutes);
app.use("/api/v1", orgRoutes);
app.use("/api/v1", dashboardRoutes);

/* -----------------------------------------------------
   5) MONGO CONNECT
------------------------------------------------------ */
mongoose
  .connect(process.env.MONGO_URL!)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

export { app };
