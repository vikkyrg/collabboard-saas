import dotenv from "dotenv";
import http from "http";

dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import initSocket from "./services/socket.service.js";

connectDB();

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`CollabBoard server running on port ${PORT}`);
});
