/**
 * SECTION_RULES: Core configuration for blog section definitions
 * 
 * Each section defines:
 * - HTML wrapper tag(s)
 * - Image handling rules
 * - Word limits and validation
 * - SEO requirements (H1, H2, etc.)
 * - Schema markup (for FAQs, structured data)
 * 
 * Non-technical users write {sectionX} markers,
 * this config transforms them into semantic HTML.
 */

export interface ImageConfig {
  position: "before" | "after" | "none";
  class?: string;
  alt?: string;
  required?: boolean;
}

export interface SectionRule {
  id: string;
  name: string;
  description: string;
  wrapper: string;
  itemWrapper?: string; // For list-based sections (ul > li, etc.)
  image?: ImageConfig;
  maxWords?: number;
  minWords?: number;
  schema?: "faq" | "article" | "breadcrumb" | "none";
  required?: boolean;
  order?: number; // For validation: sections should appear in order
  validationRules?: {
    minItems?: number;
    maxItems?: number;
    allowLineBreaks?: boolean;
  };
}

export const SECTION_RULES: Record<string, SectionRule> = {
  section1: {
    id: "section1",
    name: "Hero/Title",
    description: "Main heading (H1) with optional featured image",
    wrapper: "h1",
    image: {
      position: "after",
      alt: "Blog post featured image",
      required: false,
    },
    schema: "article",
    required: true,
    order: 1,
  },

  section2: {
    id: "section2",
    name: "Intro Paragraph",
    description: "Lead paragraph that hooks the reader",
    wrapper: "p",
    maxWords: 180,
    minWords: 50,
    required: true,
    order: 2,
    validationRules: {
      allowLineBreaks: false,
    },
  },

  section3: {
    id: "section3",
    name: "Table of Contents",
    description: "Key topics covered (bullet list)",
    wrapper: "ul",
    itemWrapper: "li",
    required: true,
    order: 3,
  },

  section4: {
    id: "section4",
    name: "Key Benefits/Overview",
    description: "Benefits or overview (bullet list with descriptions)",
    wrapper: "ul",
    itemWrapper: "li",
    required: true,
    order: 4,
  },

  section5: {
    id: "section5",
    name: "Section Body",
    description: "Main content with subheadings (H2 format)",
    wrapper: "article",
    image: {
      position: "after",
      class: "inline-image w-full rounded-lg my-4",
      alt: "Supporting image",
      required: false,
    },
    maxWords: 800,
    minWords: 300,
    required: true,
    order: 5,
  },

  section6: {
    id: "section6",
    name: "Statistics/Facts",
    description: "Highlighted callout with stats or important fact",
    wrapper: "blockquote",
    required: false,
    order: 6,
  },

  section7: {
    id: "section7",
    name: "Comparison",
    description: "Feature comparison or side-by-side content",
    wrapper: "table",
    itemWrapper: "tr",
    required: false,
    order: 7,
  },

  section8: {
    id: "section8",
    name: "Expert Quote",
    description: "Attributed quote or testimonial",
    wrapper: "blockquote",
    required: false,
    order: 8,
  },

  section9: {
    id: "section9",
    name: "How-To Steps",
    description: "Numbered steps or instructions",
    wrapper: "ol",
    itemWrapper: "li",
    required: false,
    order: 9,
  },

  section10: {
    id: "section10",
    name: "Internal Links",
    description: "Related content or cross-links (as list)",
    wrapper: "ul",
    itemWrapper: "li",
    required: false,
    order: 10,
  },

  section11: {
    id: "section11",
    name: "FAQs",
    description: "Frequently asked questions with answers",
    wrapper: "div",
    schema: "faq",
    required: false,
    order: 11,
    validationRules: {
      minItems: 4,
      maxItems: 12,
    },
  },

  section12: {
    id: "section12",
    name: "CTA/Conclusion",
    description: "Call-to-action or closing paragraph",
    wrapper: "p",
    maxWords: 150,
    minWords: 30,
    required: true,
    order: 12,
    validationRules: {
      allowLineBreaks: false,
    },
  },
};

/**
 * Helper: Get rule by section ID
 */
export function getSection(sectionId: string): SectionRule | null {
  return SECTION_RULES[sectionId] || null;
}

/**
 * Helper: Get all required sections
 */
export function getRequiredSections(): SectionRule[] {
  return Object.values(SECTION_RULES)
    .filter((s) => s.required)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Helper: Get sections by order
 */
export function getSectionsByOrder(): SectionRule[] {
  return Object.values(SECTION_RULES).sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Helper: Validate section exists and get its rule
 */
export function validateSection(sectionId: string): { valid: boolean; rule?: SectionRule; error?: string } {
  const rule = getSection(sectionId);
  if (!rule) {
    return { valid: false, error: `Unknown section: ${sectionId}` };
  }
  return { valid: true, rule };
}
