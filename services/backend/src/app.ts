import express from "express";
import cookieParser from "cookie-parser";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import logger from "./utils/logger";
import { requestLogger } from "./middlewares/requestLogger";
import { apiLimiter } from "./middlewares/rateLimit";
import { errorHandler } from "./middlewares/errorHandler";
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
app.use(cookieParser());
app.use(
   helmet({
      contentSecurityPolicy: false,
   })
);

const corsOptions: CorsOptions = {
   origin: [
      "http://localhost:3000", // local dev
      "https://teampulse18.vercel.app", // production placeholder
   ],
   methods: ["GET", "POST", "PUT", "DELETE"],
   credentials: true,
};

app.use(cors(corsOptions));
app.use(requestLogger);
app.use("/api", apiLimiter);

/* -----------------------------------------------------
   4) OTHER ROUTES
------------------------------------------------------ */
import authRoutes from "./routes/auth.routes";
import meRoutes from "./routes/me.routes";
import orgRoutes from "./routes/org.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import prRoutes from "./routes/pr.routes";
import developerRoutes from "./routes/developer.routes";

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", healthRoutes);
app.use("/api/v1", meRoutes);
app.use("/api/v1", orgRoutes);
app.use("/api/v1", dashboardRoutes);
app.use("/api/v1", prRoutes);
app.use("/api/v1", developerRoutes);

app.use(errorHandler);

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
