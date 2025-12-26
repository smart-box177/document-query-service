import { Router } from "express";
import { ContractController } from "../controllers/contract.controller";
import { authenticateUser } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticateUser);

// Search with optional auth (saves history if authenticated)
router
  .route("/search")
  .get(ContractController.search);

// Search history routes (require authentication)
router
  .route("/search/history")
  .get(ContractController.getSearchHistory)
  .delete(ContractController.clearSearchHistory);

router
  .route("/search/history/:historyId")
  .delete(ContractController.deleteSearchHistory);

// Bookmark routes (require authentication)
router
  .route("/bookmarks")
  .get(ContractController.getBookmarks)
  .delete(ContractController.clearBookmarks);

router
  .route("/bookmarks/:contractId")
  .post(ContractController.addBookmark)
  .delete(ContractController.removeBookmark);

// Contract CRUD routes
router.route("/").get(ContractController.getAll).post(ContractController.create);

router
  .route("/:id")
  .get(ContractController.getById)
  .put(ContractController.update)
  .delete(ContractController.delete);

export { router as ContractRouter };
