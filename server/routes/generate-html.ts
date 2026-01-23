import { RequestHandler } from "express";
import { parseDocument } from "../services/document-parser.js";
import { generateHTML, generateHTMLDocument, type HTMLGeneratorOptions } from "../services/html-generator.js";

export interface GenerateHTMLRequest {
  document: string;
  options?: HTMLGeneratorOptions;
  format?: "fragment" | "document"; // fragment = HTML snippet, document = full HTML
}

export const handleGenerateHTML: RequestHandler = (req, res) => {
  try {
    const body = req.body as GenerateHTMLRequest;

    if (!body || typeof body !== "object") {
      return res.status(400).json({
        error: "Invalid request body",
        details: "Body must be a JSON object",
      });
    }

    const { document, options = {}, format = "fragment" } = body;

    if (!document || typeof document !== "string") {
      return res.status(400).json({
        error: "Missing 'document' field in request body",
        details: "Document must be a non-empty string",
      });
    }

    // Log the imageUrls for debugging
    if (options.imageUrls) {
      console.log("Received imageUrls:", JSON.stringify(options.imageUrls, null, 2));
    }

    // Verify that import dependencies are available
    if (typeof parseDocument !== "function") {
      console.error("CRITICAL: parseDocument is not a function. Import may have failed.");
      return res.status(500).json({
        error: "Server initialization error",
        details: "parseDocument function is unavailable. This is a deployment issue.",
      });
    }

    if (typeof generateHTML !== "function") {
      console.error("CRITICAL: generateHTML is not a function. Import may have failed.");
      return res.status(500).json({
        error: "Server initialization error",
        details: "generateHTML function is unavailable. This is a deployment issue.",
      });
    }

    // Parse document first
    let parsed;
    try {
      console.log("Parsing document with", document.length, "characters");
      parsed = parseDocument(document);
      console.log("Document parsed successfully. Sections found:", parsed.sections.length);
    } catch (parseError) {
      console.error("Error parsing document:", parseError);
      return res.status(400).json({
        error: "Failed to parse document",
        details: parseError instanceof Error ? parseError.message : "Unknown error",
      });
    }

    // Check if document is valid
    if (!parsed.metadata.isValid) {
      return res.status(400).json({
        success: false,
        error: "Document validation failed",
        metadata: parsed.metadata,
        data: parsed,
      });
    }

    // Check if there are images that need to be uploaded
    if (parsed.images.length > 0 && !options.imageUrls) {
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
    let html: string;
    try {
      console.log("Generating HTML in", format, "format");
      if (format === "document") {
        html = generateHTMLDocument(parsed, options);
      } else {
        html = generateHTML(parsed, options);
      }

      // Check if HTML is empty (this would cause the error the user reports)
      if (!html || html.trim().length === 0) {
        console.error("CRITICAL: generateHTML returned empty string or whitespace only");
        console.error("Parsed sections:", parsed.sections.map(s => ({ id: s.id, contentLength: s.rawContent.length })));
        return res.status(500).json({
          error: "HTML generation failed",
          details: "Generated HTML is empty. Check server logs for details.",
          metadata: parsed.metadata,
        });
      }

      console.log("HTML generated successfully. Size:", html.length, "characters");
    } catch (generateError) {
      console.error("Error generating HTML:", generateError);
      return res.status(500).json({
        error: "Failed to generate HTML",
        details: generateError instanceof Error ? generateError.message : "Unknown error",
      });
    }

    res.json({
      success: true,
      html,
      metadata: parsed.metadata,
      images: parsed.images,
      sections: parsed.sections.map((s) => ({
        id: s.id,
        name: s.name,
        wordCount: s.wordCount,
        valid: s.valid,
        warnings: s.warnings,
        images: s.images,
      })),
    });
  } catch (error) {
    console.error("Unexpected error in handleGenerateHTML:", error);
    // Make absolutely sure we return valid JSON
    return res.status(500).json({
      error: "Unexpected server error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};
