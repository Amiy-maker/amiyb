/**
 * DocumentParser: Reads a document with {sectionX} markers
 * and extracts structured content for each section.
 */

import { SECTION_RULES, SectionRule } from "../../shared/section-rules.js";

export interface ImageReference {
  keyword: string;
  sectionId: string;
  position: number; // Position in section
  url?: string; // Shopify image URL after upload
}

export interface ParsedSection {
  id: string;
  name: string;
  rawContent: string;
  lines: string[];
  wordCount: number;
  rule: SectionRule;
  valid: boolean;
  warnings: string[];
  images?: ImageReference[]; // Images found in this section
}

export interface ParsedDocument {
  sections: ParsedSection[];
  images: ImageReference[]; // All images found in document
  metadata: {
    totalWords: number;
    totalSections: number;
    isValid: boolean;
    missingRequired: string[];
    warnings: string[];
  };
}

/**
 * Parse a document and extract sections + images
 */
export function parseDocument(documentText: string): ParsedDocument {
  const sections: ParsedSection[] = [];
  const allImages: ImageReference[] = [];
  const warnings: string[] = [];
  const missingRequired: string[] = [];

  // Regex to match {sectionX} markers
  const sectionRegex = /\{(section\d+)\}/gi;
  const matches = Array.from(documentText.matchAll(sectionRegex));

  if (matches.length === 0) {
    return {
      sections: [],
      images: [],
      metadata: {
        totalWords: 0,
        totalSections: 0,
        isValid: false,
        missingRequired: [],
        warnings: ["No sections found. Document should contain {section1}, {section2}, etc."],
      },
    };
  }

  // Extract content for each section
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const sectionId = match[1].toLowerCase();
    const startIndex = match.index! + match[0].length;

    // Find end of section (next marker or end of document)
    const nextMatch = matches[i + 1];
    const endIndex = nextMatch ? nextMatch.index : documentText.length;

    // Extract raw content
    const rawContent = documentText
      .substring(startIndex, endIndex)
      .trim();

    // Get rule for this section
    const rule = SECTION_RULES[sectionId];
    if (!rule) {
      warnings.push(`Unknown section: ${sectionId}`);
      continue;
    }

    // Extract images from this section
    const sectionImages = extractImageReferences(rawContent, sectionId);
    if (sectionImages.length > 0) {
      console.log(`Found ${sectionImages.length} image(s) in ${sectionId}:`, sectionImages);
    }
    allImages.push(...sectionImages);

    // Remove image markup from content
    const cleanContent = rawContent.replace(/\{img\}\s*([^\n\r{}]+)/gi, "").trim();

    // Parse content
    const lines = cleanContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const wordCount = countWords(cleanContent);

    // Validate section
    const sectionWarnings = validateSection(sectionId, cleanContent, wordCount, rule);

    sections.push({
      id: sectionId,
      name: rule.name,
      rawContent: cleanContent,
      lines,
      wordCount,
      rule,
      valid: sectionWarnings.length === 0,
      warnings: sectionWarnings,
      images: sectionImages,
    });
  }

  // Check for required sections
  const providedSections = sections.map((s) => s.id);
  for (const [sectionId, rule] of Object.entries(SECTION_RULES)) {
    if (rule.required && !providedSections.includes(sectionId)) {
      missingRequired.push(`${sectionId}: ${rule.name}`);
    }
  }

  // Calculate totals
  const totalWords = sections.reduce((sum, s) => sum + s.wordCount, 0);
  const allWarnings = [...warnings, ...sections.flatMap((s) => s.warnings)];

  return {
    sections,
    images: allImages,
    metadata: {
      totalWords,
      totalSections: sections.length,
      isValid: missingRequired.length === 0 && allWarnings.length === 0,
      missingRequired,
      warnings: allWarnings,
    },
  };
}

/**
 * Validate a single section against its rules
 */
function validateSection(
  sectionId: string,
  content: string,
  wordCount: number,
  rule: SectionRule
): string[] {
  const warnings: string[] = [];

  // Check word limits
  if (rule.maxWords && wordCount > rule.maxWords) {
    warnings.push(
      `${sectionId}: Exceeds maximum word count (${wordCount}/${rule.maxWords})`
    );
  }

  if (rule.minWords && wordCount < rule.minWords) {
    warnings.push(
      `${sectionId}: Below minimum word count (${wordCount}/${rule.minWords})`
    );
  }

  // Check for multiple H1s (only section1 should have H1)
  if (sectionId !== "section1" && content.includes("<h1")) {
    warnings.push(`${sectionId}: Contains H1 tag (only section1 should have H1)`);
  }

  // For list-based sections, check item count
  if (rule.validationRules) {
    const lines = content.split("\n").filter((line) => line.trim().length > 0);

    if (rule.validationRules.minItems && lines.length < rule.validationRules.minItems) {
      warnings.push(
        `${sectionId}: Too few items (${lines.length}/${rule.validationRules.minItems})`
      );
    }

    if (rule.validationRules.maxItems && lines.length > rule.validationRules.maxItems) {
      warnings.push(
        `${sectionId}: Too many items (${lines.length}/${rule.validationRules.maxItems})`
      );
    }
  }

  return warnings;
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Extract image references in format {img} <keyword> from section content
 * Supports variations: {img} keyword, {img}keyword, {img} keyword here, etc.
 */
function extractImageReferences(content: string, sectionId: string): ImageReference[] {
  const imageRegex = /\{img\}\s*([^\n\r{}]+)/gi;
  const images: ImageReference[] = [];
  let match;
  let position = 0;

  while ((match = imageRegex.exec(content)) !== null) {
    const keyword = match[1].trim();
    // Only add if keyword is not empty and doesn't contain just whitespace
    if (keyword && keyword.length > 0) {
      images.push({
        keyword,
        sectionId,
        position,
      });
      position++;
    }
  }

  return images;
}

/**
 * Extract plain text content for a section
 */
export function getSectionContent(parsed: ParsedDocument, sectionId: string): string {
  const section = parsed.sections.find((s) => s.id === sectionId);
  return section ? section.rawContent : "";
}

/**
 * Check if document has all required sections in correct order
 */
export function validateSectionOrder(sections: ParsedSection[]): { valid: boolean; error?: string } {
  const orders = sections
    .map((s) => s.rule.order || 0)
    .sort((a, b) => a - b);

  // Check if sections are in increasing order
  for (let i = 1; i < orders.length; i++) {
    if (orders[i] < orders[i - 1]) {
      return {
        valid: false,
        error: "Sections appear out of order. Please arrange them in the correct sequence.",
      };
    }
  }

  return { valid: true };
}
