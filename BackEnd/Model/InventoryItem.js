// BackEnd/Model/InventoryItem.js
const mongoose = require("mongoose");

const InventoryItemSchema = new mongoose.Schema(
  {
    id:           { type: String, required: true, unique: true, index: true }, // business ID (not _id)
    name:         { type: String, required: true },
    description:  { type: String, default: "" },
    quantity:     { type: Number, default: 0, min: 0 },
    unitPrice:    { type: Number, default: 0, min: 0 },
    avgDailyUsage:{ type: Number, default: 0, min: 0 },
    leadTimeDays: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false }
);

// ✅ guard + explicit collection name "inventory"
module.exports =
  mongoose.models.InventoryItem ||
  mongoose.model("InventoryItem", InventoryItemSchema, "inventory");
