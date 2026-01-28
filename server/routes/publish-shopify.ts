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

    // Validate featured image URL if provided
    if (featuredImageUrl) {
      console.log(`Received featuredImageUrl: ${featuredImageUrl}`);

      // Check if it's a valid URL format
      if (!featuredImageUrl.startsWith('http://') && !featuredImageUrl.startsWith('https://')) {
        console.error(`Invalid featured image URL format: ${featuredImageUrl}`);
        return res.status(400).json({
          error: "Invalid featured image URL",
          details: "Featured image URL must be a full HTTP/HTTPS URL",
        });
      }
    } else {
      console.warn('No featured image URL provided for publication');
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

    // Generate styled HTML for Shopify
    // Important: DO NOT include featured image in body HTML - it will be set as the article image field
    // This ensures the featured image appears in Shopify's "Image" field, not in the content
    const bodyHtml = generateStyledHTML(parsed, {
      includeSchema: true,
      includeImages: true,
      blogTitle: title,
      authorName: author,
      imageUrls: imageUrls || {},
      // CRITICAL: Don't pass featuredImageUrl here - we set it separately as article.image
      featuredImageUrl: undefined,
    });

    console.log("Publishing with featured image URL:", featuredImageUrl);
    console.log("Body HTML length:", bodyHtml.length);

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
    console.log("Featured image URL for publication:", featuredImageUrl ? 'present' : 'missing');
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
      featuredImageIncluded: !!featuredImageUrl,
    });
  } catch (error) {
    console.error("Error publishing to Shopify:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const isFeaturedImageError = errorMessage.includes('image') || errorMessage.includes('Image');

    if (isFeaturedImageError) {
      console.error("Featured image error detected:", errorMessage);
      return res.status(400).json({
        error: "Failed to set featured image on article",
        details: errorMessage,
        suggestion: "Ensure the featured image URL is valid and publicly accessible",
      });
    }

    res.status(500).json({
      error: "Failed to publish to Shopify",
      details: errorMessage,
    });
  }
};
