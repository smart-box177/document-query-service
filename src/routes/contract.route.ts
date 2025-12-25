import { Router } from "express";
import { ContractController } from "../controllers/contract.controller";
import { optionalAuthMiddleware } from "../middleware/optional-auth.middleware";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Search with optional auth (saves history if authenticated)
router
  .route("/search")
  .get(optionalAuthMiddleware, ContractController.search);

// Search history routes (require authentication)
router
  .route("/search/history")
  .get(authMiddleware, ContractController.getSearchHistory)
  .delete(authMiddleware, ContractController.clearSearchHistory);

router
  .route("/search/history/:historyId")
  .delete(authMiddleware, ContractController.deleteSearchHistory);

// Contract CRUD routes
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
