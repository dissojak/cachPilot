import mongoose from "mongoose";

type MongooseCache = { promise: Promise<typeof mongoose> | null };

// Survives Next.js hot reloads in development: one connection per process.
const globalForMongoose = globalThis as typeof globalThis & { mongooseCache?: MongooseCache };
const cache: MongooseCache = globalForMongoose.mongooseCache ?? { promise: null };
globalForMongoose.mongooseCache = cache;

/** Connects once; concurrent callers share the same pending connection. */
export async function connectDb(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!cache.promise) {
    const uri = process.env.DATABASE_URL;
    if (!uri) throw new Error("DATABASE_URL is required: CashPilot reads all its data from MongoDB");
    cache.promise = mongoose.connect(uri, { serverSelectionTimeoutMS: 20000, retryReads: true });
  }
  try {
    return await cache.promise;
  } catch (error) {
    cache.promise = null; // allow a retry on the next request
    throw error;
  }
}

export { mongoose };
export * from "./schemas";
export type * from "./documents";
