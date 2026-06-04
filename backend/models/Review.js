import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  extensionId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

reviewSchema.index({ extensionId: 1, userId: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
