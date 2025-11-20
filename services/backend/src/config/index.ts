import dotenv from "dotenv";
dotenv.config();
export default {
  port: process.env.PORT || 4000,
  mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017/teampulse",
  jwtSecret: process.env.JWT_SECRET || "change_me",
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET
  },
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000"
};
