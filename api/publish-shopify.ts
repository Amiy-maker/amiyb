import { VercelRequest, VercelResponse } from '@vercel/node';
import { parseDocument } from './lib/document-parser.js';
import { generateStyledHTML } from './lib/html-generator.js';
import { getShopifyClient } from './lib/shopify-client.js';

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
    const { document, title, author, tags, publicationDate, imageUrls, featuredImageUrl, relatedProducts } = req.body as PublishShopifyRequest;

    console.log(`[${new Date().toISOString()}] Publishing article: "${title}"`);
    console.log(`[${new Date().toISOString()}] Document length: ${document?.length || 0}, Author: ${author || 'N/A'}`);
    console.log(`[${new Date().toISOString()}] Related products: ${relatedProducts?.length || 0}`);

    if (!document || !title) {
      console.error('Missing required fields: document or title');
      return res.status(400).json({
        error: "Missing required fields: 'document' and 'title'",
      });
    }

    // Validate featured image URL if provided
    if (featuredImageUrl) {
      console.log(`[${new Date().toISOString()}] Received featuredImageUrl: ${featuredImageUrl}`);

      // Check if it's a valid URL format
      if (!featuredImageUrl.startsWith('http://') && !featuredImageUrl.startsWith('https://')) {
        console.error(`[${new Date().toISOString()}] Invalid featured image URL format: ${featuredImageUrl}`);
        return res.status(400).json({
          error: "Invalid featured image URL",
          details: "Featured image URL must be a full HTTP/HTTPS URL",
        });
      }
    } else {
      console.warn(`[${new Date().toISOString()}] No featured image URL provided for publication`);
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
    // Important: DO NOT include featured image in body HTML - it will be set as the article image field
    // This ensures the featured image appears in Shopify's "Image" field, not in the content
    console.log(`[${new Date().toISOString()}] Generating HTML for article...`);
    const bodyHtml = generateStyledHTML(parsed, {
      includeSchema: true,
      includeImages: true,
      blogTitle: title,
      authorName: author,
      imageUrls: imageUrls || {},
      // CRITICAL: Don't pass featuredImageUrl here - we set it separately as article.image
      featuredImageUrl: undefined,
    });
    console.log(`[${new Date().toISOString()}] HTML generated. Size: ${bodyHtml.length} characters`);

    // Extract description from section2 (Intro Paragraph)
    let description: string = "";
    const section2 = parsed.sections.find((s) => s.id === "section2");
    if (section2) {
      // Use the raw content but clean it up (remove markdown/special chars)
      description = section2.rawContent
        .replace(/\{img\}\s*([^\n\r{}]+)/gi, "") // Remove image markers
        .trim()
        .substring(0, 500); // Limit to 500 chars for Shopify content field
      console.log(`[${new Date().toISOString()}] Extracted description from section2: ${description.substring(0, 100)}...`);
    }

    console.log(`[${new Date().toISOString()}] Publishing with featured image URL:`, featuredImageUrl);

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

    // Publish article with featured image as the article image field (not in body HTML)
    console.log(`[${new Date().toISOString()}] Publishing article to Shopify...`);
    console.log(`[${new Date().toISOString()}] Featured image URL for publication: ${featuredImageUrl ? 'present' : 'missing'}`);
    console.log(`[${new Date().toISOString()}] Description for content field: ${description.substring(0, 50)}...`);

    const articleId = await shopifyClient.publishArticle(blogId, {
      title,
      bodyHtml: description || bodyHtml, // Use description as main content, fallback to full HTML
      author: author || "Blog Generator",
      publishedAt: publicationDate || new Date().toISOString(),
      tags: tags || [],
      image: featuredImageUrl ? { src: featuredImageUrl } : undefined,
    });
    console.log(`[${new Date().toISOString()}] Article published successfully. Article ID: ${articleId}`);

    // Save full HTML to metafield custom.content_html
    let contentHtmlMetafieldSuccess = false;
    try {
      console.log(`[${new Date().toISOString()}] ✓ Saving full HTML to metafield custom.content_html`);
      await shopifyClient.updateArticleMetafield(
        blogId,
        articleId,
        "custom",
        "content_html",
        bodyHtml, // Save the full generated HTML
        "multi_line_text_field" // Use multi_line_text_field type
      );
      contentHtmlMetafieldSuccess = true;
      console.log(`[${new Date().toISOString()}] ✓ Full HTML metafield saved successfully`);
    } catch (error) {
      const metafieldErrorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[${new Date().toISOString()}] ✗ Error saving HTML to content_html metafield:`, metafieldErrorMsg);
      console.log(`[${new Date().toISOString()}] Note: Article is already published. Metafield update is optional.`);
    }

    // Optionally save description as a content metafield for reference
    let contentMetafieldSuccess = false;
    if (description) {
      try {
        console.log(`[${new Date().toISOString()}] ✓ Saving description to metafield custom.content`);
        await shopifyClient.updateArticleMetafield(
          blogId,
          articleId,
          "custom",
          "content",
          description,
          "string"
        );
        contentMetafieldSuccess = true;
        console.log(`[${new Date().toISOString()}] ✓ Content metafield saved successfully`);
      } catch (error) {
        const metafieldErrorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[${new Date().toISOString()}] ✗ Error saving description to content metafield:`, metafieldErrorMsg);
      }
    }

    // Save related products to metafield if provided
    if (relatedProducts && relatedProducts.length > 0) {
      try {
        console.log(`[${new Date().toISOString()}] ✓ Saving ${relatedProducts.length} related products to metafield (type: list.product_reference)`);

        // For list.product_reference type, we need to pass an array of product GIDs
        // Shopify product GID format: gid://shopify/Product/{product_id}
        const productGids = relatedProducts.map((p) => {
          // Extract numeric ID from Shopify ID format
          const numericId = String(p.id).includes('/')
            ? String(p.id).split('/').pop()
            : String(p.id);
          return `gid://shopify/Product/${numericId}`;
        });

        const relatedProductsValue = JSON.stringify(productGids);
        console.log(`[${new Date().toISOString()}] Metafield payload: ${productGids.length} product references, ${relatedProductsValue.length} bytes`);
        console.log(`[${new Date().toISOString()}] Product GIDs: ${productGids.join(", ")}`);

        await shopifyClient.updateArticleMetafield(
          blogId,
          articleId,
          "custom",
          "related_products",
          relatedProductsValue,
          "list.product_reference"
        );
        console.log(`[${new Date().toISOString()}] ✓ Related products metafield updated successfully`);
        console.log(`[${new Date().toISOString()}]   - Namespace: custom`);
        console.log(`[${new Date().toISOString()}]   - Key: related_products`);
        console.log(`[${new Date().toISOString()}]   - Type: list.product_reference`);
        console.log(`[${new Date().toISOString()}]   - Products: ${productGids.length}`);
      } catch (error) {
        const metafieldErrorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[${new Date().toISOString()}] ✗ Error saving related products to metafield:`, metafieldErrorMsg);
        console.error(`[${new Date().toISOString()}] Note: Article is already published. Metafield update is optional.`);
        console.error(`[${new Date().toISOString()}] This error does not affect the article publication.`);
        // Don't fail the entire publish if metafield update fails
      }
    }

    res.status(200).json({
      success: true,
      message: "Article published to Shopify successfully",
      articleId,
      metadata: parsed.metadata,
      featuredImageIncluded: !!featuredImageUrl,
      contentHtmlMetafieldSuccess,
      contentMetafieldSuccess,
      relatedProductsCount: relatedProducts?.length || 0,
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error publishing to Shopify:`, error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const isFeaturedImageError = errorMessage.includes('image') || errorMessage.includes('Image');

    if (isFeaturedImageError) {
      console.error(`[${new Date().toISOString()}] Featured image error detected:`, errorMessage);
      return res.status(400).json({
        error: "Failed to set featured image on article",
        details: errorMessage,
        suggestion: "Ensure the featured image URL is valid and publicly accessible",
      });
    }

    return res.status(500).json({
      error: "Failed to publish to Shopify",
      details: errorMessage,
    });
  }
}
