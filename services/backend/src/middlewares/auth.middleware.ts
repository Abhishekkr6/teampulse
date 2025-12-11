import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/jwt.service";
import { JwtPayload } from "jsonwebtoken";

export const authMiddleware = (req: Request, res: Response, Next: NextFunction) => {
  try {
    const header = req.headers.authorization;

    let token: string | undefined;
    if (header && header.startsWith("Bearer ")) {
      token = header.split(" ")[1];
    } else if ((req as any).cookies?.teampulse_token) {
      token = (req as any).cookies.teampulse_token as string;
    }

    if (!token) {
      return res.status(401).json({ success: false, error: { message: "No token" }});
    }

    const decoded = verifyToken(token);

    // Ensure decoded is an object payload before accessing fields
    if (!decoded || typeof decoded === "string") {
      return res.status(401).json({
        success: false,
        error: { message: "Invalid or expired token" },
      });
    }

    const payload = decoded as JwtPayload & { id?: string; _id?: string };
    // Attach only userId for downstream handlers
    (req as any).userId = payload.id ?? payload._id ?? payload.sub;
    (req as any).user = payload; // keep backward compatibility if needed

    Next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { message: "Invalid or expired token" },
    });
  }
};
