import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: ["password", "token", "secret", "*.password", "*.token"],
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" },
        }
      : undefined,
});

export default logger;
