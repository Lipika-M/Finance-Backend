import mongoose from "mongoose";
import FinancialRecord from "../models/financialRecord.model.js";

const toObjectId = (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }

  return new mongoose.Types.ObjectId(userId);
};

const buildBaseMatch = (userId, startDate, endDate) => {
  const objectId = toObjectId(userId);

  if (!objectId) {
    return null;
  }

  const match = { userId: objectId, isDeleted: false };

  if (startDate || endDate) {
    match.date = {};

    if (startDate) {
      match.date.$gte = new Date(startDate);
    }

    if (endDate) {
      match.date.$lte = new Date(endDate);
    }
  }

  return match;
};

const getTotalIncome = async (userId, startDate, endDate) => {
  const baseMatch = buildBaseMatch(userId, startDate, endDate);
  if (!baseMatch) return 0;

  const [result] = await FinancialRecord.aggregate([
    { $match: { ...baseMatch, type: "income" } },
    { $group: { _id: null, totalIncome: { $sum: "$amount" } } },
    { $project: { _id: 0, totalIncome: 1 } },
  ]);

  return result?.totalIncome || 0;
};

const getTotalExpenses = async (userId, startDate, endDate) => {
  const baseMatch = buildBaseMatch(userId, startDate, endDate);
  if (!baseMatch) return 0;

  const [result] = await FinancialRecord.aggregate([
    { $match: { ...baseMatch, type: "expense" } },
    { $group: { _id: null, totalExpenses: { $sum: "$amount" } } },
    { $project: { _id: 0, totalExpenses: 1 } },
  ]);

  return result?.totalExpenses || 0;
};

const getCategoryTotals = async (userId, startDate, endDate) => {
  const baseMatch = buildBaseMatch(userId, startDate, endDate);
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

const getRecentTransactions = async (userId, startDate, endDate) => {
  const baseMatch = buildBaseMatch(userId, startDate, endDate);
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

const getMonthlyTrends = async (userId, startDate, endDate) => {
  const baseMatch = buildBaseMatch(userId, startDate, endDate);
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

const getDashboardSummaryData = async (userId, startDate, endDate) => {
  const baseMatch = buildBaseMatch(userId, startDate, endDate);
  if (!baseMatch) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      categoryTotals: [],
      recentTransactions: [],
      monthlyTrends: [],
    };
  }

  const [summary] = await FinancialRecord.aggregate([
    { $match: baseMatch },
    {
      $facet: {
        totals: [
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
        ],
        categoryTotals: [
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
        ],
        recentTransactions: [
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
        ],
        monthlyTrends: [
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
        ],
      },
    },
    {
      $project: {
        totals: {
          $ifNull: [
            { $arrayElemAt: ["$totals", 0] },
            { totalIncome: 0, totalExpenses: 0, netBalance: 0 },
          ],
        },
        categoryTotals: 1,
        recentTransactions: 1,
        monthlyTrends: 1,
      },
    },
  ]);

  const totals = summary?.totals || {
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
  };

  return {
    totalIncome: totals.totalIncome ?? 0,
    totalExpenses: totals.totalExpenses ?? 0,
    netBalance: totals.netBalance ?? 0,
    categoryTotals: summary?.categoryTotals || [],
    recentTransactions: summary?.recentTransactions || [],
    monthlyTrends: summary?.monthlyTrends || [],
  };
};

export {
  getTotalIncome,
  getTotalExpenses,
  getCategoryTotals,
  getRecentTransactions,
  getMonthlyTrends,
  getDashboardSummaryData,
};
