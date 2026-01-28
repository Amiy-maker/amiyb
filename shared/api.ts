/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Blog Generator API Types
 */

export interface ParseDocumentRequest {
  document: string;
}

export interface ParseDocumentResponse {
  success: boolean;
  data: any;
}

export interface ImageReference {
  keyword: string;
  sectionId: string;
  position?: number;
}

export interface GenerateHTMLRequest {
  document: string;
  options?: {
    includeSchema?: boolean;
    includeImages?: boolean;
    blogTitle?: string;
    blogDate?: string;
    authorName?: string;
    imageUrls?: Record<string, string>; // Maps image keyword to Shopify URL
    featuredImageUrl?: string; // Featured/hero image URL
  };
  format?: "fragment" | "document";
}

export interface GenerateHTMLResponse {
  success?: boolean;
  html?: string;
  requiresImageUpload?: boolean;
  images?: ImageReference[];
  metadata?: {
    totalWords: number;
    totalSections: number;
    isValid: boolean;
    missingRequired: string[];
    warnings: string[];
  };
  sections?: Array<{
    id: string;
    name: string;
    wordCount: number;
    valid: boolean;
    warnings: string[];
    images?: ImageReference[];
  }>;
  error?: string;
  message?: string;
}
