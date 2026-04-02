import FinancialRecord from "../models/financialRecord.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getTotalIncome = asyncHandler(async (_req, res) => {
  const [result] = await FinancialRecord.aggregate([
    { $match: { isDeleted: false, type: "income" } },
    { $group: { _id: null, totalIncome: { $sum: "$amount" } } },
    { $project: { _id: 0, totalIncome: 1 } },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { totalIncome: result?.totalIncome || 0 },
        "Total income retrieved successfully"
      )
    );
});

const getTotalExpenses = asyncHandler(async (_req, res) => {
  const [result] = await FinancialRecord.aggregate([
    { $match: { isDeleted: false, type: "expense" } },
    { $group: { _id: null, totalExpenses: { $sum: "$amount" } } },
    { $project: { _id: 0, totalExpenses: 1 } },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { totalExpenses: result?.totalExpenses || 0 },
        "Total expenses retrieved successfully"
      )
    );
});

const getNetBalance = asyncHandler(async (_req, res) => {
  const [result] = await FinancialRecord.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
          },
        },
        totalExpenses: {
          $sum: {
            $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalIncome: 1,
        totalExpenses: 1,
        netBalance: { $subtract: ["$totalIncome", "$totalExpenses"] },
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalIncome: result?.totalIncome || 0,
        totalExpenses: result?.totalExpenses || 0,
        netBalance: result?.netBalance || 0,
      },
      "Net balance retrieved successfully"
    )
  );
});

const getCategoryWiseTotals = asyncHandler(async (_req, res) => {
  const categoryTotals = await FinancialRecord.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
        transactionCount: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        category: "$_id",
        total: 1,
        transactionCount: 1,
      },
    },
    { $sort: { total: -1 } },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        categoryTotals,
        "Category-wise totals retrieved successfully"
      )
    );
});

const getRecentTransactions = asyncHandler(async (_req, res) => {
  const recentTransactions = await FinancialRecord.aggregate([
    { $match: { isDeleted: false } },
    { $sort: { date: -1, createdAt: -1 } },
    { $limit: 5 },
    {
      $project: {
        _id: 1,
        userId: 1,
        amount: 1,
        type: 1,
        category: 1,
        date: 1,
        notes: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        recentTransactions,
        "Recent transactions retrieved successfully"
      )
    );
});

const getMonthlyTrends = asyncHandler(async (_req, res) => {
  const monthlyTrends = await FinancialRecord.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
          },
        },
        totalExpenses: {
          $sum: {
            $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
          },
        },
        transactionCount: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        totalIncome: 1,
        totalExpenses: 1,
        netBalance: { $subtract: ["$totalIncome", "$totalExpenses"] },
        transactionCount: 1,
      },
    },
    { $sort: { year: 1, month: 1 } },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, monthlyTrends, "Monthly trends retrieved successfully")
    );
});

export {
  getTotalIncome,
  getTotalExpenses,
  getNetBalance,
  getCategoryWiseTotals,
  getRecentTransactions,
  getMonthlyTrends,
};
