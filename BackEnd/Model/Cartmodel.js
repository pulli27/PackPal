
const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  ProductId: {
    type: String, // <-- change from Number to String
    required: true
  },
  product_name: String,
  quantity: Number,
  product_price: Number,
  product_discounts: Number,
  selected_variant: String,
  /*created_at: {
    type: Date,
    default: Date.now
  }*/
});

module.exports = mongoose.model("Cart", cartSchema);
