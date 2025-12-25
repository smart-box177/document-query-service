import { Document, Types } from "mongoose";

export interface ISearchHistory {
  userId: Types.ObjectId;
  query: string;
  resultsCount: number;
  tab: string;
}

export interface ISearchHistoryDocument extends ISearchHistory, Document {
  createdAt: Date;
  updatedAt: Date;
}
