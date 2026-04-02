import { Router } from "express";
import {
	registerUser,
	loginUser,
	logoutUser,
	refreshAccessToken,
	changeCurrentPassword,
	getCurrentUser,
	updateAccountDetails,
	getAllUsers,
	updateUserRole,
	updateUserStatus,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

// Public routes
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

// Protected routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

// Admin-only routes
router.route("/").get(verifyJWT, authorizeRoles("admin"), getAllUsers);
router
	.route("/:id/role")
	.patch(verifyJWT, authorizeRoles("admin"), updateUserRole);
router
	.route("/:id/status")
	.patch(verifyJWT, authorizeRoles("admin"), updateUserStatus);

export default router;
