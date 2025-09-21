const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    name: String,
    category: String,
    img: String,

    price: { type: Number, default: 0 },  // base price
    stock: { type: Number, default: 0 },  // on hand

    discountType: { type: String, enum: ["percentage", "flat", "none"], default: "none" },
    discountValue: { type: Number, default: 0 }, // percent or flat LKR
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Product", productSchema, "products");
