import { RequestHandler } from "express";
import { parseDocument } from "../services/document-parser.js";
import { generateStyledHTML } from "../services/html-generator.js";
import { getShopifyClient } from "../services/shopify-client.js";

interface RelatedProduct {
  id: string;
  title: string;
  handle: string;
  image?: string;
}

export interface PublishShopifyRequest {
  document: string;
  title: string;
  author?: string;
  tags?: string[];
  publicationDate?: string;
  imageUrls?: Record<string, string>; // Maps image keyword to Shopify URL
  featuredImageUrl?: string; // Featured/hero image URL
  relatedProducts?: RelatedProduct[]; // Related products to save to metafield
}

export const handlePublishShopify: RequestHandler = async (req, res) => {
  try {
    console.log("=== POST /api/publish-shopify request received ===");
    console.log("Request body keys:", Object.keys(req.body).join(", "));

    const { document, title, author, tags, publicationDate, imageUrls, featuredImageUrl, relatedProducts } = req.body as PublishShopifyRequest;

    console.log("Publish parameters:");
    console.log("  - Title:", title);
    console.log("  - Document length:", document?.length);
    console.log("  - Author:", author || "Not provided");
    console.log("  - Tags:", tags?.length || 0);
    console.log("  - Featured image URL:", featuredImageUrl ? "Present" : "Not provided");
    console.log("  - Image URLs count:", Object.keys(imageUrls || {}).length);
    console.log("  - Related products:", relatedProducts?.length || 0);

    if (!document || !title) {
      console.error("Missing required fields");
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
          details: "Featured image URL must be a full HTTP/HTTPS URL. Ensure the image was successfully uploaded to Shopify before publishing.",
          suggestion: "Please re-upload the featured image and try again.",
        });
      }

      // Validate URL is properly formatted (not just protocol)
      try {
        new URL(featuredImageUrl);
      } catch {
        console.error(`Malformed featured image URL: ${featuredImageUrl}`);
        return res.status(400).json({
          error: "Invalid featured image URL format",
          details: "The featured image URL is malformed. Please re-upload the image.",
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
    let bodyHtml: string;
    try {
      console.log("Generating styled HTML...");
      bodyHtml = generateStyledHTML(parsed, {
        includeSchema: true,
        includeImages: true,
        blogTitle: title,
        authorName: author,
        imageUrls: imageUrls || {},
        // CRITICAL: Don't pass featuredImageUrl here - we set it separately as article.image
        featuredImageUrl: undefined,
      });

      if (!bodyHtml || bodyHtml.trim().length === 0) {
        console.error("CRITICAL: Generated HTML is empty");
        return res.status(500).json({
          error: "HTML generation failed",
          details: "The generated HTML is empty. Please check your document content.",
        });
      }

      console.log("HTML generated successfully. Size:", bodyHtml.length, "characters");
    } catch (htmlError) {
      const htmlErrorMsg = htmlError instanceof Error ? htmlError.message : String(htmlError);
      console.error("Error generating HTML:", htmlErrorMsg);
      return res.status(500).json({
        error: "Failed to generate HTML from document",
        details: htmlErrorMsg,
      });
    }

    console.log("Publishing with featured image URL:", featuredImageUrl);
    console.log("Body HTML length:", bodyHtml.length);

    // Publish to Shopify
    const shopifyClient = getShopifyClient();

    // Validate connection first with detailed error handling
    console.log("Validating Shopify connection before publishing...");
    let isConnected = false;
    let connectionError: Error | null = null;

    try {
      isConnected = await shopifyClient.validateConnection();
    } catch (err) {
      connectionError = err instanceof Error ? err : new Error(String(err));
      console.error("Connection validation error:", connectionError.message);
    }

    if (!isConnected) {
      const errorMessage = connectionError?.message || "Unable to connect to Shopify. Please check your credentials.";
      console.error("Publishing failed due to connection error:", errorMessage);
      return res.status(503).json({
        error: errorMessage,
        suggestion: "Please verify your Shopify credentials and try again.",
      });
    }

    // Get blog ID
    console.log("Retrieving blog ID...");
    let blogId: string;
    try {
      blogId = await shopifyClient.getBlogId();
      console.log(`Retrieved blog ID: ${blogId}`);
    } catch (err) {
      const blogError = err instanceof Error ? err.message : String(err);
      console.error("Failed to get blog ID:", blogError);
      return res.status(400).json({
        error: "Failed to retrieve blog information from Shopify",
        details: blogError,
        suggestion: "Please ensure your Shopify store has at least one blog and your access token has the necessary permissions.",
      });
    }

    // Publish article with featured image as the article image field (not in body HTML)
    console.log("Publishing article to Shopify...");
    console.log("Featured image URL for publication:", featuredImageUrl ? 'present' : 'missing');
    console.log("Blog ID:", blogId);
    console.log("Article title:", title);
    console.log("Article tags:", tags?.length || 0);
    console.log("Article author:", author || "Blog Generator (default)");
    console.log("Body HTML size:", bodyHtml.length, "bytes");

    let articleId: string;
    try {
      console.log("Sending article to Shopify REST API...");
      articleId = await shopifyClient.publishArticle(blogId, {
        title,
        bodyHtml,
        author: author || "Blog Generator",
        publishedAt: publicationDate || new Date().toISOString(),
        tags: tags || [],
        image: featuredImageUrl ? { src: featuredImageUrl } : undefined,
      });
      console.log("✓ Article published successfully. Article ID:", articleId);
    } catch (publishError) {
      const publishErrorMsg = publishError instanceof Error ? publishError.message : String(publishError);
      console.error("✗ Article publication failed:", publishErrorMsg);
      console.error("Error details:", publishError);
      throw publishError;
    }

    // Save related products to metafield if provided
    let relatedProductsMetafieldSuccess = false;
    if (relatedProducts && relatedProducts.length > 0) {
      try {
        console.log(`✓ Saving ${relatedProducts.length} related products to metafield (type: list.product_reference)`);

        // For list.product_reference type, Shopify expects an array of product GIDs
        // Format: gid://shopify/Product/{numeric_id}
        const productGids = relatedProducts.map((p) => {
          // Extract numeric ID from Shopify ID format
          // Handle both: "123456789" and "gid://shopify/Product/123456789"
          let numericId = String(p.id);
          if (numericId.includes('/')) {
            numericId = numericId.split('/').pop() || numericId;
          }
          // Ensure numeric ID is clean (no extra characters)
          numericId = numericId.replace(/[^0-9]/g, '');
          return `gid://shopify/Product/${numericId}`;
        });

        // For list.product_reference, Shopify expects the value as a JSON array of product GIDs
        const relatedProductsValue = JSON.stringify(productGids);
        console.log(`Metafield payload: ${productGids.length} product references, ${relatedProductsValue.length} bytes`);
        console.log("Product GIDs:", productGids.join(", "));

        await shopifyClient.updateArticleMetafield(
          blogId,
          articleId,
          "custom",
          "related_products",
          relatedProductsValue,
          "list.product_reference"
        );
        relatedProductsMetafieldSuccess = true;
        console.log("✓ Related products metafield updated successfully");
        console.log(`  - Namespace: custom`);
        console.log(`  - Key: related_products`);
        console.log(`  - Type: list.product_reference`);
        console.log(`  - Products: ${productIds.length}`);
      } catch (error) {
        const metafieldErrorMsg = error instanceof Error ? error.message : String(error);
        console.error("✗ Error saving related products to metafield:", metafieldErrorMsg);
        console.error("Full error object:", error);
        console.error("Note: Article is already published. Metafield update is optional.");
        console.error("This error does not affect the article publication.");
        // Don't fail the entire publish if metafield update fails
        // The article is already published, but log the error for debugging
      }
    } else {
      console.log("No related products provided - skipping metafield update");
    }

    console.log("=== Publication complete ===");
    res.json({
      success: true,
      message: "Article published to Shopify successfully",
      articleId,
      metadata: parsed.metadata,
      featuredImageIncluded: !!featuredImageUrl,
      relatedProductsCount: relatedProducts?.length || 0,
      relatedProductsMetafieldSuccess: relatedProductsMetafieldSuccess,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("=== Publication failed ===");
    console.error("Error message:", errorMessage);
    console.error("Full error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "N/A");

    const isFeaturedImageError = errorMessage.toLowerCase().includes('image') || errorMessage.toLowerCase().includes('url');
    const isAuthError = errorMessage.includes('Authentication failed') || errorMessage.includes('401') || errorMessage.includes('Access token');
    const isConnectionError = errorMessage.includes('Cannot connect') || errorMessage.includes('Failed to connect') || errorMessage.includes('ENOTFOUND');

    if (isAuthError) {
      console.error("✗ Authentication error detected");
      return res.status(401).json({
        error: "Shopify authentication failed",
        details: "Your Shopify API access token may be invalid or expired.",
        suggestion: "Please regenerate your Shopify API access token and update the SHOPIFY_ADMIN_ACCESS_TOKEN environment variable.",
      });
    }

    if (isConnectionError) {
      console.error("✗ Connection error detected");
      return res.status(503).json({
        error: "Unable to connect to Shopify",
        details: errorMessage,
        suggestion: "Please verify your Shopify shop name is correct and check your network connectivity.",
      });
    }

    if (isFeaturedImageError) {
      console.error("✗ Featured image error detected");
      return res.status(400).json({
        error: "Failed to set featured image on article",
        details: errorMessage,
        suggestion: "Ensure the featured image URL is valid, publicly accessible, and properly formatted",
      });
    }

    res.status(500).json({
      error: "Failed to publish to Shopify",
      details: errorMessage,
      suggestion: "Please check the server logs for more details. This could be a Shopify API issue, authentication issue, or document content issue.",
    });
  }
};
