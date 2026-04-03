import { Router } from "express";
import {
  createFinancialRecord,
  getFinancialRecords,
  updateFinancialRecord,
  deleteFinancialRecord,
} from "../controllers/financialRecord.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  createFinancialRecordValidation,
  updateFinancialRecordValidation,
} from "../validators/financialRecord.validators.js";

const router = Router();

router
  .route("/")
  .post(
    verifyJWT,
    authorizeRoles("admin"),
    createFinancialRecordValidation,
    validateRequest,
    createFinancialRecord
  )
  .get(verifyJWT, authorizeRoles("admin", "analyst"), getFinancialRecords);

router
  .route("/:id")
  .patch(
    verifyJWT,
    authorizeRoles("admin"),
    updateFinancialRecordValidation,
    validateRequest,
    updateFinancialRecord
  )
  .delete(verifyJWT, authorizeRoles("admin"), deleteFinancialRecord);

export default router;
