import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend working!" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
