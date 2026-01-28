import { RequestHandler } from "express";
import { parseDocument } from "../services/document-parser.js";
import { generateStyledHTML } from "../services/html-generator.js";
import { getShopifyClient } from "../services/shopify-client.js";

export interface PublishShopifyRequest {
  document: string;
  title: string;
  author?: string;
  tags?: string[];
  publicationDate?: string;
  imageUrls?: Record<string, string>; // Maps image keyword to Shopify URL
  featuredImageUrl?: string; // Featured/hero image URL
}

export const handlePublishShopify: RequestHandler = async (req, res) => {
  try {
    const { document, title, author, tags, publicationDate, imageUrls, featuredImageUrl } = req.body as PublishShopifyRequest;

    if (!document || !title) {
      return res.status(400).json({
        error: "Missing required fields: 'document' and 'title'",
      });
    }

    // Parse and validate document
    const parsed = parseDocument(document);

    if (!parsed.metadata.isValid) {
      return res.status(400).json({
        error: "Document validation failed",
        metadata: parsed.metadata,
      });
    }

    // Check if there are images that need to be uploaded
    if (parsed.images.length > 0 && !imageUrls) {
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

    // Generate styled HTML (includes CSS for Shopify rendering)
    // Don't include featured image in body HTML - it will be set as the article image field
    const bodyHtml = generateStyledHTML(parsed, {
      includeSchema: true,
      includeImages: true,
      blogTitle: title,
      authorName: author,
      imageUrls: imageUrls || {},
      // Don't pass featuredImageUrl here - we'll set it separately as the article image
      featuredImageUrl: undefined,
    });

    // Publish to Shopify
    const shopifyClient = getShopifyClient();

    // Validate connection first
    const isConnected = await shopifyClient.validateConnection();
    if (!isConnected) {
      return res.status(503).json({
        error: "Unable to connect to Shopify. Please check your credentials.",
      });
    }

    // Get blog ID
    const blogId = await shopifyClient.getBlogId();

    // Publish article with featured image as the article image field (not in body HTML)
    const articleId = await shopifyClient.publishArticle(blogId, {
      title,
      bodyHtml,
      author: author || "Blog Generator",
      publishedAt: publicationDate || new Date().toISOString(),
      tags: tags || [],
      image: featuredImageUrl ? { src: featuredImageUrl } : undefined,
    });

    res.json({
      success: true,
      message: "Article published to Shopify successfully",
      articleId,
      metadata: parsed.metadata,
    });
  } catch (error) {
    console.error("Error publishing to Shopify:", error);
    res.status(500).json({
      error: "Failed to publish to Shopify",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};
