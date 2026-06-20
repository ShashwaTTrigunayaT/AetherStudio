import mongoose from "mongoose";
import logger from "./logger.js";

export async function connectDB() {
  // Resolve the MongoDB URI with fallbacks:
  // 1. MONGO_URI (explicitly set by user)
  // 2. MONGO_URL (Railway's internal MongoDB connection string)
  // 3. MONGO_PUBLIC_URL (Railway's public MongoDB connection string)
  // 4. Construct from individual Railway variables
  // 5. Default localhost fallback
  let uri = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGO_PUBLIC_URL;

  // If none of the above are set, try constructing from individual Railway MongoDB variables
  if (!uri && process.env.MONGOHOST && process.env.MONGOPORT) {
    const user = process.env.MONGOUSER || process.env.MONGO_INITDB_ROOT_USERNAME;
    const pass = process.env.MONGOPASSWORD || process.env.MONGO_INITDB_ROOT_PASSWORD;
    const auth = user && pass ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@` : '';
    uri = `mongodb://${auth}${process.env.MONGOHOST}:${process.env.MONGOPORT}/aetherstudio?authSource=admin`;
  }

  // Final fallback
  if (!uri) {
    uri = "mongodb://localhost:27017/aetherstudio";
  }

  // Ensure the URI has a database name (Railway's MONGO_URL often lacks one)
  // mongodb://host:port → mongodb://host:port/aetherstudio
  const pathMatch = uri.match(/^mongodb(\+srv)?:\/\/[^\/]+(\/|\?)/);
  if (!pathMatch) {
    // No database path or query params yet — append database name
    uri += '/aetherstudio';
  }

  // Ensure authSource=admin is present for Railway MongoDB
  if (!uri.includes('authSource=')) {
    uri += (uri.includes('?') ? '&' : '?') + 'authSource=admin';
  }

  const poolSize = parseInt(process.env.MONGO_POOL_SIZE) || 20;

  try {
    const safeUri = uri.replace(/mongodb:\/\/[^@]+@/, 'mongodb://***:***@');
    logger.info(`Connecting to MongoDB at: ${safeUri}`);
    await mongoose.connect(uri, {
      maxPoolSize: poolSize,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 20000,
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
    logger.error(`MongoDB connection error: ${err.message || err}`, err);
    throw err;
  }
}

export function disconnectDB() {
  return mongoose.disconnect();
}
