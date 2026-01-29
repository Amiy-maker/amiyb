import { RequestHandler } from "express";
import { getShopifyClient } from "../services/shopify-client.js";

export interface UploadImageRequest {
  keyword: string;
}

export interface UploadImageResponse {
  success: boolean;
  imageUrl?: string;
  keyword?: string;
  error?: string;
}

/**
 * Handle image upload to Shopify
 * Expects multipart/form-data with:
 * - file: binary image file
 * - keyword: primary keyword for the image
 */
export const handleUploadImage: RequestHandler = async (req, res) => {
  try {
    console.log("=== POST /api/upload-image request received ===");

    // Check if file was uploaded
    if (!req.file) {
      console.error("No file provided in request");
      return res.status(400).json({
        success: false,
        error: "No file provided. Please upload an image file.",
      } as UploadImageResponse);
    }

    const keyword = (req.body?.keyword || "image").trim();
    console.log("File upload details:");
    console.log("  - Keyword:", keyword);
    console.log("  - Original filename:", req.file.originalname);
    console.log("  - MIME type:", req.file.mimetype);
    console.log("  - File size:", req.file.size, "bytes");

    // Validate file is an image
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedMimes.includes(req.file.mimetype)) {
      console.error("Invalid MIME type:", req.file.mimetype);
      return res.status(400).json({
        success: false,
        error: "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.",
      } as UploadImageResponse);
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      console.error("File too large:", req.file.size, "bytes");
      return res.status(400).json({
        success: false,
        error: `File too large (${Math.round(req.file.size / 1024 / 1024)}MB). Maximum size is 5MB.`,
      } as UploadImageResponse);
    }

    // Generate filename using keyword
    const ext = req.file.originalname.split(".").pop() || "jpg";
    const filename = `${keyword.replace(/\s+/g, "-")}-${Date.now()}.${ext}`;
    console.log("Generated filename:", filename);

    // Upload to Shopify
    try {
      const shopifyClient = getShopifyClient();
      console.log(`Starting Shopify image upload...`);
      const imageUrl = await shopifyClient.uploadImage(req.file.buffer, filename, keyword);

      console.log(`Successfully uploaded image. URL: ${imageUrl}`);
      res.json({
        success: true,
        imageUrl,
        keyword,
      } as UploadImageResponse);
    } catch (shopifyError) {
      const shopifyErrorMsg = shopifyError instanceof Error ? shopifyError.message : String(shopifyError);
      console.error("Shopify upload error:", shopifyErrorMsg);
      console.error("Shopify error details:", shopifyError);

      return res.status(500).json({
        success: false,
        error: `Failed to upload image to Shopify: ${shopifyErrorMsg}`,
      } as UploadImageResponse);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Image upload error:", errorMsg);
    console.error("Error stack:", error instanceof Error ? error.stack : "N/A");

    return res.status(500).json({
      success: false,
      error: `Unexpected server error: ${errorMsg}`,
    } as UploadImageResponse);
  }
};
