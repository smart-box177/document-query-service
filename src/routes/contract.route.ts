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

// User archive routes (require authentication)
router
  .route("/archive/user")
  .get(ContractController.getUserArchive)
  .delete(ContractController.clearUserArchive);

router
  .route("/archive/user/:contractId")
  .post(ContractController.archiveForUser)
  .delete(ContractController.restoreForUser);

// Global archive routes (admin only)
router
  .route("/archive/global")
  .get(ContractController.getGlobalArchive)
  .delete(ContractController.emptyGlobalArchive);

router
  .route("/archive/global/:contractId")
  .post(ContractController.archiveGlobally)
  .delete(ContractController.restoreGlobally);

router
  .route("/archive/global/:contractId/permanent")
  .delete(ContractController.permanentlyDelete);

// Contract CRUD routes
router.route("/").get(ContractController.getAll).post(ContractController.create);

router
  .route("/:id")
  .get(ContractController.getById)
  .put(ContractController.update)
  .delete(ContractController.delete);

export { router as ContractRouter };
