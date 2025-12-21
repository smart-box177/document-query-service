import http from "http";
import { Server, Socket } from "socket.io";
import { ALLOWED_ORIGINS } from "./constant";
import { searchContractsWithSummary } from "./utils/search-stream";

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

    this.io.on("connection", (socket: Socket) => {
      console.log("A user connected:", socket.id);

      socket.on("contract:search", async (data: { query: string }) => {
        await searchContractsWithSummary(socket, data.query);
      });

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
