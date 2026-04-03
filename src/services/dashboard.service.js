import mongoose from "mongoose";
import FinancialRecord from "../models/financialRecord.model.js";

const toObjectId = (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }

  return new mongoose.Types.ObjectId(userId);
};

const buildBaseMatch = (userId) => {
  const objectId = toObjectId(userId);

  if (!objectId) {
    return null;
  }

  return { userId: objectId, isDeleted: false };
};

const getTotalIncome = async (userId) => {
  const baseMatch = buildBaseMatch(userId);
  if (!baseMatch) return 0;

  const [result] = await FinancialRecord.aggregate([
    { $match: { ...baseMatch, type: "income" } },
    { $group: { _id: null, totalIncome: { $sum: "$amount" } } },
    { $project: { _id: 0, totalIncome: 1 } },
  ]);

  return result?.totalIncome || 0;
};

const getTotalExpenses = async (userId) => {
  const baseMatch = buildBaseMatch(userId);
  if (!baseMatch) return 0;

  const [result] = await FinancialRecord.aggregate([
    { $match: { ...baseMatch, type: "expense" } },
    { $group: { _id: null, totalExpenses: { $sum: "$amount" } } },
    { $project: { _id: 0, totalExpenses: 1 } },
  ]);

  return result?.totalExpenses || 0;
};

const getCategoryTotals = async (userId) => {
  const baseMatch = buildBaseMatch(userId);
  if (!baseMatch) return [];

  return FinancialRecord.aggregate([
    { $match: baseMatch },
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
};

const getRecentTransactions = async (userId) => {
  const baseMatch = buildBaseMatch(userId);
  if (!baseMatch) return [];

  return FinancialRecord.aggregate([
    { $match: baseMatch },
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
};

const getMonthlyTrends = async (userId) => {
  const baseMatch = buildBaseMatch(userId);
  if (!baseMatch) return [];

  return FinancialRecord.aggregate([
    { $match: baseMatch },
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
};

export {
  getTotalIncome,
  getTotalExpenses,
  getCategoryTotals,
  getRecentTransactions,
  getMonthlyTrends,
};
