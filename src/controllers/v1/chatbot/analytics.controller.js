import * as analyticsService from "../../../services/analytics.service.js";

// GET /api/analytics
export async function getAnalytics(req, res, next) {
  try {
    const { startDate, endDate } = req.query;

    // Default to last 30 days if not provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const analytics = await analyticsService.getAnalytics(start, end);

    res.status(200).json({
      status: "success",
      data: {
        analytics,
        count: analytics.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/analytics/generate
export async function generateAnalytics(req, res, next) {
  try {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();

    const analytics = await analyticsService.saveDailyAnalytics(targetDate);

    res.status(200).json({
      status: "success",
      message: "Analytics generated successfully",
      data: {
        analytics,
      },
    });
  } catch (error) {
    next(error);
  }
}
