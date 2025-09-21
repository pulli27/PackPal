// BackEnd/Model/Transaction.js
const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    // Customer info
    customer:   { type: String, required: true },
    customerId: { type: String },

    // Flags
    fmc:        { type: Boolean, default: false },

    // Product link (reference the canonical Product model)
    productId:  { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName:{ type: String },

    // Line values
    qty:             { type: Number, default: 1, min: 0 },
    unitPrice:       { type: Number, default: 0, min: 0 },
    discountPerUnit: { type: Number, default: 0, min: 0 },

    // Totals (optional; your services can compute this if omitted)
    total:      { type: Number },

    // Payment & status
    method:     { type: String, default: "Cash" },
    status:     { type: String, enum: ["Paid", "Pending", "Refund"], default: "Paid" },

    // Misc
    notes:      { type: String },
    date:       { type: Date, default: Date.now }
  },
  { timestamps: true, versionKey: false }
);

// ✅ Single, guarded registration
module.exports =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema, "transactions");
