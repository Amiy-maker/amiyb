import { RequestHandler } from "express";
import { getShopifyClient } from "../services/shopify-client.js";

export const handleValidateShopify: RequestHandler = async (req, res) => {
  try {
    console.log("GET /api/validate-shopify request received");
    console.log("SHOPIFY_SHOP:", process.env.SHOPIFY_SHOP ? "SET" : "NOT SET");
    console.log("SHOPIFY_ADMIN_ACCESS_TOKEN:", process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ? "SET (length: " + process.env.SHOPIFY_ADMIN_ACCESS_TOKEN.length + ")" : "NOT SET");
    console.log("SHOPIFY_API_VERSION:", process.env.SHOPIFY_API_VERSION || "2025-01 (default)");

    const shopifyClient = getShopifyClient();

    // Validate Shopify connection with detailed logging
    console.log("Attempting to validate Shopify connection...");
    let isConnected = false;
    let connectionError: Error | null = null;

    try {
      isConnected = await shopifyClient.validateConnection();
      console.log("Shopify connection validation result:", isConnected);
    } catch (err) {
      connectionError = err instanceof Error ? err : new Error(String(err));
      console.error("Connection validation threw error:", connectionError.message);
    }

    if (!isConnected) {
      const errorDetails = connectionError?.message || "Shopify credentials are not properly configured.";
      console.error("Shopify connection failed. Details:", errorDetails);

      return res.status(503).json({
        success: false,
        isConnected: false,
        error: "Cannot connect to Shopify",
        details: errorDetails,
        suggestion: "Please verify that SHOPIFY_SHOP and SHOPIFY_ADMIN_ACCESS_TOKEN are correctly set and that your Shopify API access token is still valid.",
      });
    }

    // Try to get blog ID to further validate
    try {
      console.log("Attempting to retrieve blog ID...");
      const blogId = await shopifyClient.getBlogId();
      console.log(`Successfully validated Shopify connection. Blog ID: ${blogId}`);
      return res.json({
        success: true,
        isConnected: true,
        message: "Shopify is properly configured",
        blogId,
      });
    } catch (blogError) {
      const blogErrorMessage = blogError instanceof Error ? blogError.message : "Cannot retrieve blog information";
      console.error("Error getting blog ID:", blogErrorMessage);

      return res.status(400).json({
        success: false,
        isConnected: true,
        error: "Shopify is connected but no blog found",
        details: blogErrorMessage,
        suggestion: "Please ensure your Shopify store has at least one blog and that your access token has blog permissions.",
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error validating Shopify:", errorMessage);
    console.error("Full error object:", error);

    if (errorMessage.includes("not configured")) {
      return res.status(503).json({
        success: false,
        isConnected: false,
        error: "Shopify is not configured",
        details: "Missing Shopify credentials",
        suggestion: "Please set SHOPIFY_SHOP and SHOPIFY_ADMIN_ACCESS_TOKEN environment variables.",
      });
    }

    res.status(500).json({
      success: false,
      isConnected: false,
      error: "Failed to validate Shopify connection",
      details: errorMessage,
    });
  }
};
