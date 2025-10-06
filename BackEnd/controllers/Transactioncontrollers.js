// BackEnd/controllers/Transactioncontrollers.js
/* eslint-disable camelcase */
const mongoose = require("mongoose");
const Transaction = require("../Model/TransactionModel");
const Product = require("../Model/CartModel");

/* -------------------------- small local month utils -------------------------- */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const currentYM = () => {
  const d = new Date();
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 };
};
function buildLastNMonths(n = 12) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push({ y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, label: MONTHS[d.getUTCMonth()] });
  }
  return out;
}
function mergeMonthSeries(buckets, n = 12, valueKey = "revenue") {
  const byKey = new Map();
  for (const b of buckets) byKey.set(`${b._id.y}-${b._id.m}`, b);
  return buildLastNMonths(n).map(({ y, m, label }) => {
    const hit = byKey.get(`${y}-${m}`);
    return {
      month: label, y, m,
      [valueKey]: Number(hit?.total || 0),
      count: Number(hit?.count || 0),
    };
  });
}
/* --------------------------------------------------------------------------- */

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(v);
const txFilter = (idOrTxId) => (isObjectId(idOrTxId) ? { _id: idOrTxId } : { id: idOrTxId });

/* --------------------------- helpers: date filtering -------------------------- */
/** Build a $match that prefers createdAt and falls back to date(string) */
function rangeMatch(startISO, endISO) {
  if (!startISO || !endISO) return {}; // no range filter
  return {
    $expr: {
      $and: [
        {
          $gte: [
            {
              $ifNull: [
                "$createdAt",
                { $dateFromString: { dateString: "$date", format: "%Y-%m-%d", onError: new Date(0), onNull: new Date(0) } },
              ],
            },
            new Date(startISO),
          ],
        },
        {
          $lte: [
            {
              $ifNull: [
                "$createdAt",
                { $dateFromString: { dateString: "$date", format: "%Y-%m-%d", onError: new Date(0), onNull: new Date(0) } },
              ],
            },
            // include the whole end day
            new Date(new Date(endISO).getTime() + 24 * 60 * 60 * 1000 - 1),
          ],
        },
      ],
    },
  };
}

/* ================================= CRUD ==================================== */

// Get all transactions (optionally by createdAt/date range)
exports.getTransactions = async (req, res) => {
  try {
    const { start, end } = req.query || {};
    const match = { ...(start && end ? rangeMatch(start, end) : {}) };
    const txs = await Transaction.find(match).sort({ createdAt: -1 }).lean().exec();
    return res.json(txs);
  } catch (err) {
    console.error("getTransactions:", err);
    return res.status(500).json({ ok: false, error: "Failed to fetch transactions", details: err.message });
  }
};

// Add transaction
exports.addTransaction = async (req, res) => {
  try {
    const {
      productId,
      qty,
      customer = "",
      customerId = "",
      fmc = true,
      method = "Cash",
      status = "Paid",
      notes = "",
      date, // "YYYY-MM-DD" optional
      id,   // optional custom id
    } = req.body || {};

    const q = Math.max(1, Number(qty) || 0);
    if (!isObjectId(productId)) {
      return res.status(400).json({ ok: false, error: "Invalid productId (must be a Mongo ObjectId)" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(400).json({ ok: false, error: "Invalid product (not found)" });

    const unitPrice = Number(product.price ?? 0);
    const discountType = product.discountType || "none"; // "none" | "percentage" | "fixed"
    const discountValue = Number(product.discountValue ?? 0);

    let discountPerUnit = 0;
    if (discountType === "percentage") discountPerUnit = unitPrice * (discountValue / 100);
    else if (discountType === "fixed") discountPerUnit = discountValue;
    if (!Number.isFinite(discountPerUnit) || discountPerUnit < 0) discountPerUnit = 0;

    const effectiveUnit = Math.max(0, unitPrice - discountPerUnit);
    const total = effectiveUnit * q;

    const txDoc = new Transaction({
      id: id || `TX-${Date.now()}`,
      // store as Date; string is okay (Mongoose casts), but we normalize here
      date: date ? new Date(`${date}T00:00:00.000Z`) : undefined,
      customer, customerId, fmc: Boolean(fmc),
      productId, productName: product.name || "Unknown",
      qty: q, unitPrice, discountPerUnit, total,
      method, status, notes,
    });

    await txDoc.save();
    return res.json(txDoc);
  } catch (err) {
    console.error("addTransaction:", err);
    return res.status(500).json({ ok: false, error: "Failed to add transaction", details: err.message });
  }
};

// Update
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ ok: false, error: "Missing id parameter" });

    // normalize possible date strings to Date
    const body = { ...req.body };
    if (typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      body.date = new Date(`${body.date}T00:00:00.000Z`);
    }

    const updated = await Transaction.findOneAndUpdate(txFilter(id), body, { new: true });
    if (!updated) return res.status(404).json({ ok: false, error: "Transaction not found" });
    return res.json(updated);
  } catch (err) {
    console.error("updateTransaction:", err);
    return res.status(500).json({ ok: false, error: "Failed to update transaction", details: err.message });
  }
};

// Delete
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ ok: false, error: "Missing id parameter" });

    const deleted = await Transaction.findOneAndDelete(txFilter(id));
    if (!deleted) return res.status(404).json({ ok: false, error: "Transaction not found" });

    return res.json({ ok: true, message: "Transaction deleted", deleted: { _id: deleted._id, id: deleted.id } });
  } catch (err) {
    console.error("deleteTransaction:", err);
    return res.status(500).json({ ok: false, error: "Failed to delete transaction", details: err.message });
  }
};

/* =============================== SUMMARIES ================================== */

// All-time or range revenue + count (Refunds excluded)
exports.getSummary = async (req, res) => {
  try {
    const { start, end } = req.query || {};
    const match = { status: { $ne: "Refund" } };
    if (start && end) Object.assign(match, rangeMatch(start, end));

    const [agg] = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: null, revenue: { $sum: "$total" }, count: { $sum: 1 } } },
    ]);

    return res.json({ revenue: Number(agg?.revenue || 0), count: Number(agg?.count || 0) });
  } catch (err) {
    console.error("getSummary:", err);
    return res.status(500).json({ ok: false, error: "Failed to compute revenue", details: err.message });
  }
};

// Month-aware (createdAt-first) summary + monthly series (last 12) + current month slice
exports.getSummaryV2 = async (req, res) => {
  try {
    const months = Math.max(1, Math.min(24, Number(req.query.months || 12)));
    const baseMatch = { status: { $ne: "Refund" } };

    // 1) All-time (still useful for some cards)
    const [all] = await Transaction.aggregate([
      { $match: baseMatch },
      { $group: { _id: null, revenue: { $sum: "$total" }, count: { $sum: 1 } } },
    ]);

    // 2) Monthly buckets by createdAt/date
    const monthBuckets = await Transaction.aggregate([
      { $match: baseMatch },
      {
        $addFields: {
          ts: {
            $ifNull: [
              "$createdAt",
              { $dateFromString: { dateString: "$date", format: "%Y-%m-%d", onError: new Date(0), onNull: new Date(0) } },
            ],
          },
        },
      },
      {
        $group: {
          _id: { y: { $year: "$ts" }, m: { $month: "$ts" } },
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1 } },
    ]);

    const monthly = mergeMonthSeries(monthBuckets, months, "revenue");
    const { y, m } = currentYM();
    const cm = monthly.find((r) => r.y === y && r.m === m) || { revenue: 0, count: 0 };

    return res.json({
      revenue: Number(all?.revenue || 0),
      count: Number(all?.count || 0),
      monthly, // [{month:'Sep', y:2025, m:9, revenue:..., count:...}, ...]
      currentMonth: { revenue: Number(cm.revenue || 0), count: Number(cm.count || 0), y, m },
    });
  } catch (err) {
    console.error("getSummaryV2:", err);
    return res.status(500).json({ ok: false, error: "Failed to compute monthly revenue summary", details: err.message });
  }
};

// NEW: /transactions/revenue/monthly?start=YYYY-MM-DD&end=YYYY-MM-DD
// Buckets ONLY within the given range (createdAt-first). If no range, uses last 12 months.
exports.getRevenueMonthly = async (req, res) => {
  try {
    const { start, end, months: monthsStr } = req.query || {};
    if (start && end) {
      const buckets = await Transaction.aggregate([
        { $match: { status: { $ne: "Refund" }, ...rangeMatch(start, end) } },
        {
          $addFields: {
            ts: {
              $ifNull: [
                "$createdAt",
                { $dateFromString: { dateString: "$date", format: "%Y-%m-%d", onError: new Date(0), onNull: new Date(0) } },
              ],
            },
          },
        },
        {
          $group: {
            _id: { y: { $year: "$ts" }, m: { $month: "$ts" } },
            revenue: { $sum: "$total" },
          },
        },
        { $sort: { "_id.y": 1, "_id.m": 1 } },
        {
          $project: {
            key: {
              $concat: [
                { $toString: "$_id.y" },
                "-",
                { $toString: { $cond: [{ $lt: ["$_id.m", 10] }, { $concat: ["0", { $toString: "$_id.m" }] }, { $toString: "$_id.m" }] } },
              ],
            },
            revenue: 1,
            _id: 0,
          },
        },
      ]);
      return res.json(buckets);
    }

    const months = Math.max(1, Math.min(24, Number(monthsStr || 12)));
    const series = await Transaction.aggregate([
      { $match: { status: { $ne: "Refund" } } },
      {
        $addFields: {
          ts: {
            $ifNull: [
              "$createdAt",
              { $dateFromString: { dateString: "$date", format: "%Y-%m-%d", onError: new Date(0), onNull: new Date(0) } },
            ],
          },
        },
      },
      {
        $group: {
          _id: { y: { $year: "$ts" }, m: { $month: "$ts" } },
          total: { $sum: "$total" },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1 } },
    ]);
    const merged = mergeMonthSeries(series, months, "revenue").map((r) => ({
      key: `${r.y}-${String(r.m).padStart(2, "0")}`,
      revenue: r.revenue,
    }));
    return res.json(merged);
  } catch (err) {
    console.error("getRevenueMonthly:", err);
    return res.status(500).json({ ok: false, error: "Failed to compute monthly revenue", details: err.message });
  }
};
