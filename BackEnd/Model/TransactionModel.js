const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    customer: { type: String, required: true },
    customerId: String,
    fmc: { type: Boolean, default: false },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: String,

    qty: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, default: 0, min: 0 },
    discountPerUnit: { type: Number, default: 0, min: 0 },

    // ✅ keep numeric; if old docs miss it, default to 0
    total: { type: Number, default: 0, min: 0 },

    method: { type: String, default: "Cash" },
    status: {
      type: String,
      enum: ["Paid", "Pending", "Refund"],
      default: "Paid",
    },
    notes: String,

    // ✅ correct default for dates is Date.now (function), not Date (constructor)
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

/**
 * ✅ Safety net: compute/normalize totals before save
 * - Ensures numeric fields
 * - Recomputes total when it's missing/invalid
 */
transactionSchema.pre("save", function (next) {
  // coerce numerics
  this.qty = Number(this.qty || 0);
  this.unitPrice = Number(this.unitPrice || 0);
  this.discountPerUnit = Number(this.discountPerUnit || 0);
  this.total = Number(this.total || 0);

  if (this.qty < 1) this.qty = 1;
  if (this.unitPrice < 0) this.unitPrice = 0;
  if (this.discountPerUnit < 0) this.discountPerUnit = 0;

  // If total not set or looks wrong, recompute:
  const shouldCompute =
    !Number.isFinite(this.total) ||
    this.total <= 0 ||
    !("total" in this.toObject());

  if (shouldCompute) {
    const effective = Math.max(0, this.unitPrice - this.discountPerUnit);
    this.total = effective * this.qty;
  }

  next();
});

module.exports = mongoose.model("Transaction", transactionSchema);
