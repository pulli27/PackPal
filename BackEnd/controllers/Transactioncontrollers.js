// controllers/Transactioncontrollers.js (CommonJS)
const mongoose = require("mongoose");
const Transaction = require("../Model/TransactionModel");

// If your "product" data lives in ProductModel, use this:
const Product = require("../Model/ProductModel");
// If you actually store price/discount in CartModel, swap the line above to:
//const Product = require("../Model/CartModel");

/* -------------------------- month helpers -------------------------- */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

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

/* -------------------------- misc helpers --------------------------- */
const isObjectId = (v) => mongoose.Types.ObjectId.isValid(v);
const txFilter = (idOrTxId) =>
  isObjectId(idOrTxId) ? { _id: idOrTxId } : { id: idOrTxId };

// Build a createdAt date range match from YYYY-MM-DD strings
function rangeMatch(startISO, endISO) {
  // Interpret as UTC date-only window [start 00:00:00Z, end 23:59:59.999Z]
  const start = new Date(`${String(startISO).slice(0,10)}T00:00:00.000Z`);
  const end   = new Date(`${String(endISO).slice(0,10)}T23:59:59.999Z`);
  if (Number.isNaN(+start) || Number.isNaN(+end)) return {};
  return { createdAt: { $gte: start, $lte: end } };
}

/* ================================ CRUD ================================ */

// GET all transactions (optional ?start=YYYY-MM-DD&end=YYYY-MM-DD)
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
      date, // optional YYYY-MM-DD (for business date); createdAt is automatic
      id,   // optional client-provided alphanumeric id
    } = req.body || {};

    const q = Math.max(1, Number(qty) || 0);

    if (!isObjectId(productId)) {
      return res.status(400).json({ ok: false, error: "Invalid productId (must be a Mongo ObjectId)" });
    }

    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(400).json({ ok: false, error: "Invalid product (not found)" });
    }

    const unitPrice = Number(product.price ?? 0);

    // normalize discount
    const discountType = product.discountType || "none"; // "none" | "percentage" | "fixed"
    const discountValue = Number(product.discountValue ?? 0);

    let discountPerUnit = 0;
    if (discountType === "percentage") discountPerUnit = unitPrice * (discountValue / 100);
    else if (discountType === "fixed") discountPerUnit = discountValue;
    if (!Number.isFinite(discountPerUnit) || discountPerUnit < 0) discountPerUnit = 0;

    const effectiveUnit = Math.max(0, unitPrice - discountPerUnit);
    const total = effectiveUnit * q;

    const txDoc = new Transaction({
      id: id || `TX-${Date.now()}`,               // optional human-readable id
      date: (date || new Date().toISOString().slice(0, 10)), // business date (YYYY-MM-DD)
      customer,
      customerId,
      fmc: Boolean(fmc),
      productId,
      productName: product.name || "Unknown",
      qty: q,
      unitPrice,
      discountPerUnit,
      total,
      method,
      status,
      notes,
    });

    const saved = await txDoc.save();

    // Optionally bump a field on the product (edit to suit your schema)
    // Example: increment "reorderLevel" by sold qty
    await Product.findByIdAndUpdate(productId, { $inc: { reorderLevel: q } }).catch(() => {});

    return res.status(201).json(saved);
  } catch (err) {
    console.error("addTransaction:", err);
    return res.status(500).json({ ok: false, error: "Failed to add transaction", details: err.message });
  }
};

// Update transaction (by _id or custom id)
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ ok: false, error: "Missing id parameter" });

    const filter = txFilter(id);
    const updated = await Transaction.findOneAndUpdate(filter, req.body, { new: true });

    if (!updated) return res.status(404).json({ ok: false, error: "Transaction not found" });
    return res.json(updated);
  } catch (err) {
    console.error("updateTransaction:", err);
    return res.status(500).json({ ok: false, error: "Failed to update transaction", details: err.message });
  }
};

// Delete transaction (by _id or custom id)
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ ok: false, error: "Missing id parameter" });

    const filter = txFilter(id);
    const deleted = await Transaction.findOneAndDelete(filter);

    if (!deleted) return res.status(404).json({ ok: false, error: "Transaction not found" });
    return res.json({ ok: true, message: "Transaction deleted", deleted: { _id: deleted._id, id: deleted.id } });
  } catch (err) {
    console.error("deleteTransaction:", err);
    return res.status(500).json({ ok: false, error: "Failed to delete transaction", details: err.message });
  }
};

/* ============================== SUMMARIES ============================== */

// Summary (total revenue & count), optional ?start&end by createdAt
exports.getSummary = async (req, res) => {
  try {
    const { start, end } = req.query || {};
    const match = { status: { $ne: "Refund" }, ...(start && end ? rangeMatch(start, end) : {}) };

    const [agg] = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: null, revenue: { $sum: "$total" }, count: { $sum: 1 } } },
    ]);

    return res.json({ revenue: agg?.revenue || 0, count: agg?.count || 0 });
  } catch (err) {
    console.error("getSummary:", err);
    return res.status(500).json({ ok: false, error: "Failed to compute revenue", details: err.message });
  }
};

// V2: richer summary (today, thisMonth, lastMonth) + (optional) date range
exports.getSummaryV2 = async (req, res) => {
  try {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();

    const todayStart = new Date(Date.UTC(y, m, now.getUTCDate(), 0, 0, 0, 0));
    const todayEnd   = new Date(Date.UTC(y, m, now.getUTCDate(), 23, 59, 59, 999));

    const monthStart = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
    const monthEnd   = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));

    const lastMonthStart = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
    const lastMonthEnd   = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

    const baseMatch = { status: { $ne: "Refund" } };

    const [todayAgg] = await Transaction.aggregate([
      { $match: { ...baseMatch, createdAt: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, revenue: { $sum: "$total" }, count: { $sum: 1 } } },
    ]);

    const [monthAgg] = await Transaction.aggregate([
      { $match: { ...baseMatch, createdAt: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, revenue: { $sum: "$total" }, count: { $sum: 1 } } },
    ]);

    const [lastMonthAgg] = await Transaction.aggregate([
      { $match: { ...baseMatch, createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
      { $group: { _id: null, revenue: { $sum: "$total" }, count: { $sum: 1 } } },
    ]);

    // Optional ad-hoc range via query
    const { start, end } = req.query || {};
    let range = null;
    if (start && end) {
      const [rangeAgg] = await Transaction.aggregate([
        { $match: { ...baseMatch, ...rangeMatch(start, end) } },
        { $group: { _id: null, revenue: { $sum: "$total" }, count: { $sum: 1 } } },
      ]);
      range = { start, end, revenue: rangeAgg?.revenue || 0, count: rangeAgg?.count || 0 };
    }

    return res.json({
      today:      { revenue: todayAgg?.revenue || 0, count: todayAgg?.count || 0 },
      thisMonth:  { revenue: monthAgg?.revenue || 0, count: monthAgg?.count || 0 },
      lastMonth:  { revenue: lastMonthAgg?.revenue || 0, count: lastMonthAgg?.count || 0 },
      ...(range ? { range } : {}),
    });
  } catch (err) {
    console.error("getSummaryV2:", err);
    return res.status(500).json({ ok: false, error: "Failed to compute summary v2", details: err.message });
  }
};

// Monthly revenue buckets (uses createdAt). Supports ?start&end or ?months=N (default 12)
exports.getRevenueMonthly = async (req, res) => {
  try {
    const { start, end, months } = req.query || {};
    const baseMatch = { status: { $ne: "Refund" } };
    const match = { ...baseMatch, ...(start && end ? rangeMatch(start, end) : {}) };

    const buckets = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            y: { $year: "$createdAt" },
            m: { $month: "$createdAt" },
          },
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1 } },
    ]);

    // If no explicit range, return the last N months normalized (fill missing months with 0)
    const n = Number(months) > 0 ? Number(months) : 12;
    const series = (start && end) ? buckets.map(b => ({
      y: b._id.y,
      m: b._id.m,
      month: MONTHS[b._id.m - 1],
      revenue: b.total,
      count: b.count,
    })) : mergeMonthSeries(buckets, n, "revenue");

    return res.json({ series });
  } catch (err) {
    console.error("getRevenueMonthly:", err);
    return res.status(500).json({ ok: false, error: "Failed to compute monthly revenue", details: err.message });
  }
};
