const mongoose = require("mongoose");
const { Schema } = mongoose;

const sewingInstructionSchema = new Schema(
  {
    bag:      { type: String, required: true, trim: true },
    details:  { type: String, default: "", trim: true },
    person:   { type: String, required: true, trim: true },
    // store as Date; your <input type="date"> sends "YYYY-MM-DD", Mongoose parses it fine
    deadline: { type: Date,   required: true },
    priority: { type: String, enum: ["High", "Medium", "Low"], default: "High" },
    status:   { type: String, enum: ["Pending", "In Progress", "Quality Check", "Done"], default: "In Progress" },
  },
  { timestamps: true, versionKey: false }
);

// 3rd arg sets the collection name explicitly (optional but nice)
module.exports = mongoose.model("SewingInstruction", sewingInstructionSchema, "sewing_instructions");
