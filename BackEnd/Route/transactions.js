// BackEnd/Routes/transactions.js
const express = require("express");
const Transaction = require("../Model/Transaction");
const router = express.Router();

/**
 * GET /transactions/revenue
 * Optional query: start=YYYY-MM-DD, end=YYYY-MM-DD
 *
 * - Excludes refunds (case-insensitive)
 * - Uses total when present; otherwise qty*(unitPrice|price) - qty*(discountPerUnit|discount)
 * - Accepts string numbers with commas (e.g., "1,250")
 */
router.get("/revenue", async (req, res) => {
  try {
    const { start, end } = req.query;

    // exclude refunds (case-insensitive). If status absent, include.
    const match = { $or: [{ status: { $exists: false } }, { status: { $not: /^refund$/i } }] };
    if (start || end) {
      match.date = {};
      if (start) match.date.$gte = new Date(start);
      if (end)   match.date.$lte = new Date(end);
    }

    // Helper to coerce any value (number/string) to a number, stripping commas
    const toNumberExpr = (expr) => ({
      $toDouble: {
        $replaceAll: {
          input: { $toString: { $ifNull: [expr, 0] } },
          find: ",",
          replacement: "",
        },
      },
    });

    const agg = await Transaction.aggregate([
      { $match: match },
      {
        $addFields: {
          q: toNumberExpr("$qty"),
          p: {
            $cond: [
              { $ne: ["$unitPrice", null] },
              toNumberExpr("$unitPrice"),
              toNumberExpr("$price"), // legacy fallback
            ],
          },
          d: {
            $cond: [
              { $ne: ["$discountPerUnit", null] },
              toNumberExpr("$discountPerUnit"),
              toNumberExpr("$discount"), // legacy fallback
            ],
          },
          t: {
            $cond: [{ $ne: ["$total", null] }, toNumberExpr("$total"), null],
          },
        },
      },
      {
        $addFields: {
          lineTotal: {
            $ifNull: [
              "$t",
              { $subtract: [{ $multiply: ["$q", "$p"] }, { $multiply: ["$q", "$d"] }] },
            ],
          },
        },
      },
      { $group: { _id: null, revenue: { $sum: "$lineTotal" }, txCount: { $sum: 1 } } },
    ]);

    res.json({
      revenue: Math.round(agg[0]?.revenue || 0),
      count: agg[0]?.txCount || 0,
    });
  } catch (e) {
    console.error("[transactions:revenue]", e);
    res.status(500).json({ message: "Failed to compute revenue" });
  }
});

module.exports = router;
