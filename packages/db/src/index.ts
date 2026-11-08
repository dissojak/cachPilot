import mongoose from "mongoose";

mongoose.set("bufferTimeoutMS", 30000);

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
  mongooseEventsBound?: boolean;
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

  if (!globalForMongoose.mongooseEventsBound) {
    globalForMongoose.mongooseEventsBound = true;
    mongoose.connection.on("connected", () => console.log("[cashpilot-db] connected"));
    mongoose.connection.on("disconnected", () => console.warn("[cashpilot-db] disconnected (mongoose auto-reconnects)"));
    mongoose.connection.on("error", (error) => console.error("[cashpilot-db] connection error", error));
  }

  cache.conn = null;
  cache.promise = null;

  cache.promise = mongoose.connect(uri, {
    serverSelectionTimeoutMS: 20000,
    retryReads: true,
  });

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    cache.conn = null;
    throw error;
  }
  return cache.conn;
}

export { mongoose };
export * from "./schemas";
