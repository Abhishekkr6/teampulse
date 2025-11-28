import "dotenv/config";
import http from "http";
import { app } from "./app";
import { attachWebSocket } from "./realtime/wsServer";

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});

attachWebSocket(server);
