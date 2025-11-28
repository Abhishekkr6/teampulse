import "dotenv/config";
import http from "http";
import { app } from "./app.js";
import { startWSServer } from "./realtime/wsServer.js";

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});

startWSServer(server);
