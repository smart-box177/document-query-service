import { model, Schema } from "mongoose";

const contractSchema = new Schema(
  {
    operator: { type: String, required: true },
    contractorName: { type: String, required: true, index: true },
    contractTitle: { type: String, required: true },
    year: { type: Number, required: true, index: true },
    contractNumber: { type: String, required: true, unique: true },
    startDate: { type: Date },
    endDate: { type: Date },
    contractValue: { type: String },
    documentURLS: [{ type: String }],
    hasDocument: { type: Boolean, default: false },
    // Admin-level archive fields
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date },
    archivedBy: { type: Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

contractSchema.index({ contractorName: 1, year: 1 });
contractSchema.index({ operator: 1 });
contractSchema.index({ hasDocument: 1 });

export const Contract = model("contract", contractSchema);
