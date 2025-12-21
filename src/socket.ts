import http from "http";
import { Server, Socket } from "socket.io";
import { ALLOWED_ORIGINS } from "./constant";
import { Contract } from "./models/contract.model";
import { Media } from "./models/media.model";

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
        await this.handleContractSearch(socket, data.query);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });
  }

  private async handleContractSearch(
    socket: Socket,
    query: string
  ): Promise<void> {
    try {
      if (!query) {
        socket.emit("contract:search:error", {
          message: "Search query is required",
        });
        return;
      }

      socket.emit("contract:search:start", { message: "Search started" });

      const searchQuery = String(query);
      const contracts = await Contract.find({
        $or: [
          { contractTitle: { $regex: searchQuery, $options: "i" } },
          { contractorName: { $regex: searchQuery, $options: "i" } },
          { operator: { $regex: searchQuery, $options: "i" } },
          { contractNumber: { $regex: searchQuery, $options: "i" } },
        ],
      }).limit(20);

      socket.emit("contract:search:progress", {
        message: `Found ${contracts.length} contracts`,
        count: contracts.length,
      });

      const contractIds = contracts.map((c) => c._id);
      const media = await Media.find({
        contractId: { $in: contractIds },
        isDeleted: false,
      }).select("url filename originalName mimetype size contractId");

      const contractsWithMedia = contracts.map((contract) => ({
        ...contract.toObject(),
        media: media.filter(
          (m) => m.contractId?.toString() === contract._id.toString()
        ),
      }));

      // Stream each contract individually
      for (const contract of contractsWithMedia) {
        socket.emit("contract:search:result", { contract });
      }

      socket.emit("contract:search:complete", {
        message: "Search completed",
        total: contractsWithMedia.length,
      });
    } catch (error) {
      const err = error instanceof Error ? error.message : "Unknown error";
      socket.emit("contract:search:error", { message: err });
    }
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
