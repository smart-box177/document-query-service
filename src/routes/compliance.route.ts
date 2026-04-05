import express from "express";
import { ComplianceController } from "../controllers/compliance.controller";
import { authenticateUser } from "../middleware/auth.middleware";

const router = express.Router();

router.use(authenticateUser);

router.get("/operator-reports", ComplianceController.getOperatorComplianceReports);

export { router as ComplianceRouter };