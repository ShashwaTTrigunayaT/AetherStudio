import mongoose from "mongoose";
import logger from "./logger.js";

export async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/aetherstudio";
  const poolSize = parseInt(process.env.MONGO_POOL_SIZE) || 20;

  try {
    await mongoose.connect(uri, {
      maxPoolSize: poolSize,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: "majority",
    });

    // Index creation
    await Promise.all([
      mongoose.models.User?.collection?.createIndex({ email: 1 }, { unique: true }),
      mongoose.models.Workspace?.collection?.createIndex({ ownerId: 1 }),
      mongoose.models.Workspace?.collection?.createIndex({ collaboratorIds: 1 }),
    ]);

    logger.info("MongoDB connected");
  } catch (err) {
    logger.error("MongoDB connection error:", err);
    throw err;
  }
}

export function disconnectDB() {
  return mongoose.disconnect();
}
