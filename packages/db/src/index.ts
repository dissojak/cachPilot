
import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache: MongooseCache =
  globalForMongoose.mongooseCache ?? {
    conn: null,
    promise: null,
  };

globalForMongoose.mongooseCache = cache;

export async function connectDb(): Promise<typeof mongoose> {
  if (cache.conn?.connection.readyState === 1) {
    return cache.conn;
  }

  const uri = process.env.DATABASE_URL;

  if (!uri) {
    throw new Error("DATABASE_URL is required");
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    const connection = await cache.promise;

    cache.conn = connection;

    return connection;
  } catch (error) {
    cache.conn = null;
    cache.promise = null;

    console.error(
      "[MONGODB] Connection failed:",
      error
    );

    throw error;
  }
}

export { mongoose };
export * from "./schemas";
