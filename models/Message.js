import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  phone: String,
  template: String,
  status: { type: String, default: "sent" },
  direction: { type: String, enum: ["out", "in"], default: "out" },
  messageId: String,
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign" },
  body: String,
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("Message", messageSchema);
