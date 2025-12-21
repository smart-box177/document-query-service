import cors from "cors";
import http from "http";
import color from "colors";
import morgan from "morgan";
import { rootRouter as router } from "./routes";
import { connectDB } from "./db";
import { SocketService } from "./socket";
import { PORT, ALLOWED_ORIGINS } from "./constant";
import express, { Application, json } from "express";
import errorHandler from "./middleware/error.middleware";

if (!PORT) {
  process.exit(1);
}

connectDB();

const application: Application = express();
const server = http.createServer(application);

const socketService = SocketService.getInstance(server);

application.locals.socketService = socketService;

application.use(morgan("dev"));

application.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
application.use(json());
application.use("/api/v1", router);
application.use(errorHandler);

server.listen(PORT, () => {
  console.log(color.green(`server is running on port ${PORT}`));
});
