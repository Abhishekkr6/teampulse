import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/jwt.service";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer "))
      return res.status(401).json({ success: false, error: { message: "No token" }});

    const token = header.split(" ")[1];
    const decoded = verifyToken(token);

    (req as any).user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { message: "Invalid or expired token" },
    });
  }
};
