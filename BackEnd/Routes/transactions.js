// routes/transactions.js
const express = require("express");
const Transaction = require("../models/Transaction");
const router = express.Router();

/**
 * GET /transactions
 * Optional query:
 *   - start, end: YYYY-MM-DD
 *   - limit: number (default 50)
 *   - sort: e.g. "-date" (default "-date")
 *
 * Returns latest transactions for the table (client aggregates charts).
 */
router.get("/", async (req, res) => {
  try {
    const { start, end, limit = 50, sort = "-date" } = req.query;

    const match = {};
    if (start || end) {
      match.date = {};
      if (start) match.date.$gte = new Date(start);
      if (end)   match.date.$lte = new Date(end);
    }

    const rows = await Transaction.find(match)
      .sort(sort)
      .limit(Math.max(1, Math.min(500, Number(limit))))
      .lean();

    res.json(rows);
  } catch (e) {
    console.error("[transactions:list]", e);
    res.status(500).json({ message: "Failed to load transactions" });
  }
});

/**
 * GET /transactions/revenue
 * Optional query: start=YYYY-MM-DD, end=YYYY-MM-DD
 *
 * Sums revenue for non-refund transactions.
 * Uses `total` if provided; otherwise (qty*unitPrice - qty*discountPerUnit).
 * Also tolerates string numbers (e.g., "1,200") by stripping commas.
 */
router.get("/revenue", async (req, res) => {
  try {
    const { start, end } = req.query;

    // exclude refunds (treat missing status as non-refund)
    const match = {
      $or: [{ status: { $exists: false } }, { status: { $ne: "refund" } }],
    };
    if (start || end) {
      match.date = {};
      if (start) match.date.$gte = new Date(start);
      if (end)   match.date.$lte = new Date(end);
    }

    // helper: cast to number, strip commas, accept strings/numbers/null
    const toNumberExpr = (fieldPath) => ({
      $toDouble: {
        $replaceAll: {
          input: { $toString: { $ifNull: [fieldPath, 0] } },
          find: ",",
          replacement: "",
        },
      },
    });

    const agg = await Transaction.aggregate([
      { $match: match },

      // Normalize numeric fields
      {
        $addFields: {
          q: toNumberExpr("$qty"),
          p: toNumberExpr("$unitPrice"),
          d: toNumberExpr("$discountPerUnit"),
          t: {
            // use provided total if present
            $cond: [{ $ne: ["$total", null] }, toNumberExpr("$total"), null],
          },
        },
      },

      // Compute lineTotal
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

      // Sum up
      {
        $group: {
          _id: null,
          revenue: { $sum: "$lineTotal" },
          txCount: { $sum: 1 },
        },
      },
    ]);

    const revenue = Math.round(agg[0]?.revenue || 0);
    const count   = agg[0]?.txCount || 0;

    res.json({ revenue, count });
  } catch (e) {
    console.error("[transactions:revenue]", e);
    res.status(500).json({ message: "Failed to compute revenue" });
  }
});

module.exports = router;
