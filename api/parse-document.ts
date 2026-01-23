import { VercelRequest, VercelResponse } from '@vercel/node';
import { parseDocument } from '../server/services/document-parser';

export interface ParseDocumentRequest {
  document: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log(`[${new Date().toISOString()}] POST /api/parse-document - Request received`);
  console.log('Request method:', req.method);

  if (req.method !== 'POST') {
    console.warn(`[${new Date().toISOString()}] Invalid method: ${req.method}`);
    return res.status(405).json({
      error: 'Method Not Allowed',
      details: 'Only POST requests are supported',
    });
  }

  try {
    const body = req.body as ParseDocumentRequest;

    console.log(`[${new Date().toISOString()}] Document length: ${body?.document?.length || 0} characters`);

    if (!body || !body.document) {
      console.error('Missing document field');
      return res.status(400).json({
        error: "Missing 'document' field in request body",
        details: "Document must be a non-empty string",
      });
    }

    let parsed;
    try {
      console.log(`[${new Date().toISOString()}] Parsing document...`);
      parsed = parseDocument(body.document);
      console.log(`[${new Date().toISOString()}] Document parsed successfully. Sections: ${parsed.sections.length}`);
    } catch (parseError) {
      console.error(`[${new Date().toISOString()}] Error parsing document:`, parseError);
      return res.status(500).json({
        error: "Failed to parse document",
        details: parseError instanceof Error ? parseError.message : String(parseError),
      });
    }

    console.log(`[${new Date().toISOString()}] Request completed successfully`);
    res.status(200).json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Unexpected error in handler:`, error);
    return res.status(500).json({
      error: "Failed to parse document",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
