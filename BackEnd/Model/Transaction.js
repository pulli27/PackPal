const mongoose = require("mongoose");
const { Schema } = mongoose;

const transactionSchema = new Schema({
  customer: String,
  productId: Schema.Types.ObjectId,
  productName: String,
  qty: { type: Number, default: 0 },
  unitPrice: { type: Number, default: 0 },
  discountPerUnit: { type: Number, default: 0 },
  total: { type: Number, default: 0 },     // optional; we’ll fall back to qty*unitPrice-discount
  method: String,
  status: { type: String, default: "paid" }, // e.g. "paid", "refund"
  date: { type: Date, default: Date.now },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("Transaction", transactionSchema, "transactions");
