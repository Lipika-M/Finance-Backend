import { Router } from "express";
import {
  getDashboardSummary,
} from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(verifyJWT, authorizeRoles("admin", "analyst","viewer"));
router.route("/summary").get(getDashboardSummary);

export default router;
