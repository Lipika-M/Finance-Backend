import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

const validateRequest = (req, _res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array({ onlyFirstError: true }).map((error) => ({
      field: error.path,
      message: error.msg,
    }));
    const firstMessage = formattedErrors[0]?.message || "Validation failed";

    throw new ApiError(400, firstMessage, formattedErrors);
  }

  next();
};

export { validateRequest };
