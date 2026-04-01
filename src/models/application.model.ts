import { model, Schema } from "mongoose";
import { IApplication } from "../interfaces/application";

// Sub-schemas for Section B records
const personnelRecordSchema = new Schema(
  {
    id: { type: String },
    jobPosition: { type: String },
    companyName: { type: String },
    totalPersonnel: { type: String },
    nigerianNationality: { type: String },
    foreignNationality: { type: String },
    inCountryNigerian: { type: String },
    inCountryExpat: { type: String },
    outCountryNigerian: { type: String },
    outCountryExpat: { type: String },
    ncSpendValue: { type: String },
    foreignSpendValue: { type: String },
    totalSpendValue: { type: String },
    ncManhours: { type: String },
    ncSpendPercent: { type: String },
  },
  { _id: false }
);

const equipmentRecordSchema = new Schema(
  {
    id: { type: String },
    equipmentName: { type: String },
    availableInCountry: { type: String },
    inCountryOwner: { type: String },
    outCountryOwner: { type: String },
    nigerianOwnership: { type: String },
    foreignOwnership: { type: String },
    ncPercent: { type: String },
    ncValue: { type: String },
    foreignValue: { type: String },
    totalValue: { type: String },
    ncSpendPercent: { type: String },
  },
  { _id: false }
);

const procurementRecordSchema = new Schema(
  {
    id: { type: String },
    procurementItem: { type: String },
    manufacturedInCountry: { type: String },
    inCountryVendor: { type: String },
    outCountryVendor: { type: String },
    uom: { type: String },
    procuredInCountry: { type: String },
    procuredOutCountry: { type: String },
    ncPercent: { type: String },
    ncValue: { type: String },
    foreignValue: { type: String },
    totalValue: { type: String },
    ncSpendPercent: { type: String },
  },
  { _id: false }
);

const fabricationRecordSchema = new Schema(
  {
    id: { type: String },
    itemName: { type: String },
    inCountryFabricationYard: { type: String },
    outCountryFabricationYard: { type: String },
    uom: { type: String },
    fabricatedInCountry: { type: String },
    fabricatedOutCountry: { type: String },
    ncPercentTonage: { type: String },
    ncValue: { type: String },
    foreignValue: { type: String },
    totalValue: { type: String },
    ncSpendPercent: { type: String },
  },
  { _id: false }
);

const otherServicesRecordSchema = new Schema(
  {
    id: { type: String },
    itemName: { type: String },
    inCountryVendor: { type: String },
    outCountryVendor: { type: String },
    uom: { type: String },
    executedInCountry: { type: String },
    executedOutCountry: { type: String },
    ncPercent: { type: String },
    ncValue: { type: String },
    foreignValue: { type: String },
    totalValue: { type: String },
    ncSpendPercent: { type: String },
  },
  { _id: false }
);

const professionalServicesRecordSchema = new Schema(
  {
    id: { type: String },
    itemName: { type: String },
    inCountryFirm: { type: String },
    outCountryFirm: { type: String },
    uom: { type: String },
    executedInCountry: { type: String },
    executedOutCountry: { type: String },
    ncPercent: { type: String },
    ncValue: { type: String },
    foreignValue: { type: String },
    totalValue: { type: String },
    ncSpendPercent: { type: String },
  },
  { _id: false }
);

// Sub-schemas for Section C records
const hcdTrainingRecordSchema = new Schema(
  {
    id: { type: String },
    trainingScope: { type: String },
    hcdPercentage: { type: String },
  },
  { _id: false }
);

const capacityDevelopmentRecordSchema = new Schema(
  {
    id: { type: String },
    scopeDetails: { type: String },
    projectLocation: { type: String },
    activityDuration: { type: String },
    numberOfPersonnel: { type: String },
    primaryActivity: { type: String },
    outcome: { type: String },
    costOfActivity: { type: String },
  },
  { _id: false }
);

const researchDevelopmentRecordSchema = new Schema(
  {
    id: { type: String },
    typeOfResearch: { type: String },
    projectLocation: { type: String },
    activityDuration: { type: String },
    numberOfResearcher: { type: String },
    typeOfResearcher: { type: String },
    briefScopeOfWork: { type: String },
    costOfActivity: { type: String },
  },
  { _id: false }
);

// Section B schema
const sectionBSchema = new Schema(
  {
    b1: {
      b1_0: personnelRecordSchema,
      b1_1: personnelRecordSchema,
      b1_2: personnelRecordSchema,
    },
    b2: [procurementRecordSchema],
    b3: [equipmentRecordSchema],
    b4: [fabricationRecordSchema],
    b5: [otherServicesRecordSchema],
    b6: [professionalServicesRecordSchema],
  },
  { _id: false }
);

// Section C schema
const sectionCSchema = new Schema(
  {
    c1: hcdTrainingRecordSchema,
    c2: [capacityDevelopmentRecordSchema],
    c3: [researchDevelopmentRecordSchema],
  },
  { _id: false }
);

// Section A schema
const sectionASchema = new Schema(
  {
    contractType: {
      type: String,
      enum: ["CALL-OUT", "NON-CALL-OUT"],
      default: null,
    },
    currency: { type: String, enum: ["FUSD", "NGN", "USD"], default: null },
    referenceNumber: { type: String },
    dateAndRefIncPlanApproval: { type: String },
    totalContractValue: { type: String },
    operatorOrProjectPromoter: { type: String },
    dateAndRefNCDMBTechEvaluation: { type: String },
    totalNCValue: { type: String },
    contractProjectTitle: { type: String },
    dateAndRefNCDMBCommEvaluation: { type: String },
    onePercentNCDF: { type: String },
    contractProjectNumber: { type: String },
    commencementDate: { type: String },
    ncdmbHcdTrainingBudgetPercent: { type: String },
    bidCommencementDate: { type: String },
    contractCompletionDate: { type: String },
    mainContractor: { type: String },
    singleSourceApprovalDateAndRef: { type: String },
    contractDuration: { type: String },
    subContractors: { type: String },
    totalNCPercentSpend: { type: String },
    totalNCPercentManhours: { type: String },
    operatorSignature: { type: String },
    operatorName: { type: String },
    operatorDesignation: { type: String },
    operatorDate: { type: String },
    serviceProviderSignature: { type: String },
    serviceProviderName: { type: String },
    serviceProviderDesignation: { type: String },
    serviceProviderDate: { type: String },
  },
  { _id: false }
);

// Main application schema
const applicationSchema = new Schema<IApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "user" },
    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED", "REVIEWING", "APPROVED", "REJECTED", "REVISION_REQUESTED"],
      default: "DRAFT",
    },
    sectionA: { type: sectionASchema, required: false },
    sectionB: { type: sectionBSchema, required: false },
    sectionC: { type: sectionCSchema, required: false },
    notes: { type: String },
    adminComments: { type: String },
    attachments: { type: [String], default: [] },

    // Contract/document fields (migrated from Contract model)
    operator: { type: String, index: true },
    contractorName: { type: String, index: true },
    contractTitle: { type: String },
    year: { type: Number, index: true },
    contractNumber: { type: String, unique: true, sparse: true },
    startDate: { type: Date },
    endDate: { type: Date },
    contractValue: { type: String },
    documentURLS: [{ type: String }],
    hasMedia: { type: Boolean, default: false },
    mediaType: { type: String, enum: ["pdf", "image", "mixed", "other", null], default: null },

    // Admin-level archive fields
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date },
    archivedBy: { type: Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

// Pre-save hook to generate reference number
applicationSchema.pre('save', async function() {
  // Generate reference number if not already set and operator name is provided
  if (this.sectionA && !this.sectionA.referenceNumber && this.sectionA.operatorName) {
    // Clean operator name: remove special characters, replace spaces with hyphens, convert to uppercase
    const cleanOperatorName = this.sectionA.operatorName
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .toUpperCase();
    
    // Get current date in YYYYMMDD format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    this.sectionA.referenceNumber = `NCCC/${cleanOperatorName}/${dateStr}`;
  }
});

// Indexes for common queries
applicationSchema.index({ contractorName: 1, year: 1 });
applicationSchema.index({ operator: 1 });
applicationSchema.index({ hasMedia: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });

export const Application = model<IApplication>(
  "application",
  applicationSchema
);
