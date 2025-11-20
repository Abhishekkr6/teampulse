import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load env vars
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URL!)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

/* --------------------- ROUTES IMPORT --------------------- */
import authRoutes from "./routes/auth.routes.js";     // <-- Important
import meRoutes from "./routes/me.routes.js";         // <-- Important

/* --------------------- ROUTES BIND ----------------------- */
app.use("/api/v1/auth", authRoutes);   
app.use("/api/v1", meRoutes);

/* -------------------- HEALTH CHECK ------------------------ */
app.get("/api/v1/health", (req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

export { app };
