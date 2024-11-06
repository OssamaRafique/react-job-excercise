import express from "express";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import jobRoutes from "./routes/jobRoutes";
import cors from "cors";
import { JobStatus } from "./enums/jobstatus.enum";
import { IJob } from "./interfaces/job.interface";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3000;

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());
app.use("/api", jobRoutes);

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export function notifyJobCompletion(jobId: string, result: string) {
  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({ jobId, result, status: JobStatus.RESOLVED })
      );
    }
  });
}
