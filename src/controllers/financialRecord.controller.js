import mongoose from "mongoose";
import FinancialRecord from "../models/financialRecord.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createFinancialRecord = asyncHandler(async (req, res) => {
  if (req.user?.role !== "admin") {
    throw new ApiError(403, "Forbidden");
  }

  const { userId, amount, type, category, date, notes } = req.body;

  if (!userId || amount === undefined || !type || !category) {
    throw new ApiError(400, "User ID, amount, type, and category are required");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const userExists = await User.findById(userId).select("_id");
  if (!userExists) {
    throw new ApiError(404, "User not found");
  }

  const record = await FinancialRecord.create({
    userId,
    amount,
    type,
    category,
    date,
    notes,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, record, "Financial record created successfully"));
});

const getFinancialRecords = asyncHandler(async (req, res) => {
  const { type, category, startDate, endDate } = req.query;

  const filter = { isDeleted: false };

  if (type) {
    filter.type = type;
  }

  if (category) {
    filter.category = String(category).trim().toLowerCase();
  }

  if (startDate || endDate) {
    filter.date = {};

    if (startDate) {
      const parsedStart = new Date(startDate);
      if (Number.isNaN(parsedStart.getTime())) {
        throw new ApiError(400, "Invalid startDate");
      }
      filter.date.$gte = parsedStart;
    }

    if (endDate) {
      const parsedEnd = new Date(endDate);
      if (Number.isNaN(parsedEnd.getTime())) {
        throw new ApiError(400, "Invalid endDate");
      }
      filter.date.$lte = parsedEnd;
    }
  }

  const records = await FinancialRecord.find(filter)
    .sort({ date: -1 })
    .populate("userId", "name email role");

  return res
    .status(200)
    .json(new ApiResponse(200, records, "Financial records retrieved successfully"));
});

const updateFinancialRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid record id");
  }

  const { amount, type, category, date, notes } = req.body;
  const updateFields = {};

  if (amount !== undefined) updateFields.amount = amount;
  if (type !== undefined) updateFields.type = type;
  if (category !== undefined) updateFields.category = String(category).trim().toLowerCase();
  if (date !== undefined) updateFields.date = date;
  if (notes !== undefined) updateFields.notes = notes;

  if (Object.keys(updateFields).length === 0) {
    throw new ApiError(400, "At least one field is required to update");
  }

  const updatedRecord = await FinancialRecord.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!updatedRecord) {
    throw new ApiError(404, "Financial record not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedRecord, "Financial record updated successfully"));
});

const deleteFinancialRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid record id");
  }

  const deletedRecord = await FinancialRecord.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );

  if (!deletedRecord) {
    throw new ApiError(404, "Financial record not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Financial record deleted successfully"));
});

export {
  createFinancialRecord,
  getFinancialRecords,
  updateFinancialRecord,
  deleteFinancialRecord,
};
