import { model, Schema } from "mongoose";
import { IApplication } from "../interfaces/application";

// Sub-schemas for Section B records
const personnelRecordSchema = new Schema(
  {
    id: { type: String, required: true },
    jobPosition: { type: String, required: true },
    companyName: { type: String, required: true },
    totalPersonnel: { type: String, required: true },
    nigerianNationality: { type: String, required: true },
    foreignNationality: { type: String, required: true },
    inCountryNigerian: { type: String, required: true },
    inCountryExpat: { type: String, required: true },
    outCountryNigerian: { type: String, required: true },
    outCountryExpat: { type: String, required: true },
    ncSpendValue: { type: String, required: true },
    foreignSpendValue: { type: String, required: true },
    totalSpendValue: { type: String, required: true },
    ncManhours: { type: String, required: true },
    ncSpendPercent: { type: String, required: true },
  },
  { _id: false }
);

const equipmentRecordSchema = new Schema(
  {
    id: { type: String, required: true },
    equipmentName: { type: String, required: true },
    availableInCountry: { type: String, required: true },
    inCountryOwner: { type: String, required: true },
    outCountryOwner: { type: String, required: true },
    nigerianOwnership: { type: String, required: true },
    foreignOwnership: { type: String, required: true },
    ncPercent: { type: String, required: true },
    ncValue: { type: String, required: true },
    foreignValue: { type: String, required: true },
    totalValue: { type: String, required: true },
    ncSpendPercent: { type: String, required: true },
  },
  { _id: false }
);

const procurementRecordSchema = new Schema(
  {
    id: { type: String, required: true },
    procurementItem: { type: String, required: true },
    manufacturedInCountry: { type: String, required: true },
    inCountryVendor: { type: String, required: true },
    outCountryVendor: { type: String, required: true },
    uom: { type: String, required: true },
    procuredInCountry: { type: String, required: true },
    procuredOutCountry: { type: String, required: true },
    ncPercent: { type: String, required: true },
    ncValue: { type: String, required: true },
    foreignValue: { type: String, required: true },
    totalValue: { type: String, required: true },
    ncSpendPercent: { type: String, required: true },
  },
  { _id: false }
);

const fabricationRecordSchema = new Schema(
  {
    id: { type: String, required: true },
    itemName: { type: String, required: true },
    inCountryFabricationYard: { type: String, required: true },
    outCountryFabricationYard: { type: String, required: true },
    uom: { type: String, required: true },
    fabricatedInCountry: { type: String, required: true },
    fabricatedOutCountry: { type: String, required: true },
    ncPercentTonage: { type: String, required: true },
    ncValue: { type: String, required: true },
    foreignValue: { type: String, required: true },
    totalValue: { type: String, required: true },
    ncSpendPercent: { type: String, required: true },
  },
  { _id: false }
);

const otherServicesRecordSchema = new Schema(
  {
    id: { type: String, required: true },
    itemName: { type: String, required: true },
    inCountryVendor: { type: String, required: true },
    outCountryVendor: { type: String, required: true },
    uom: { type: String, required: true },
    executedInCountry: { type: String, required: true },
    executedOutCountry: { type: String, required: true },
    ncPercent: { type: String, required: true },
    ncValue: { type: String, required: true },
    foreignValue: { type: String, required: true },
    totalValue: { type: String, required: true },
    ncSpendPercent: { type: String, required: true },
  },
  { _id: false }
);

const professionalServicesRecordSchema = new Schema(
  {
    id: { type: String, required: true },
    itemName: { type: String, required: true },
    inCountryFirm: { type: String, required: true },
    outCountryFirm: { type: String, required: true },
    uom: { type: String, required: true },
    executedInCountry: { type: String, required: true },
    executedOutCountry: { type: String, required: true },
    ncPercent: { type: String, required: true },
    ncValue: { type: String, required: true },
    foreignValue: { type: String, required: true },
    totalValue: { type: String, required: true },
    ncSpendPercent: { type: String, required: true },
  },
  { _id: false }
);

// Sub-schemas for Section C records
const hcdTrainingRecordSchema = new Schema(
  {
    id: { type: String, required: true },
    trainingScope: { type: String, required: true },
    hcdPercentage: { type: String, required: true },
  },
  { _id: false }
);

const capacityDevelopmentRecordSchema = new Schema(
  {
    id: { type: String, required: true },
    scopeDetails: { type: String, required: true },
    projectLocation: { type: String, required: true },
    activityDuration: { type: String, required: true },
    numberOfPersonnel: { type: String, required: true },
    primaryActivity: { type: String, required: true },
    outcome: { type: String, required: true },
    costOfActivity: { type: String, required: true },
  },
  { _id: false }
);

const researchDevelopmentRecordSchema = new Schema(
  {
    id: { type: String, required: true },
    typeOfResearch: { type: String, required: true },
    projectLocation: { type: String, required: true },
    activityDuration: { type: String, required: true },
    numberOfResearcher: { type: String, required: true },
    typeOfResearcher: { type: String, required: true },
    briefScopeOfWork: { type: String, required: true },
    costOfActivity: { type: String, required: true },
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
    referenceNumber: { type: String, required: true },
    dateAndRefIncPlanApproval: { type: String, required: true },
    totalContractValue: { type: String, required: true },
    operatorOrProjectPromoter: { type: String, required: true },
    dateAndRefNCDMBTechEvaluation: { type: String, required: true },
    totalNCValue: { type: String, required: true },
    contractProjectTitle: { type: String, required: true },
    dateAndRefNCDMBCommEvaluation: { type: String, required: true },
    onePercentNCDF: { type: String, required: true },
    contractProjectNumber: { type: String, required: true },
    commencementDate: { type: String, required: true },
    ncdmbHcdTrainingBudgetPercent: { type: String, required: true },
    bidCommencementDate: { type: String, required: true },
    contractCompletionDate: { type: String, required: true },
    mainContractor: { type: String, required: true },
    singleSourceApprovalDateAndRef: { type: String, required: true },
    contractDuration: { type: String, required: true },
    subContractors: { type: String, required: true },
    totalNCPercentSpend: { type: String, required: true },
    totalNCPercentManhours: { type: String, required: true },
    operatorSignature: { type: String },
    operatorName: { type: String, required: true },
    operatorDesignation: { type: String, required: true },
    operatorDate: { type: String, required: true },
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
    contractId: { type: Schema.Types.ObjectId, ref: "contract" },
    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED", "REVIWING", "APPROVED", "REJECTED"],
      default: "DRAFT",
    },
    sectionA: sectionASchema,
    sectionB: sectionBSchema,
    sectionC: sectionCSchema,
    notes: { type: String },
    attachments: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Indexes for common queries
applicationSchema.index({ contractId: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });

export const Application = model<IApplication>(
  "application",
  applicationSchema
);
