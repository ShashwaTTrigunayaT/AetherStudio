import mongoose from "mongoose";

const extensionSchema = new mongoose.Schema({
  extensionId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  publisher: { type: String, required: true },
  icon: { type: String, default: '🧩' },
  category: { type: String, default: 'other' },
  description: { type: String, default: '' },
  shortDescription: { type: String, default: '' },
  version: { type: String, default: '1.0.0' },
  latestVersion: String,
  downloads: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  tags: [String],
  color: { type: String, default: '#888888' },
  isBuiltin: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isPack: { type: Boolean, default: false },
  packCount: Number,
  repository: String,
  license: String,
  readme: String,
  changelog: [{ version: String, date: Date, notes: String }],
  screenshots: [String],
  dependencies: [{ extensionId: String, name: String }],
  languagePacks: [{ locale: String, name: String, translated: Number }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

extensionSchema.index({ category: 1 });
extensionSchema.index({ downloads: -1 });
extensionSchema.index({ rating: -1 });
extensionSchema.index({ tags: 1 });

export default mongoose.model("Extension", extensionSchema);
