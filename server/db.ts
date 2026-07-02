import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Keep track of database state
let isConnected = false;
let useLocalFallback = true;

const FALLBACK_FILE = path.join(process.cwd(), "server-local-db.json");

// Ensure local JSON DB exists
if (!fs.existsSync(FALLBACK_FILE)) {
  fs.writeFileSync(
    FALLBACK_FILE,
    JSON.stringify({
      users: [],
      posts: [],
      comments: [],
      notifications: [],
      refreshTokens: []
    }, null, 2)
  );
}

// Read/Write helper for local DB
export function readLocalDB() {
  try {
    const data = fs.readFileSync(FALLBACK_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return { users: [], posts: [], comments: [], notifications: [], refreshTokens: [] };
  }
}

export function writeLocalDB(data: any) {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Failed to write to local DB:", err);
  }
}

export async function connectDB() {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.warn("⚠️ MONGODB_URI is not set in environment variables.");
    console.log("👉 DevConnect is starting up with a resilient Local File-based JSON Database fallback.");
    console.log(`📂 Data will be saved locally in: ${FALLBACK_FILE}`);
    console.log("💡 To use a real MongoDB, set MONGODB_URI in your environment secrets.");
    useLocalFallback = true;
    return;
  }

  try {
    // Attempt to connect to MongoDB with a 5-second timeout
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    useLocalFallback = false;
    console.log("🚀 Connected to MongoDB Atlas successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", (error as Error).message);
    console.log("👉 Falling back to resilient Local File-based JSON Database to prevent server crash.");
    useLocalFallback = true;
  }
}

export function isUsingMongo() {
  return !useLocalFallback && isConnected;
}
