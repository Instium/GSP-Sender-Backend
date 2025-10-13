import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  phone: { type: String, unique: true },
  name: String,
  lastMessage: String,
  tags: [String],
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Contact", contactSchema);
