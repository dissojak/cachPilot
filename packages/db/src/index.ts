import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache = globalForMongoose.mongooseCache ?? {
  conn: null,
  promise: null,
};

globalForMongoose.mongooseCache = cache;

export async function connectDb() {
  if (cache.conn && cache.conn.connection.readyState === 1) return cache.conn;

  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error("DATABASE_URL is required");

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri)
      .then((conn) => {
        cache.conn = conn;
        return conn;
      })
      .catch((error) => {
        cache.promise = null;
        throw error;
      });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
  return cache.conn;
}

export { mongoose };
export * from "./schemas";
