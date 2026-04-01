// Application interface
import { Types } from "mongoose";

export interface IApplication {
    id?: string;
    userId?: Types.ObjectId;
    status?: "DRAFT" | "SUBMITTED" | "REVIEWING" | "APPROVED" | "REJECTED" | "REVISION_REQUESTED";
    createdAt?: Date;
    updatedAt?: Date;
    sectionA?: ISectionA;
    sectionB?: ISectionB;
    sectionC?: ISectionC;
    notes?: string;
    adminComments?: string;
    attachments?: string[];

    // Contract/document fields
    operator?: string;
    contractorName?: string;
    contractTitle?: string;
    year?: number;
    contractNumber?: string;
    startDate?: Date;
    endDate?: Date;
    contractValue?: string;
    documentURLS?: string[];
    hasMedia?: boolean;
    mediaType?: "pdf" | "image" | "mixed" | "other" | null;

    // Admin archive fields
    isArchived?: boolean;
    archivedAt?: Date;
    archivedBy?: Types.ObjectId;
  }
  
  // enums/currency.ts
  export const Currency = {
    FUSD: "FUSD",
    NGN: "NGN",
    USD: "USD",
  } as const;
  
  export type Currency = (typeof Currency)[keyof typeof Currency];
  
  export const ContractType = {
    CALL_OUT: "CALL-OUT",
    NON_CALL_OUT: "NON-CALL-OUT",
  } as const;
  
  export type ContractType = (typeof ContractType)[keyof typeof ContractType];
  
  export interface ISectionA {
    contractType: ContractType | null;
    currency: Currency | null;
    referenceNumber: string;
    dateAndRefIncPlanApproval: string;
    totalContractValue: string;
    operatorOrProjectPromoter: string;
    dateAndRefNCDMBTechEvaluation: string;
    totalNCValue: string;
    contractProjectTitle: string;
    dateAndRefNCDMBCommEvaluation: string;
    onePercentNCDF: string;
    contractProjectNumber: string;
    commencementDate: string;
    ncdmbHcdTrainingBudgetPercent: string;
    bidCommencementDate: string;
    contractCompletionDate: string;
    mainContractor: string;
    singleSourceApprovalDateAndRef: string;
    contractDuration: string;
    subContractors: string; // usually comma-separated or multiline
    totalNCPercentSpend: string;
    totalNCPercentManhours: string;
    operatorSignature?: File | string | null; // or string (base64 / url) depending on your signature handling
    operatorName: string;
    operatorDesignation: string;
    operatorDate: string; // ISO date string or empty
    serviceProviderSignature?: File | null;
    serviceProviderName?: string;
    serviceProviderDesignation?: string;
    serviceProviderDate?: string;
  }
  
  // Section B: Local Content Components
  export interface ISectionB {
    b1: IPersonnelRecords;
    b2: IProcurementRecord;
    b3: IEquipmentRecord;
    b4: IFabricationRecord;
    b5: IOtherServicesRecord;
    b6: IProfessionalServicesRecord;
  }
  
  export interface IPersonnelRecords {
    b1_0: IPersonnelRecord;
    b1_1: IPersonnelRecord;
    b1_2: IPersonnelRecord;
  }
  
  export interface IPersonnelRecord {
    id: string; // unique identifier (usually timestamp or uuid)
    jobPosition: string;
    companyName: string; // often includes address
    totalPersonnel: string; // kept as string because it's <input type="number"> controlled
    nigerianNationality: string;
    foreignNationality: string;
    inCountryNigerian: string;
    inCountryExpat: string;
    outCountryNigerian: string;
    outCountryExpat: string;
    ncSpendValue: string; // Nigerian Content spend
    foreignSpendValue: string;
    totalSpendValue: string;
    ncManhours: string; // NC% manhours (Nigerian Content %)
    ncSpendPercent: string; // NC% spend
  }
  
  interface IEquipmentRecord {
    id: string;
    equipmentName: string;
    availableInCountry: string;
    inCountryOwner: string;
    outCountryOwner: string;
    nigerianOwnership: string;
    foreignOwnership: string;
    ncPercent: string;
    ncValue: string;
    foreignValue: string;
    totalValue: string;
    ncSpendPercent: string;
  }
  
  interface IProcurementRecord {
    id: string;
    procurementItem: string;
    manufacturedInCountry: string;
    inCountryVendor: string;
    outCountryVendor: string;
    uom: string;
    procuredInCountry: string;
    procuredOutCountry: string;
    ncPercent: string;
    ncValue: string;
    foreignValue: string;
    totalValue: string;
    ncSpendPercent: string;
  }
  
  interface IFabricationRecord {
    id: string;
    itemName: string;
    inCountryFabricationYard: string;
    outCountryFabricationYard: string;
    uom: string;
    fabricatedInCountry: string;
    fabricatedOutCountry: string;
    ncPercentTonage: string;
    ncValue: string;
    foreignValue: string;
    totalValue: string;
    ncSpendPercent: string;
  }
  
  interface IOtherServicesRecord {
    id: string;
    itemName: string;
    inCountryVendor: string;
    outCountryVendor: string;
    uom: string;
    executedInCountry: string;
    executedOutCountry: string;
    ncPercent: string;
    ncValue: string;
    foreignValue: string;
    totalValue: string;
    ncSpendPercent: string;
  }
  
  interface IProfessionalServicesRecord {
    id: string;
    itemName: string;
    inCountryFirm: string;
    outCountryFirm: string;
    uom: string;
    executedInCountry: string;
    executedOutCountry: string;
    ncPercent: string;
    ncValue: string;
    foreignValue: string;
    totalValue: string;
    ncSpendPercent: string;
  }
  
  // Section C: Capacity Development & R&D
  export interface ISectionC {
    c1: IHCDTrainingRecord;
    c2: ICapacityDevelopmentRecord;
    c3: IResearchDevelopmentRecord;
  }
  
  interface IHCDTrainingRecord {
    id: string;
    trainingScope: string;
    hcdPercentage: string;
  }
  
  interface ICapacityDevelopmentRecord {
    id: string;
    scopeDetails: string;
    projectLocation: string;
    activityDuration: string;
    numberOfPersonnel: string;
    primaryActivity: string;
    outcome: string;
    costOfActivity: string;
  }
  
  
  interface IResearchDevelopmentRecord {
      id: string;
      typeOfResearch: string;
      projectLocation: string;
      activityDuration: string;
      numberOfResearcher: string;
      typeOfResearcher: string;
      briefScopeOfWork: string;
      costOfActivity: string;
    }
  
  // Application submission interface
  export interface IApplicationSubmission {
    application: IApplication;
    documents?: File[];
  }
  
  // Application response interface
  export interface IApplicationResponse {
    success: boolean;
    message: string;
    application?: IApplication;
    errors?: string[];
  }
  
  // Application filter interface
  export interface IApplicationFilter {
    status?: string[];
    contractId?: string;
    fromDate?: Date;
    toDate?: Date;
    search?: string;
  }
  