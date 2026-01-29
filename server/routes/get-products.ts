import { RequestHandler } from "express";
import { getShopifyClient } from "../services/shopify-client.js";

export const handleGetProducts: RequestHandler = async (req, res) => {
  try {
    console.log("GET /api/products request received");
    const limit = parseInt(req.query.limit as string) || 50;
    console.log(`Fetching products with limit: ${limit}`);

    const shopifyClient = getShopifyClient();
    console.log("Shopify client initialized");

    const products = await shopifyClient.getProducts(limit);
    console.log(`Successfully fetched ${products.length} products`);

    res.json({
      success: true,
      products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error fetching products:", error instanceof Error ? error.message : String(error));
    console.error("Full error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const status = errorMessage.includes("401") || errorMessage.includes("unauthorized") ? 401 : 500;

    res.status(status).json({
      success: false,
      error: "Failed to fetch products",
      details: errorMessage,
    });
  }
};
