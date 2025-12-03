import logger from "../utils/logger";

export const errorHandler = (err: any, req: any, res: any, next: any) => {
  logger.error({ err, url: req.url }, "API Error");

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
