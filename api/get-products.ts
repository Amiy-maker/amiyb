import { VercelRequest, VercelResponse } from '@vercel/node';
import { getShopifyClient } from './lib/shopify-client.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Disable caching for this endpoint to ensure fresh products are always returned
    res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.removeHeader("ETag");

    // Always set content type and caching headers at the start
    res.setHeader("Content-Type", "application/json");

    console.log("GET /api/products request received");

    // Debug: Log environment variables (without exposing the full token)
    const shopNameEnv = process.env.SHOPIFY_SHOP;
    const accessTokenEnv = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    const apiVersionEnv = process.env.SHOPIFY_API_VERSION;

    console.log(`[DEBUG] Environment variables check:`);
    console.log(`[DEBUG] SHOPIFY_SHOP: ${shopNameEnv ? '✓ set' : '✗ NOT SET'}`);
    console.log(`[DEBUG] SHOPIFY_ADMIN_ACCESS_TOKEN: ${accessTokenEnv ? '✓ set' : '✗ NOT SET'}`);
    console.log(`[DEBUG] SHOPIFY_API_VERSION: ${apiVersionEnv || 'using default'}`);

    const limit = parseInt(req.query.limit as string) || 250;
    console.log(`Fetching products with limit: ${limit}`);

    let shopifyClient;
    try {
      shopifyClient = getShopifyClient();
      console.log("✓ Shopify client initialized successfully");
    } catch (clientError) {
      const errorMsg = clientError instanceof Error ? clientError.message : String(clientError);
      console.error("❌ Failed to initialize Shopify client:", errorMsg);
      return res.status(503).json({
        success: false,
        error: "Shopify not configured",
        details: "SHOPIFY_SHOP and SHOPIFY_ADMIN_ACCESS_TOKEN environment variables are required.",
        code: "SHOPIFY_NOT_CONFIGURED",
      });
    }

    console.log("Shopify client initialized");

    // Validate Shopify connection first with timeout
    console.log("Validating Shopify connection...");
    let isConnected = false;
    try {
      isConnected = await shopifyClient.validateConnection();
    } catch (validationError) {
      const validationMsg = validationError instanceof Error ? validationError.message : String(validationError);
      console.error("Shopify connection validation failed:", validationMsg);

      // Continue anyway - validation might fail but products fetch could still work
      console.log("Continuing despite validation error - attempting to fetch products");
    }

    if (!isConnected) {
      console.warn("Shopify connection validation returned false - but attempting to fetch products anyway");
    }

    console.log("Attempting to fetch products from Shopify...");
    let products;
    try {
      products = await shopifyClient.getProducts(limit);
    } catch (productsError) {
      const errorMsg = productsError instanceof Error ? productsError.message : String(productsError);
      console.error("❌ Error fetching products from Shopify:", errorMsg);
      throw productsError;
    }

    // Ensure products is always an array
    if (!Array.isArray(products)) {
      console.warn("⚠️  getProducts did not return an array, converting to array. Value:", products);
      products = [];
    }

    console.log(`✓ Successfully fetched ${products.length} products from Shopify`);
    if (Array.isArray(products) && products.length > 0) {
      console.log("First product structure:", JSON.stringify(products[0]));
    }

    // Validate product structure
    const validProducts = products.filter(p => p && typeof p === 'object' && p.id && p.title && p.handle);
    if (validProducts.length < products.length) {
      console.warn(`⚠️  Filtered out ${products.length - validProducts.length} invalid products`);
    }

    const response = {
      success: true,
      products: validProducts,
    };

    console.log(`Sending response: ${validProducts.length} products, success=true, HTTP 200`);
    res.status(200).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error fetching products:", errorMessage);

    // Determine error code and user-facing message
    let code = "PRODUCTS_FETCH_ERROR";
    let userMessage = "Failed to fetch products from Shopify";

    if (
      errorMessage.includes("401") ||
      errorMessage.includes("Unauthorized") ||
      errorMessage.includes("authentication") ||
      errorMessage.includes("credentials")
    ) {
      code = "SHOPIFY_AUTH_ERROR";
      userMessage = "Shopify authentication failed. Invalid or expired access token.";
    } else if (
      errorMessage.includes("not configured") ||
      errorMessage.includes("SHOPIFY_SHOP") ||
      errorMessage.includes("environment variables")
    ) {
      code = "SHOPIFY_NOT_CONFIGURED";
      userMessage = "Shopify credentials are not configured.";
    } else if (
      errorMessage.includes("timeout") ||
      errorMessage.includes("AbortError") ||
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("temporarily unavailable")
    ) {
      code = "SHOPIFY_TIMEOUT";
      userMessage = "Shopify server is temporarily unavailable. Please try again later.";
    } else if (
      errorMessage.includes("not found") ||
      errorMessage.includes("404")
    ) {
      code = "SHOPIFY_STORE_NOT_FOUND";
      userMessage = "Shopify store could not be found. Check your shop name.";
    }

    // Always return 200 OK with error details in response body for consistency
    // This prevents browser/proxy errors and ensures the client gets the error message
    console.log(`Returning HTTP 200 with error code: ${code}`);
    res.status(200).json({
      success: false,
      products: [],
      error: userMessage,
      details: errorMessage,
      code,
    });
  }
}
