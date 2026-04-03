import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const errorHandler = (error, _req, res, _next) => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let details = [];

  const toDetailsArray = (input) => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === "string") return [{ message: input }];
    if (typeof input === "object") return [input];
    return [];
  };

  if (error instanceof ApiError) {
    statusCode = error.statusCode || 500;
    message = error.message || message;
    details = toDetailsArray(error.error);
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Validation failed";
    details = Object.values(error.errors).map((fieldError) => ({
      field: fieldError.path,
      message: fieldError.message,
    }));
    message = details[0]?.message || message;
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${error.path}`;
    details = [
      {
        field: error.path,
        message: `${error.value} is not a valid ${error.kind}`,
      },
    ];
  } else if (error instanceof jwt.TokenExpiredError) {
    statusCode = 401;
    message = "Token has expired";
  } else if (error instanceof jwt.JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid authentication token";
  } else if (error?.code === 11000) {
    statusCode = 409;
    const duplicateFields = error.keyValue
      ? Object.entries(error.keyValue).map(([field, value]) => ({
          field,
          message: `${field} '${value}' already exists`,
        }))
      : [];
    details = duplicateFields;
    message = duplicateFields[0]?.message || "Duplicate key error";
  } else if (error instanceof SyntaxError && "body" in error) {
    statusCode = 400;
    message = "Invalid JSON payload";
    details = [{ message: "Request body contains malformed JSON" }];
  }

  if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
    statusCode = 500;
  }

  return res.status(statusCode).json(
    new ApiResponse(
      statusCode,
      details.length ? { errors: details } : null,
      message
    )
  );
};

export { errorHandler };
