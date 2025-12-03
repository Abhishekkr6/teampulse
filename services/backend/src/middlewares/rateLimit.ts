import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 100, // 100 requests per minute
  message: "Too many requests, slow down!",
  standardHeaders: true,
  legacyHeaders: false,
});
