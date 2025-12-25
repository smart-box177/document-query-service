import { model, Schema } from "mongoose";
import { ISearchHistoryDocument } from "../interfaces/history";

const searchHistorySchema = new Schema<ISearchHistoryDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
    resultsCount: {
      type: Number,
      default: 0,
    },
    tab: {
      type: String,
      default: "all",
    },
  },
  { timestamps: true }
);

// Index for efficient queries by user and date
searchHistorySchema.index({ userId: 1, createdAt: -1 });

export const SearchHistory = model<ISearchHistoryDocument>(
  "searchHistory",
  searchHistorySchema
);
