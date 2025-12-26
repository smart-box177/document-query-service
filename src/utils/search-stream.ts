import { Socket } from "socket.io";
import { Contract } from "../models/contract.model";
import { Media } from "../models/media.model";
import { SearchHistory } from "../models/history.model";
import { readPdfFromUrl } from "./pdf-reader";
import { AI, search } from "../services/gemini.service";

/**
 * Check if error is a rate limit (429) error
 */
function isRateLimitError(error: unknown): boolean {
  if (error && typeof error === "object") {
    const err = error as { status?: number; code?: number; message?: string };
    if (err.status === 429 || err.code === 429) return true;
    if (
      err.message?.includes("429") ||
      err.message?.includes("RESOURCE_EXHAUSTED")
    )
      return true;
  }
  return false;
}

/**
 * Check if error is a PDF access error (401, 403, 404)
 */
function isPdfAccessError(error: unknown): boolean {
  if (error && typeof error === "object") {
    const err = error as { status?: number; code?: number; message?: string };
    if ([401, 403, 404].includes(err.status || 0)) return true;
    if (
      err.message?.includes("401") ||
      err.message?.includes("403") ||
      err.message?.includes("404")
    )
      return true;
  }
  return false;
}

/**
 * Performs a contract search with AI-powered document summarization
 * Streams results back to the client via socket
 * @param socket - Socket.io socket instance
 * @param query - Search query string
 * @param userId - Optional user ID for saving search history
 * @param tab - Optional tab identifier (all, contracts, documents, etc.)
 */
export async function searchContractsWithSummary(
  socket: Socket,
  query: string,
  userId?: string,
  tab: string = "all",
  archivedContractIds: string[] = []
): Promise<void> {
  let aiAvailable = true;
  let resultsCount = 0;

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

    if (contracts.length === 0) {
      socket.emit("contract:search:complete", {
        message: "No contracts found",
        total: 0,
      });
      return;
    }

    // Filter out archived contracts
    const filteredContracts = contracts.filter(
      (c) => !archivedContractIds.includes(c._id.toString())
    );

    const contractIds = filteredContracts.map((c) => c._id);
    const media = await Media.find({
      contractId: { $in: contractIds },
      isDeleted: false,
    }).select("url filename originalName mimetype size contractId");

    const contractsWithMedia = filteredContracts.map((contract) => {
      const contractMedia = media.filter(
        (m) => m.contractId?.toString() === contract._id.toString()
      );
      return {
        ...contract.toObject(),
        media: contractMedia,
        // Add zip download URL for contracts with multiple files
        zipUrl:
          contractMedia.length > 1
            ? `/api/media/zip/${contract._id.toString()}`
            : null,
      };
    });

    // Stream each contract with document summary
    for (const contract of contractsWithMedia) {
      let documentSummary: string | null = null;

      // If contract has PDF documents and AI is available, extract and summarize
      if (aiAvailable && contract.media && contract.media.length > 0) {
        const pdfMedia = contract.media.find(
          (m) => m.mimetype === "application/pdf" || m.url?.endsWith(".pdf")
        );

        if (pdfMedia) {
          try {
            socket.emit("contract:search:progress", {
              message: `Reading document for ${contract.contractTitle}...`,
            });

            console.log(`Attempting to read PDF from: ${pdfMedia.url}`);
            const pdfText = await readPdfFromUrl(pdfMedia.url, 500);

            if (pdfText && pdfText.length > 50) {
              socket.emit("contract:search:progress", {
                message: `Generating summary for ${contract.contractTitle}...`,
              });

              const summaryPrompt = `Summarize this contract document in 2-3 sentences. Focus on key terms, parties involved, and main obligations:\n\n${pdfText}`;

              const response = await search(summaryPrompt);

              documentSummary = response.text || null;
            }
          } catch (err) {
            if (isRateLimitError(err)) {
              console.warn("AI rate limit reached, skipping AI summaries");
              aiAvailable = false;
            } else if (isPdfAccessError(err)) {
              // PDF not accessible, skip silently
              console.warn(
                `PDF not accessible for contract ${contract._id}, skipping summary`
              );
            } else {
              console.error(
                `Failed to summarize document for contract ${contract._id}:`,
                err
              );
            }
          }
        }
      }

      socket.emit("contract:search:result", {
        contract: {
          ...contract,
          documentSummary,
        },
      });
    }

    // Generate overall search summary if AI is available
    if (aiAvailable) {
      socket.emit("contract:search:progress", {
        message: "Generating search summary...",
      });

      const contractSummaries = contractsWithMedia
        .map(
          (c) =>
            `- ${c.contractTitle} (${c.operator}, ${c.contractorName}, ${c.year})`
        )
        .join("\n");

      const overallPrompt = `Based on the search query "${query}", provide a brief 2-3 sentence summary of these contract search results:\n\n${contractSummaries}`;

      try {
        const overallResponse = await AI.models.generateContent({
          model: "gemini-2.0-flash",
          contents: overallPrompt,
        });

        socket.emit("contract:search:summary", {
          summary: overallResponse.text || "No summary available",
        });
      } catch (err) {
        if (isRateLimitError(err)) {
          console.warn("AI rate limit reached, skipping overall summary");
          socket.emit("contract:search:summary", {
            summary: `Found ${contractsWithMedia.length} contracts matching "${query}"`,
          });
        } else {
          console.error("Failed to generate overall summary:", err);
          socket.emit("contract:search:summary", {
            summary: `Found ${contractsWithMedia.length} contracts matching "${query}"`,
          });
        }
      }
    } else {
      socket.emit("contract:search:summary", {
        summary: `Found ${contractsWithMedia.length} contracts matching "${query}" (AI summaries unavailable due to rate limits)`,
      });
    }

    resultsCount = contractsWithMedia.length;

    socket.emit("contract:search:complete", {
      message: "Search completed",
      total: contractsWithMedia.length,
    });

    // Save search history if user is authenticated
    if (userId) {
      await SearchHistory.create({
        userId,
        query: searchQuery,
        resultsCount,
        tab,
      }).catch((err) => {
        console.error("Failed to save search history:", err);
      });
    }
  } catch (error) {
    const err = error instanceof Error ? error.message : "Unknown error";
    socket.emit("contract:search:error", { message: err });
  }
}
