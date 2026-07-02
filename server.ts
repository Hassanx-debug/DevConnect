import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { connectDB } from "./server/db";
import apiRouter from "./server/routes";
import { errorHandler } from "./server/middleware";
import { createServer as createViteServer } from "vite";

async function startServer() {
  // Initialize Database Connection
  await connectDB();

  const app = express();
  const PORT = process.env.PORT || 7860;

  // Basic Security & CORS configuration
  app.use(
    cors({
      origin: ['https://dev-connect-chi-six.vercel.app', 'https://dev-connect.vercel.app'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // Helmet with configuration compatible with Vite preview / iframes
  app.use(
    helmet({
      contentSecurityPolicy: false, // Vite HMR and dynamic styling need CSP relaxed in dev
      crossOriginEmbedderPolicy: false,
    })
  );

  // Parse JSON bodies
  app.use(express.json({ limit: "10mb" }));

  // Quick light-weight inline cookie parser
  app.use((req: any, res: any, next: any) => {
    const cookieHeader = req.headers.cookie;
    const cookies: Record<string, string> = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const parts = cookie.split("=");
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const val = parts.slice(1).join("=").trim();
          cookies[name] = decodeURIComponent(val);
        }
      });
    }
    req.cookies = cookies;
    next();
  });

  // Simple Rate Limiter on authentication paths
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per window
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many authentication requests, please try again later." }
  });
  app.use("/api/v1/auth", authLimiter);

  // Mount versioned REST API Router
  app.use("/api/v1", apiRouter);

  // DevConnect custom image/file mock upload proxy for Cloudinary fallback
  // If the user doesn't have Cloudinary, this lets them upload any base64 image or file
  // and saves/returns it immediately as a mock image string.
  app.post("/api/v1/upload", (req, res) => {
    const { file } = req.body;
    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }
    // Return mock avatar/post image (just return the base64 or a beautiful random developer avatar)
    res.json({
      url: file.startsWith("data:") ? file : `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
    });
  });

  // Centralized Error Handling
  app.use(errorHandler);

  // Vite middleware for dev mode or Static files for prod mode
  if (process.env.NODE_ENV !== "production") {
    console.log("🛠️ Starting Vite in middleware mode (Development)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("📦 Serving compiled static files (Production)...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`📡 DevConnect API server running on port ${PORT}`);
    console.log(`🔗 API routes versioned under: http://0.0.0.0:${PORT}/api/v1`);
    console.log(`🌍 CORS enabled for: https://dev-connect-chi-six.vercel.app`);
  });
}

startServer().catch((err) => {
  console.error("💥 Server failed to start:", err);
});
