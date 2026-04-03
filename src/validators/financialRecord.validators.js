import { body } from "express-validator";

const createFinancialRecordValidation = [
  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number"),
  body("type")
    .notEmpty()
    .withMessage("Type is required")
    .isIn(["income", "expense"])
    .withMessage("Type must be either income or expense"),
  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Category must be between 2 and 50 characters"),
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date"),
  body("notes")
    .optional({ nullable: true })
    .isLength({ max: 500 })
    .withMessage("Notes cannot exceed 500 characters"),
];

const updateFinancialRecordValidation = [
  body().custom((_, { req }) => {
    const allowedFields = ["amount", "type", "category", "date", "notes"];
    const hasAtLeastOneField = allowedFields.some((field) => req.body[field] !== undefined);

    if (!hasAtLeastOneField) {
      throw new Error("At least one field is required to update");
    }

    return true;
  }),
  body("amount")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number"),
  body("type")
    .optional()
    .isIn(["income", "expense"])
    .withMessage("Type must be either income or expense"),
  body("category")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category must be between 2 and 50 characters"),
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO 8601 date"),
  body("notes")
    .optional({ nullable: true })
    .isLength({ max: 500 })
    .withMessage("Notes cannot exceed 500 characters"),
];

export {
  createFinancialRecordValidation,
  updateFinancialRecordValidation,
};
