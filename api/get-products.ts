import { VercelRequest, VercelResponse } from '@vercel/node';
import { getShopifyClient } from './lib/shopify-client.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log("GET /api/products request received");
    const limit = parseInt(req.query.limit as string) || 250;
    console.log(`Fetching products with limit: ${limit}`);

    let shopifyClient;
    try {
      shopifyClient = getShopifyClient();
    } catch (clientError) {
      console.error("Failed to initialize Shopify client:", clientError instanceof Error ? clientError.message : String(clientError));
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
    const products = await shopifyClient.getProducts(limit);
    console.log(`Successfully fetched ${products.length} products`);

    res.json({
      success: true,
      products,
      count: products.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching products:", errorMessage);
    console.error("Full error object:", error);

    // Determine error status and provide helpful message
    let status = 500;
    let code = "PRODUCTS_FETCH_ERROR";
    let userMessage = "Failed to fetch products from Shopify";

    if (
      errorMessage.includes("401") ||
      errorMessage.includes("Unauthorized") ||
      errorMessage.includes("authentication") ||
      errorMessage.includes("credentials")
    ) {
      status = 401;
      code = "SHOPIFY_AUTH_ERROR";
      userMessage = "Shopify authentication failed. Invalid or expired access token.";
    } else if (
      errorMessage.includes("not configured") ||
      errorMessage.includes("SHOPIFY_SHOP") ||
      errorMessage.includes("environment variables")
    ) {
      status = 503;
      code = "SHOPIFY_NOT_CONFIGURED";
      userMessage = "Shopify credentials are not configured.";
    } else if (
      errorMessage.includes("timeout") ||
      errorMessage.includes("AbortError") ||
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("temporarily unavailable")
    ) {
      status = 503;
      code = "SHOPIFY_TIMEOUT";
      userMessage = "Shopify server is temporarily unavailable. Please try again later.";
    } else if (
      errorMessage.includes("not found") ||
      errorMessage.includes("404")
    ) {
      status = 404;
      code = "SHOPIFY_STORE_NOT_FOUND";
      userMessage = "Shopify store could not be found. Check your shop name.";
    }

    res.status(status).json({
      success: false,
      error: userMessage,
      details: errorMessage,
      code,
    });
  }
}
