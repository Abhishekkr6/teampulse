import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import logger from "./utils/logger";
import { requestLogger } from "./middlewares/requestLogger";
import healthRoutes from "./routes/health.routes";

const app = express();

/* -----------------------------------------------------
   1) RAW BODY FOR GITHUB → MUST BE FIRST
------------------------------------------------------ */
app.use("/api/v1/webhooks/github", express.raw({ type: "application/json" }));

/* -----------------------------------------------------
   2) REGISTER WEBHOOK ROUTES IMMEDIATELY AFTER RAW
------------------------------------------------------ */
import webhookRoutes from "./routes/webhook.routes";
app.use("/api/v1/webhooks", webhookRoutes);

/* -----------------------------------------------------
   3) NORMAL PARSERS AFTER WEBHOOK ONLY
------------------------------------------------------ */
app.use(express.json());
app.use(cors());
app.use(requestLogger);

/* -----------------------------------------------------
   4) OTHER ROUTES
------------------------------------------------------ */
import authRoutes from "./routes/auth.routes";
import meRoutes from "./routes/me.routes";
import orgRoutes from "./routes/org.routes";
import dashboardRoutes from "./routes/dashboard.routes";

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", healthRoutes);
app.use("/api/v1", meRoutes);
app.use("/api/v1", orgRoutes);
app.use("/api/v1", dashboardRoutes);

/* -----------------------------------------------------
   5) MONGO CONNECT
------------------------------------------------------ */
mongoose
   .connect(process.env.MONGO_URL!)
   .then(() => logger.info("MongoDB connected"))
   .catch((err) => {
      logger.error({ err }, "MongoDB connection error");
      process.exit(1);
   });

export { app };
