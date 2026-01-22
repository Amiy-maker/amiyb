import { RequestHandler } from "express";
import { parseDocument } from "../services/document-parser.js";

export interface ParseDocumentRequest {
  document: string;
}

export const handleParseDocument: RequestHandler = (req, res) => {
  try {
    const body = req.body as ParseDocumentRequest;

    if (!body || !body.document) {
      return res.status(400).json({
        error: "Missing 'document' field in request body",
        details: "Document must be a non-empty string",
      });
    }

    let parsed;
    try {
      parsed = parseDocument(body.document);
    } catch (parseError) {
      console.error("Error parsing document:", parseError);
      return res.status(500).json({
        error: "Failed to parse document",
        details: parseError instanceof Error ? parseError.message : String(parseError),
      });
    }

    res.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error("Unexpected error in handleParseDocument:", error);
    res.status(500).json({
      error: "Failed to parse document",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};
