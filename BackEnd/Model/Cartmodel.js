// BackEnd/Model/CartModel.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, default: "" },
    img: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    discountType: { type: String, enum: ["none", "percentage", "fixed"], default: "none" },
    discountValue: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false }
);

// IMPORTANT: use existing model if already compiled
module.exports =
  mongoose.models.Product || mongoose.model("Product", ProductSchema, "products"); 
//                                          ^ model name        ^ collection name (adjust if needed)
