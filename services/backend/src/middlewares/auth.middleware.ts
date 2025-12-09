import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/jwt.service";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;

    let token: string | undefined;
    if (header && header.startsWith("Bearer ")) {
      token = header.split(" ")[1];
    } else if (req.headers.cookie) {
      // Minimal cookie parsing to extract `token`
      const parts = req.headers.cookie.split(/;\s*/);
      for (const part of parts) {
        const [k, v] = part.split("=");
        if (k === "token" && v) {
          token = decodeURIComponent(v);
          break;
        }
      }
    }

    if (!token) {
      return res.status(401).json({ success: false, error: { message: "No token" }});
    }

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
