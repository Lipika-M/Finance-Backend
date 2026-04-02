import { Router } from "express";
import {
  getTotalIncome,
  getTotalExpenses,
  getNetBalance,
  getCategoryWiseTotals,
  getRecentTransactions,
  getMonthlyTrends,
} from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(verifyJWT, authorizeRoles("admin", "analyst"));

router.route("/total-income").get(getTotalIncome);
router.route("/total-expenses").get(getTotalExpenses);
router.route("/net-balance").get(getNetBalance);
router.route("/category-wise-totals").get(getCategoryWiseTotals);
router.route("/recent-transactions").get(getRecentTransactions);
router.route("/monthly-trends").get(getMonthlyTrends);

export default router;
