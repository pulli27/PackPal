// BackEnd/Model/Product.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    // adjust fields to your app
    sku:         { type: String, required: true, unique: true, index: true },
    name:        { type: String, required: true },
    description: { type: String, default: "" },
    unitPrice:   { type: Number, default: 0, min: 0 },
    stock:       { type: Number, default: 0, min: 0 },
    category:    { type: String, default: "" },
    images:      [{ type: String }],
    active:      { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

// ✅ Guard against double-registration
module.exports =
  mongoose.models.Product ||
  mongoose.model("Product", ProductSchema, "products");
  // BackEnd/Model/ProductModel.js
// Do NOT register another mongoose model here.
// Just re-export the canonical Product so old imports keep working.
module.exports = require("./Product");

