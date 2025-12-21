import { model, Schema } from "mongoose";

const mediaSchema = new Schema(
  {
    url: { type: String, required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    publicId: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "user" },
    contractId: { type: Schema.Types.ObjectId, ref: "contract" },
    tags: [{ type: String }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

mediaSchema.index({ originalName: "text", filename: "text" });
mediaSchema.index({ isDeleted: 1 });
mediaSchema.index({ uploadedBy: 1 });
mediaSchema.index({ contractId: 1 });
mediaSchema.index({ tags: 1 });

export const Media = model("media", mediaSchema);
