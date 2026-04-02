import { Router } from "express";
import {
  createFinancialRecord,
  getFinancialRecords,
  updateFinancialRecord,
  deleteFinancialRecord,
} from "../controllers/financialRecord.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router
  .route("/")
  .post(verifyJWT, authorizeRoles("admin"), createFinancialRecord)
  .get(verifyJWT, authorizeRoles("admin", "analyst"), getFinancialRecords);

router
  .route("/:id")
  .patch(verifyJWT, authorizeRoles("admin"), updateFinancialRecord)
  .delete(verifyJWT, authorizeRoles("admin"), deleteFinancialRecord);

export default router;
