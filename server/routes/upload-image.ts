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
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file provided. Please upload an image file.",
      } as UploadImageResponse);
    }

    const keyword = (req.body?.keyword || "image").trim();

    // Validate file is an image
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.",
      } as UploadImageResponse);
    }

    // Validate file size (max 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: "File too large. Maximum size is 5MB.",
      } as UploadImageResponse);
    }

    // Generate filename using keyword
    const ext = req.file.originalname.split(".").pop() || "jpg";
    const filename = `${keyword.replace(/\s+/g, "-")}-${Date.now()}.${ext}`;

    // Upload to Shopify
    try {
      const shopifyClient = getShopifyClient();
      console.log(`Uploading image: ${filename} with keyword: ${keyword}`);
      const imageUrl = await shopifyClient.uploadImage(req.file.buffer, filename, keyword);

      console.log(`Successfully uploaded image. URL: ${imageUrl}`);
      res.json({
        success: true,
        imageUrl,
        keyword,
      } as UploadImageResponse);
    } catch (shopifyError) {
      console.error("Shopify upload error:", shopifyError);
      return res.status(500).json({
        success: false,
        error:
          shopifyError instanceof Error
            ? shopifyError.message
            : "Failed to upload image to Shopify",
      } as UploadImageResponse);
    }
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unexpected server error",
    } as UploadImageResponse);
  }
};
