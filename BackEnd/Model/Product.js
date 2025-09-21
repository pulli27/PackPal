// BackEnd/Model/Product.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    // Core identity
    sku:         { type: String, required: true, unique: true, index: true },
    name:        { type: String, required: true },
    category:    { type: String, default: "" },

    // Descriptions & media
    description: { type: String, default: "" },
    images:      [{ type: String }],
    img:         { type: String, default: "" }, // keep if some UIs expect a single image

    // Pricing & stock
    unitPrice:   { type: Number, default: 0, min: 0 }, // canonical price
    price:       { type: Number, default: 0, min: 0 }, // legacy alias (optional)
    stock:       { type: Number, default: 0, min: 0 },

    // Discounts (optional)
    discountType:  { type: String, enum: ["percentage", "flat", "none"], default: "none" },
    discountValue: { type: Number, default: 0, min: 0 },

    // Flags
    active:      { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

// ✅ Single canonical registration for 'Product'
module.exports =
  mongoose.models.Product ||
  mongoose.model("Product", ProductSchema, "products");
