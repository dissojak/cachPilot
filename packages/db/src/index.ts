import mongoose from "mongoose";

type MongooseCache = {
  instance: typeof mongoose | null;
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache: MongooseCache =
  globalForMongoose.mongooseCache ?? {
    instance: null,
    conn: null,
    promise: null,
  };

globalForMongoose.mongooseCache = cache;

export async function connectDb(): Promise<typeof mongoose> {
  const uri = process.env.DATABASE_URL;

  if (!uri) {
    throw new Error("DATABASE_URL is required");
  }

  // Ne pas réutiliser une connexion provenant
  // d'une autre instance Mongoose.
  if (cache.instance !== mongoose) {
    cache.instance = mongoose;
    cache.conn = null;
    cache.promise = null;
  }

  // La connexion de cette instance est déjà active.
  if (mongoose.connection.readyState === 1) {
    cache.conn = mongoose;
    return mongoose;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    const connection = await cache.promise;

    if (connection.connection.readyState !== 1) {
      throw new Error(
        "MongoDB connection is not ready"
      );
    }

    cache.conn = connection;

    console.log(
      "[MONGODB] Connected successfully"
    );

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
