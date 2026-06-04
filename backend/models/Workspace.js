import mongoose from "mongoose";

// 1. Define the base file schema without children first
const fileSchema = new mongoose.Schema({
  id: String,
  name: String,
  type: { type: String, enum: ["file", "folder"] },
  content: String,
  language: String,
}, { _id: false });

// 2. Recursively add the children array safely
fileSchema.add({
  children: [fileSchema]
});

// 3. Define the main Workspace schema
const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    collaboratorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    fileTree: fileSchema,
    yState: Buffer,
    isPublic: { type: Boolean, default: false },
    inviteToken: String,
  },
  { timestamps: true }
);

// Unique name per owner — case-sensitive
workspaceSchema.index({ name: 1, ownerId: 1 }, { unique: true });

export default mongoose.model("Workspace", workspaceSchema);