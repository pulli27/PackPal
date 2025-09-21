const mongoose = require("mongoose");
const { Schema } = mongoose;

const inventorySchema = new Schema(
  {
    id: String,
    name: String,
    description: String,
    quantity: { type: Number, default: 0 },   // must be Number
    unitPrice: { type: Number, default: 0 },  // must be Number
    avgDailyUsage: { type: Number, default: 0 },
    leadTimeDays: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Inventory", inventorySchema, "inventory");
