import http from "http";
import { Server, Socket } from "socket.io";
import { verify } from "jsonwebtoken";
import { ALLOWED_ORIGINS, JWT_SECRET } from "./constant";
import { searchContractsWithSummary } from "./utils/search-stream";
import { User } from "./models/user.model";

interface JwtPayload {
  user_id?: string;
  userId?: string;
}

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export class SocketService {
  private io: Server;
  private static instance: SocketService;

  private constructor(server: http.Server) {
    this.io = new Server(server, {
      cors: {
        origin: ALLOWED_ORIGINS,
        credentials: true,
      },
    });

    // Socket authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth?.token;

        if (token) {
          const decoded = verify(token, JWT_SECRET) as JwtPayload;
          const userId = decoded?.user_id || decoded?.userId;

          if (userId) {
            const user = await User.findById(userId);
            if (user) {
              socket.user = {
                id: user._id.toString(),
                email: user.email,
                username: user.username,
              };
            }
          }
        }
      } catch {
        // Token invalid or expired - continue without user
      }
      next();
    });

    this.io.on("connection", (socket: AuthenticatedSocket) => {
      console.log(
        "A user connected:",
        socket.id,
        socket.user?.username || "(anonymous)"
      );

      socket.on(
        "contract:search",
        async (data: { query: string; tab?: string }) => {
          await searchContractsWithSummary(
            socket,
            data.query,
            socket.user?.id,
            data.tab
          );
        }
      );

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });
  }

  public static getInstance(server?: http.Server): SocketService {
    if (!SocketService.instance && server) {
      SocketService.instance = new SocketService(server);
    }
    return SocketService.instance;
  }

  public emitWebhookEvent(data: unknown): void {
    console.log("Emitting webhook event:", data);
    this.io.emit("webhookEvent", data);
  }

  public getIo(): Server {
    return this.io;
  }
}
