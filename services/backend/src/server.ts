import "dotenv/config";
import { app } from "./app.js";
import { startWSServer } from "./realtime/wsServer.js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});

startWSServer();
