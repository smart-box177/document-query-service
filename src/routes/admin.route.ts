import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticateUser } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";
import { ApplicationController } from "../controllers/application.controller";

const router = Router();

// All routes require authentication and admin role
router.use(authenticateUser);
router.use(requireAdmin);

// GET /users - Get all users
router.route("/").get(UserController.getAllUsers);

// GET /users/stats - Get user statistics
router.route("/stats").get(UserController.getUserStats);

// Get all applications with filters
router.get('/applications', ApplicationController.getApplicationsAdmin);

// GET /users/:id - Get user by ID
router.route("/:id").get(UserController.getUserById);

// PATCH /users/:id/role - Update user role
router.route("/:id/role").patch(UserController.updateUserRole);

// DELETE /users/:id - Delete user
router.route("/:id").delete(UserController.deleteUser);

export { router as AdminRouter };
