const mongoose = require("mongoose");
const { Schema } = mongoose;

const txSchema = new Schema({
  id: { type: String }, // optional human-readable id
  date: { type: String, required: true }, // "YYYY-MM-DD"
  customer: { type: String, default: "" },
  customerId: { type: String, default: "" },
  fmc: { type: Boolean, default: false },

  productId: { type: String, required: true },
  productName: { type: String, required: true },

  qty: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  discountPerUnit: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },

  method: { type: String, default: "Card" },
  status: { type: String, default: "Paid" }, // match your UI capitalization
  notes: { type: String, default: "" },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.models.Transaction
  || mongoose.model("Transaction", txSchema, "transactions");
