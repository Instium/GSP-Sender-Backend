import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  template: { type: String, default: "prueba_oct" },
  totalNumbers: Number,
  successful: Number,
  failed: Number,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Campaign", campaignSchema);
