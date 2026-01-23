import { VercelRequest, VercelResponse } from '@vercel/node';
import { parseDocument } from '../server/services/document-parser';
import { generateHTML } from '../server/services/html-generator';
import { getShopifyClient } from '../server/services/shopify-client';

export interface PublishShopifyRequest {
  document: string;
  title: string;
  author?: string;
  tags?: string[];
  publicationDate?: string;
  imageUrls?: Record<string, string>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log(`[${new Date().toISOString()}] POST /api/publish-shopify - Request received`);
  console.log('Request method:', req.method);

  if (req.method !== 'POST') {
    console.warn(`[${new Date().toISOString()}] Invalid method: ${req.method}`);
    return res.status(405).json({
      error: 'Method Not Allowed',
      details: 'Only POST requests are supported',
    });
  }

  try {
    const { document, title, author, tags, publicationDate, imageUrls } = req.body as PublishShopifyRequest;

    console.log(`[${new Date().toISOString()}] Publishing article: "${title}"`);
    console.log(`[${new Date().toISOString()}] Document length: ${document?.length || 0}, Author: ${author || 'N/A'}`);

    if (!document || !title) {
      console.error('Missing required fields: document or title');
      return res.status(400).json({
        error: "Missing required fields: 'document' and 'title'",
      });
    }

    // Parse and validate document
    console.log(`[${new Date().toISOString()}] Parsing document...`);
    const parsed = parseDocument(document);
    console.log(`[${new Date().toISOString()}] Document parsed. Sections: ${parsed.sections.length}`);

    if (!parsed.metadata.isValid) {
      console.warn(`[${new Date().toISOString()}] Document validation failed. Metadata:`, parsed.metadata);
      return res.status(400).json({
        error: "Document validation failed",
        metadata: parsed.metadata,
      });
    }

    // Check if there are images that need to be uploaded
    if (parsed.images.length > 0 && !imageUrls) {
      console.log(`[${new Date().toISOString()}] Document requires image upload. Found ${parsed.images.length} images`);
      return res.status(202).json({
        success: false,
        requiresImageUpload: true,
        images: parsed.images.map((img) => ({
          keyword: img.keyword,
          sectionId: img.sectionId,
        })),
        message: "Document contains images. Please upload images to Shopify first.",
      });
    }

    // Generate HTML
    console.log(`[${new Date().toISOString()}] Generating HTML for article...`);
    const bodyHtml = generateHTML(parsed, {
      includeSchema: true,
      includeImages: true,
      blogTitle: title,
      authorName: author,
      imageUrls: imageUrls || {},
    });
    console.log(`[${new Date().toISOString()}] HTML generated. Size: ${bodyHtml.length} characters`);

    // Publish to Shopify
    console.log(`[${new Date().toISOString()}] Connecting to Shopify...`);
    const shopifyClient = getShopifyClient();

    // Validate connection first
    const isConnected = await shopifyClient.validateConnection();
    if (!isConnected) {
      console.error(`[${new Date().toISOString()}] Failed to connect to Shopify`);
      return res.status(503).json({
        error: "Unable to connect to Shopify. Please check your credentials.",
      });
    }
    console.log(`[${new Date().toISOString()}] Shopify connection validated`);

    // Get blog ID
    console.log(`[${new Date().toISOString()}] Fetching blog ID...`);
    const blogId = await shopifyClient.getBlogId();
    console.log(`[${new Date().toISOString()}] Blog ID: ${blogId}`);

    // Publish article
    console.log(`[${new Date().toISOString()}] Publishing article to Shopify...`);
    const articleId = await shopifyClient.publishArticle(blogId, {
      title,
      bodyHtml,
      author: author || "Blog Generator",
      publishedAt: publicationDate || new Date().toISOString(),
      tags: tags || [],
    });
    console.log(`[${new Date().toISOString()}] Article published successfully. Article ID: ${articleId}`);

    res.status(200).json({
      success: true,
      message: "Article published to Shopify successfully",
      articleId,
      metadata: parsed.metadata,
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error publishing to Shopify:`, error);
    return res.status(500).json({
      error: "Failed to publish to Shopify",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
