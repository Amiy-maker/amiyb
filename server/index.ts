import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { handleDemo } from "./routes/demo.js";
import { handleParseDocument } from "./routes/parse-document.js";
import { handleGenerateHTML } from "./routes/generate-html.js";
import { handlePublishShopify } from "./routes/publish-shopify.js";
import { handleUploadImage } from "./routes/upload-image.js";
import { handleVerifyPassword } from "./routes/verify-password.js";
import { handleGetProducts } from "./routes/get-products.js";

// Configure multer for file uploads (keep in memory for simplicity)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed."));
    }
  },
});

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Authentication routes
  app.post("/api/verify-password", handleVerifyPassword);

  app.get("/api/demo", handleDemo);

  // Blog generator routes
  app.post("/api/parse-document", handleParseDocument);
  app.post("/api/generate-html", handleGenerateHTML);
  app.post("/api/publish-shopify", handlePublishShopify);

  // Image upload route
  app.post("/api/upload-image", upload.single("file"), handleUploadImage);

  return app;
}
