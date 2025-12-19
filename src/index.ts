import cors from "cors";
import color from "colors";
import { PORT, ALLOWED_ORIGINS } from "./constant";
import express, {
  Application,
  json,
  Request,
  Response,
  NextFunction,
} from "express";
import http from "http";
import router from "./routes";
import { connectDB } from "./db";
import { SocketService } from "./socket";
import errorHandler from "./middleware/error.middleware";

if (!PORT) {
    process.exit(1);
}

connectDB();

const application: Application = express();
const server = http.createServer(application);

const socketService = SocketService.getInstance(server);

application.locals.socketService = socketService;

application.use((req: Request, res: Response, next: NextFunction) => {
    console.log('--------- REQUEST INFO ---------');
    console.log('Origin:', req?.headers?.origin);
    console.log('Host:', req?.headers?.host);
    console.log('Referer:', req?.headers?.referer);
    console.log('User-Agent:', req?.headers['user-agent']);
    console.log('All Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request URL:', color.yellow(req?.url));
    console.log('Request Method:', color.yellow(req?.method));
    console.log('Request Body:', color.yellow(JSON.stringify(req.body, null, 2)));
    console.log('Request Query:', color.yellow(JSON.stringify(req.query, null, 2)));
    console.log('Request Params:', color.yellow(JSON.stringify(req.params, null, 2)));
    console.log('--------------------------------');
    next();
});

application.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
application.use(json());
application.use("/api/v1", router);
application.use(errorHandler);

server.listen(PORT, () => {
    console.log(color.green(`Server is running on port ${PORT}`));
});