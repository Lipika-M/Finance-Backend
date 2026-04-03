import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  getTotalIncome as getDashboardTotalIncome,
  getTotalExpenses as getDashboardTotalExpenses,
  getCategoryTotals as getDashboardCategoryTotals,
  getRecentTransactions as getDashboardRecentTransactions,
  getMonthlyTrends as getDashboardMonthlyTrends,
} from "../services/dashboard.service.js";

const getTotalIncome = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const totalIncome = await getDashboardTotalIncome(userId);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { totalIncome },
        "Total income retrieved successfully"
      )
    );
});

const getTotalExpenses = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const totalExpenses = await getDashboardTotalExpenses(userId);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { totalExpenses },
        "Total expenses retrieved successfully"
      )
    );
});

const getNetBalance = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const [totalIncome, totalExpenses] = await Promise.all([
    getDashboardTotalIncome(userId),
    getDashboardTotalExpenses(userId),
  ]);
  const safeTotalIncome = totalIncome ?? 0;
  const safeTotalExpenses = totalExpenses ?? 0;
  const netBalance = safeTotalIncome - safeTotalExpenses;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalIncome: safeTotalIncome,
        totalExpenses: safeTotalExpenses,
        netBalance,
      },
      "Net balance retrieved successfully"
    )
  );
});

const getCategoryWiseTotals = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const categoryTotals = await getDashboardCategoryTotals(userId);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { categoryTotals }, "Category-wise totals retrieved successfully")
    );
});

const getRecentTransactions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const recentTransactions = await getDashboardRecentTransactions(userId);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { recentTransactions }, "Recent transactions retrieved successfully")
    );
});

const getMonthlyTrends = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const monthlyTrends = await getDashboardMonthlyTrends(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, { monthlyTrends }, "Monthly trends retrieved successfully"));
});

const getDashboardSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const [totalIncome, totalExpenses, categoryTotals, recentTransactions, monthlyTrends] =
    await Promise.all([
      getDashboardTotalIncome(userId),
      getDashboardTotalExpenses(userId),
      getDashboardCategoryTotals(userId),
      getDashboardRecentTransactions(userId),
      getDashboardMonthlyTrends(userId),
    ]);

  const safeTotalIncome = totalIncome ?? 0;
  const safeTotalExpenses = totalExpenses ?? 0;
  const netBalance = safeTotalIncome - safeTotalExpenses;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalIncome: safeTotalIncome,
        totalExpenses: safeTotalExpenses,
        netBalance,
        categoryTotals,
        recentTransactions,
        monthlyTrends,
      },
      "Dashboard summary retrieved successfully"
    )
  );
});

export {
  getTotalIncome,
  getTotalExpenses,
  getNetBalance,
  getCategoryWiseTotals,
  getRecentTransactions,
  getMonthlyTrends,
  getDashboardSummary,
};
