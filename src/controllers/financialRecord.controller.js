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
  const {
    page = 1,
    limit = 10,
    type,
    category,
    minAmount,
    maxAmount,
    startDate,
    endDate,
    sortBy = "date",
    order = "desc",
  } = req.query;

  const parsedPage = Number.parseInt(page, 10);
  const parsedLimit = Number.parseInt(limit, 10);

  if (Number.isNaN(parsedPage) || parsedPage < 1) {
    throw new ApiError(400, "page must be a positive integer");
  }

  if (Number.isNaN(parsedLimit) || parsedLimit < 1) {
    throw new ApiError(400, "limit must be a positive integer");
  }

  const skip = (parsedPage - 1) * parsedLimit;

  const filter = { isDeleted: false };

  if (req.user.role === "analyst") {
    filter.userId = req.user._id;
  } else if (req.user.role !== "admin") {
    throw new ApiError(403, "Forbidden");
  }

  if (type) {
    if (!["income", "expense"].includes(type)) {
      throw new ApiError(400, "type must be either income or expense");
    }
    filter.type = type;
  }

  if (category) {
    filter.category = String(category).trim().toLowerCase();
  }

  if (minAmount !== undefined || maxAmount !== undefined) {
    filter.amount = {};

    if (minAmount !== undefined) {
      const parsedMinAmount = Number(minAmount);
      if (Number.isNaN(parsedMinAmount)) {
        throw new ApiError(400, "Invalid minAmount");
      }
      filter.amount.$gte = parsedMinAmount;
    }

    if (maxAmount !== undefined) {
      const parsedMaxAmount = Number(maxAmount);
      if (Number.isNaN(parsedMaxAmount)) {
        throw new ApiError(400, "Invalid maxAmount");
      }
      filter.amount.$lte = parsedMaxAmount;
    }
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

  const allowedSortFields = ["date", "amount", "category"];
  if (!allowedSortFields.includes(sortBy)) {
    throw new ApiError(400, "Invalid sortBy field");
  }

  const normalizedOrder = String(order).toLowerCase();
  if (!["asc", "desc"].includes(normalizedOrder)) {
    throw new ApiError(400, "order must be either asc or desc");
  }

  const sortOrder = normalizedOrder === "asc" ? 1 : -1;

  const records = await FinancialRecord.find(filter)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(parsedLimit)
    .populate("userId", "name email role");

  const totalRecords = await FinancialRecord.countDocuments(filter);
  const totalPages = Math.ceil(totalRecords / parsedLimit);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          records,
          totalRecords,
          totalPages,
          currentPage: parsedPage,
          limit: parsedLimit,
        },
        "Financial records retrieved successfully"
      )
    );
});

const getFinancialRecordById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid record id");
  }

  const filter = { _id: id, isDeleted: false };

  if (req.user.role !== "admin") {
    filter.userId = req.user._id;
  }

  const record = await FinancialRecord.findOne(filter).populate(
    "userId",
    "name email role"
  );

  if (!record) {
    throw new ApiError(404, "Financial record not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, record, "Financial record retrieved successfully"));
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
    { returnDocument: "after", runValidators: true }
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
    { returnDocument: "after" }
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
  getFinancialRecordById,
  updateFinancialRecord,
  deleteFinancialRecord,
};
