
const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  ProductId: {
    type: String, // <-- change from Number to String
    required: true
  },
  product_name: String,
  quantity: Number,
  price_per_unit: Number,
  customer_id: String,
  selected_variant: String,
  /*created_at: {
    type: Date,
    default: Date.now
  }*/
});

module.exports = mongoose.model("Cart", cartSchema);
