// controllers/Transactioncontrollers.js (CommonJS)
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

// Build a filter that works with either Mongo _id or a custom string id
const txFilter = (idOrTxId) =>
  isObjectId(idOrTxId) ? { _id: idOrTxId } : { id: idOrTxId }; // ensure your schema has `id: String` if you use this

// ===== Get all transactions
exports.getTransactions = async (req, res) => {
  try {
    const { start, end } = req.query || {};
    const match = { ...(start && end ? rangeMatch(start, end) : {}) };
    const txs = await Transaction.find(match).sort({ createdAt: -1 }).lean().exec();
    return res.json(txs);
  } catch (err) {
    console.error("getTransactions:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to fetch transactions",
      details: err.message,
    });
  }
};

// ===== Add transaction
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
      date, // optional; e.g., "YYYY-MM-DD"
      id, // optional custom id from client, else we create one
    } = req.body || {};

    // qty must be >= 1
    const q = Math.max(1, Number(qty) || 0);

    // productId must be a valid ObjectId for findById
    if (!isObjectId(productId)) {
      return res
        .status(400)
        .json({ ok: false, error: "Invalid productId (must be a Mongo ObjectId)" });
    }
    const product = await Product.findById(productId);
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
      id: id || `TX-${Date.now()}`, // keep a human-readable id too (optional)
      date: date || new Date().toISOString().slice(0, 10), // YYYY-MM-DD
      customer,
      customerId,
      fmc: Boolean(fmc),
      productId, // Mongo ObjectId
      productName: product.name || "Unknown",
      qty: q,
      unitPrice,
      discountPerUnit,
      total,
      method,
      status,
      notes,
    });

    // 👇 bump reorder level by sold qty (only up)
    await Product.findByIdAndUpdate(productId, { $inc: { reorderLevel: q } });

    return res.json(doc);
  } catch (err) {
    console.error("addTransaction:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to add transaction",
      details: err.message,
    });
  }
};

// ===== Update transaction (by _id or custom id)
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params; // can be _id or your string id
    if (!id)
      return res.status(400).json({ ok: false, error: "Missing id parameter" });

    const filter = txFilter(id);
    const updated = await Transaction.findOneAndUpdate(filter, req.body, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ ok: false, error: "Transaction not found" });
    }
    return res.json(updated);
  } catch (err) {
    console.error("updateTransaction:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to update transaction",
      details: err.message,
    });
  }
};

// ===== Delete transaction (by _id or custom id)
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params; // can be _id or your string id
    if (!id)
      return res.status(400).json({ ok: false, error: "Missing id parameter" });

    const filter = txFilter(id);
    const deleted = await Transaction.findOneAndDelete(filter);

    if (!deleted) {
      return res.status(404).json({ ok: false, error: "Transaction not found" });
    }
    return res.json({
      ok: true,
      message: "Transaction deleted",
      deleted: { _id: deleted._id, id: deleted.id },
    });
  } catch (err) {
    console.error("deleteTransaction:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to delete transaction",
      details: err.message,
    });
  }
};

// ===== Summary: total revenue + count
exports.getSummary = async (req, res) => {
  try {
    const { start, end } = req.query || {};
    const match = { status: { $ne: "Refund" } };
    if (start && end) Object.assign(match, rangeMatch(start, end));

    const [agg] = await Transaction.aggregate([
      { $match: { status: { $ne: "Refund" } } },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ]);

    return res.json({
      revenue: agg?.revenue || 0,
      count: agg?.count || 0,
    });
  } catch (err) {
    console.error("getSummary:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to compute revenue",
      details: err.message,
    });
  }
};
