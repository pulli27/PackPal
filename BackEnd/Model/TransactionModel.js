const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  customer: { type: String, required: true },
  customerId: String,
  fmc: { type: Boolean, default: false },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: String,
  qty: { type: Number, default: 1 },
  unitPrice: Number,
  discountPerUnit: Number,
  total: Number,
  method: { type: String, default: 'Cash' },
  status: { type: String, enum: ['Paid','Pending','Refund'], default: 'Paid' },
  notes: String,
  date: { type: Date, default: Date}
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
// BackEnd/Model/TransactionModel.js
// Re-export the canonical Transaction model to avoid double registration.
module.exports = require("./Transaction");
