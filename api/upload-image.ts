import { VercelRequest, VercelResponse } from '@vercel/node';
import busboy from 'busboy';
import { getShopifyClient } from '../server/services/shopify-client';

export interface UploadImageResponse {
  success: boolean;
  imageUrl?: string;
  keyword?: string;
  error?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log(`[${new Date().toISOString()}] POST /api/upload-image - Request received`);
  console.log('Request method:', req.method);
  console.log('Content-Type:', req.headers['content-type']);

  if (req.method !== 'POST') {
    console.warn(`[${new Date().toISOString()}] Invalid method: ${req.method}`);
    return res.status(405).json({
      error: 'Method Not Allowed',
      details: 'Only POST requests are supported',
    });
  }

  try {
    // Parse multipart form data
    const bb = busboy({ headers: req.headers });
    let fileBuffer: Buffer | null = null;
    let filename = '';
    let keyword = 'image';
    let mimeType = '';

    console.log(`[${new Date().toISOString()}] Parsing multipart form data...`);

    bb.on('file', (fieldname, file, info) => {
      console.log(`[${new Date().toISOString()}] File field received: ${fieldname}`);
      console.log(`[${new Date().toISOString()}] Filename: ${info.filename}, MIME: ${info.mimeType}`);

      filename = info.filename;
      mimeType = info.mimeType;
      const chunks: Buffer[] = [];

      file.on('data', (data) => {
        chunks.push(data);
      });

      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
        console.log(`[${new Date().toISOString()}] File received. Size: ${fileBuffer.length} bytes`);
      });
    });

    bb.on('field', (fieldname, value) => {
      if (fieldname === 'keyword') {
        keyword = (value || 'image').trim();
        console.log(`[${new Date().toISOString()}] Keyword field: ${keyword}`);
      }
    });

    await new Promise((resolve, reject) => {
      bb.on('close', resolve);
      bb.on('error', reject);
      req.pipe(bb);
    });

    // Validate file
    if (!fileBuffer) {
      console.error('No file provided');
      return res.status(400).json({
        success: false,
        error: "No file provided. Please upload an image file.",
      } as UploadImageResponse);
    }

    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedMimes.includes(mimeType)) {
      console.error(`Invalid MIME type: ${mimeType}`);
      return res.status(400).json({
        success: false,
        error: "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.",
      } as UploadImageResponse);
    }

    if (fileBuffer.length > 5 * 1024 * 1024) {
      console.error(`File too large: ${fileBuffer.length} bytes`);
      return res.status(400).json({
        success: false,
        error: "File too large. Maximum size is 5MB.",
      } as UploadImageResponse);
    }

    // Generate filename
    const ext = filename.split(".").pop() || "jpg";
    const uploadFilename = `${keyword.replace(/\s+/g, "-")}-${Date.now()}.${ext}`;

    // Upload to Shopify
    try {
      console.log(`[${new Date().toISOString()}] Uploading to Shopify: ${uploadFilename}`);
      const shopifyClient = getShopifyClient();
      const imageUrl = await shopifyClient.uploadImage(fileBuffer, uploadFilename, keyword);

      console.log(`[${new Date().toISOString()}] Successfully uploaded image. URL: ${imageUrl}`);
      return res.status(200).json({
        success: true,
        imageUrl,
        keyword,
      } as UploadImageResponse);
    } catch (shopifyError) {
      console.error(`[${new Date().toISOString()}] Shopify upload error:`, shopifyError);
      return res.status(500).json({
        success: false,
        error:
          shopifyError instanceof Error
            ? shopifyError.message
            : "Failed to upload image to Shopify",
      } as UploadImageResponse);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Image upload error:`, error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unexpected server error",
    });
  }
}
