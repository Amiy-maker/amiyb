import { RequestHandler } from "express";
import { getShopifyClient } from "../services/shopify-client.js";

export const handleValidateShopify: RequestHandler = async (req, res) => {
  try {
    console.log("GET /api/validate-shopify request received");

    const shopifyClient = getShopifyClient();

    // Validate Shopify connection
    const isConnected = await shopifyClient.validateConnection();

    if (!isConnected) {
      return res.status(503).json({
        success: false,
        isConnected: false,
        error: "Cannot connect to Shopify",
        details: "Shopify credentials are not properly configured.",
        suggestion: "Please check that SHOPIFY_SHOP and SHOPIFY_ADMIN_ACCESS_TOKEN environment variables are set correctly.",
      });
    }

    // Try to get blog ID to further validate
    try {
      const blogId = await shopifyClient.getBlogId();
      console.log(`Successfully validated Shopify connection. Blog ID: ${blogId}`);
      return res.json({
        success: true,
        isConnected: true,
        message: "Shopify is properly configured",
        blogId,
      });
    } catch (blogError) {
      console.error("Error getting blog ID:", blogError);
      return res.status(400).json({
        success: false,
        isConnected: true,
        error: "Shopify is connected but no blog found",
        details: blogError instanceof Error ? blogError.message : "Cannot retrieve blog information",
        suggestion: "Please ensure your Shopify store has at least one blog.",
      });
    }
  } catch (error) {
    console.error("Error validating Shopify:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

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
