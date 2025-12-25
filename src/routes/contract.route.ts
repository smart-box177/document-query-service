import { Router } from "express";
import { ContractController } from "../controllers/contract.controller";
import { optionalAuthMiddleware } from "../middleware/optional-auth.middleware";

const router = Router();

router
  .route("/search")
  .get(optionalAuthMiddleware, ContractController.search);

router
  .route("/")
  .get(ContractController.getAll)
  .post(ContractController.create);

router
  .route("/:id")
  .get(ContractController.getById)
  .put(ContractController.update)
  .delete(ContractController.delete);

export { router as ContractRouter };
