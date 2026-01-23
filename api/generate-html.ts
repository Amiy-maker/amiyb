import { VercelRequest, VercelResponse } from '@vercel/node';
import { parseDocument } from '../server/services/document-parser';
import { generateHTML, generateHTMLDocument, type HTMLGeneratorOptions } from '../server/services/html-generator';

export interface GenerateHTMLRequest {
  document: string;
  options?: HTMLGeneratorOptions;
  format?: "fragment" | "document";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Log incoming request
  console.log(`[${new Date().toISOString()}] POST /api/generate-html - Request received`);
  console.log('Request method:', req.method);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.warn(`[${new Date().toISOString()}] Invalid method: ${req.method}`);
    return res.status(405).json({
      error: 'Method Not Allowed',
      details: 'Only POST requests are supported',
    });
  }

  try {
    const body = req.body as GenerateHTMLRequest;

    console.log(`[${new Date().toISOString()}] Processing request body`);

    if (!body || typeof body !== "object") {
      console.error('Invalid request body - not an object');
      return res.status(400).json({
        error: "Invalid request body",
        details: "Body must be a JSON object",
      });
    }

    const { document, options = {}, format = "fragment" } = body;

    console.log(`[${new Date().toISOString()}] Document length: ${document?.length || 0} characters`);
    console.log(`[${new Date().toISOString()}] Format: ${format}`);

    if (!document || typeof document !== "string") {
      console.error('Missing or invalid document field');
      return res.status(400).json({
        error: "Missing 'document' field in request body",
        details: "Document must be a non-empty string",
      });
    }

    // Log the imageUrls for debugging
    if (options.imageUrls) {
      console.log(`[${new Date().toISOString()}] Received imageUrls:`, JSON.stringify(options.imageUrls, null, 2));
    }

    // Verify that import dependencies are available
    if (typeof parseDocument !== "function") {
      console.error(`[${new Date().toISOString()}] CRITICAL: parseDocument is not a function. Import may have failed.`);
      return res.status(500).json({
        error: "Server initialization error",
        details: "parseDocument function is unavailable. This is a deployment issue.",
      });
    }

    if (typeof generateHTML !== "function") {
      console.error(`[${new Date().toISOString()}] CRITICAL: generateHTML is not a function. Import may have failed.`);
      return res.status(500).json({
        error: "Server initialization error",
        details: "generateHTML function is unavailable. This is a deployment issue.",
      });
    }

    // Parse document first
    let parsed;
    try {
      console.log(`[${new Date().toISOString()}] Parsing document...`);
      parsed = parseDocument(document);
      console.log(`[${new Date().toISOString()}] Document parsed successfully. Sections found: ${parsed.sections.length}`);
    } catch (parseError) {
      console.error(`[${new Date().toISOString()}] Error parsing document:`, parseError);
      return res.status(400).json({
        error: "Failed to parse document",
        details: parseError instanceof Error ? parseError.message : "Unknown error",
      });
    }

    // Check if document is valid
    if (!parsed.metadata.isValid) {
      console.warn(`[${new Date().toISOString()}] Document validation failed. Metadata:`, parsed.metadata);
      return res.status(400).json({
        success: false,
        error: "Document validation failed",
        metadata: parsed.metadata,
        data: parsed,
      });
    }

    // Check if there are images that need to be uploaded
    if (parsed.images.length > 0 && !options.imageUrls) {
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
    let html: string;
    try {
      console.log(`[${new Date().toISOString()}] Generating HTML in ${format} format...`);
      if (format === "document") {
        html = generateHTMLDocument(parsed, options);
      } else {
        html = generateHTML(parsed, options);
      }

      // Check if HTML is empty (this would cause issues)
      if (!html || html.trim().length === 0) {
        console.error(`[${new Date().toISOString()}] CRITICAL: generateHTML returned empty string or whitespace only`);
        console.error(`[${new Date().toISOString()}] Parsed sections:`, parsed.sections.map(s => ({ id: s.id, contentLength: s.rawContent.length })));
        return res.status(500).json({
          error: "HTML generation failed",
          details: "Generated HTML is empty. Check server logs for details.",
          metadata: parsed.metadata,
        });
      }

      console.log(`[${new Date().toISOString()}] HTML generated successfully. Size: ${html.length} characters`);
    } catch (generateError) {
      console.error(`[${new Date().toISOString()}] Error generating HTML:`, generateError);
      return res.status(500).json({
        error: "Failed to generate HTML",
        details: generateError instanceof Error ? generateError.message : "Unknown error",
      });
    }

    console.log(`[${new Date().toISOString()}] Request completed successfully`);
    res.status(200).json({
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
    console.error(`[${new Date().toISOString()}] Unexpected error in handler:`, error);
    return res.status(500).json({
      error: "Unexpected server error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
