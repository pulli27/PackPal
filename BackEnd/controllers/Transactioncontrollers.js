// controllers/Transactioncontrollers.js
const mongoose = require("mongoose");
const Transaction = require("../Model/TransactionModel");
const Product = require("../Model/CartModel");

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(v);

exports.getTransactions = async (req, res) => {
  try {
    const txs = await Transaction.find().sort({ date: -1 });
    return res.json(txs);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

exports.addTransaction = async (req, res) => {
  try {
    const {
      productId, qty,
      customer = "", customerId = "",
      fmc = false, method = "Card", status = "Paid",
      notes = "", date, id,
    } = req.body || {};

    if (!isObjectId(productId)) {
      return res.status(400).json({ ok: false, error: "Invalid productId" });
    }
    const product = await Product.findById(productId);
    if (!product) return res.status(400).json({ ok: false, error: "Product not found" });

    const q = Math.max(1, Number(qty) || 0);
    const unitPrice = Number(product.price || 0);
    const discountType = product.discountType || "none";
    const discountValue = Number(product.discountValue || 0);

    let discountPerUnit = 0;
    if (discountType === "percentage") discountPerUnit = unitPrice * (discountValue / 100);
    else if (discountType === "fixed") discountPerUnit = discountValue;
    if (!Number.isFinite(discountPerUnit) || discountPerUnit < 0) discountPerUnit = 0;

    const effectiveUnit = Math.max(0, unitPrice - discountPerUnit);
    const total = effectiveUnit * q;

    const doc = await Transaction.create({
      id: id || `TX-${Date.now()}`,
      date: date || new Date().toISOString().slice(0, 10),
      customer, customerId, fmc,
      productId,
      productName: product.name || "",
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
    return res.status(500).json({ ok: false, error: err.message });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params; // can be _id or custom id if your schema stores "id"
    // find existing by either field
    const filter = isObjectId(id) ? { _id: id } : { id };

    const before = await Transaction.findOne(filter);
    if (!before) return res.status(404).json({ ok: false, error: "Transaction not found" });

    const payload = { ...req.body };
    if (payload.qty !== undefined) payload.qty = Math.max(0, Number(payload.qty) || 0);

    const updated = await Transaction.findOneAndUpdate(filter, payload, { new: true });

    // only increase reorderLevel if qty increased
    const oldQty = Number(before.qty || 0);
    const newQty = Number(updated.qty || 0);
    const delta = Math.max(0, newQty - oldQty);

    if (delta > 0 && isObjectId(updated.productId)) {
      await Product.findByIdAndUpdate(updated.productId, { $inc: { reorderLevel: delta } });
    }

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = isObjectId(id) ? { _id: id } : { id };
    const del = await Transaction.findOneAndDelete(filter);
    if (!del) return res.status(404).json({ ok: false, error: "Transaction not found" });

    // DO NOT decrease reorderLevel — we keep it non-decreasing by design
    return res.json({ ok: true, message: "Transaction deleted" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const [agg] = await Transaction.aggregate([
      { $match: { status: { $ne: "Refund" } } },
      { $group: { _id: null, revenue: { $sum: "$total" }, count: { $sum: 1 } } },
    ]);
    return res.json({ revenue: agg?.revenue || 0, count: agg?.count || 0 });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};
