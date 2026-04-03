import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  getDashboardSummaryData,
} from "../services/dashboard.service.js";

const getDateRangeFromQuery = (query) => {
  const { startDate, endDate } = query;

  if (startDate) {
    const parsedStartDate = new Date(startDate);
    if (Number.isNaN(parsedStartDate.getTime())) {
      throw new ApiError(400, "Invalid startDate");
    }
  }

  if (endDate) {
    const parsedEndDate = new Date(endDate);
    if (Number.isNaN(parsedEndDate.getTime())) {
      throw new ApiError(400, "Invalid endDate");
    }
  }

  return { startDate, endDate };
};

const getDashboardSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { startDate, endDate } = getDateRangeFromQuery(req.query);
  const {
    totalIncome,
    totalExpenses,
    netBalance,
    categoryTotals,
    recentTransactions,
    monthlyTrends,
  } = await getDashboardSummaryData(userId, startDate, endDate);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalIncome,
        totalExpenses,
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
  getDashboardSummary,
};
