/*const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  ProductId: {
    type: String, // <-- change from Number to String
    required: true
  },
  product_name: String,
  quantity: Number,
  price_per_unit: Number,
  customer_id: String,
  selected_variant: String,
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);
*/const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String },
    img: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    rating: { type: Number, default: 4.5 },
    discountType: { type: String, enum: ["none", "percentage", "fixed"], default: "none" },
    discountValue: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Product", ProductSchema);
