/**
 * HTMLGenerator: Converts ParsedDocument sections into semantic HTML
 * using SECTION_RULES definitions.
 * 
 * Handles:
 * - Proper HTML tags based on section rules
 * - Image placement
 * - Schema markup (FAQs, article)
 * - Semantic structure (H2 for subheadings, etc.)
 */

import { ParsedDocument, ParsedSection } from "./document-parser.js";
import { SECTION_RULES } from "../../shared/section-rules.js";

export interface HTMLGeneratorOptions {
  includeSchema?: boolean;
  includeImages?: boolean;
  blogTitle?: string;
  blogDate?: string;
  authorName?: string;
  imageUrls?: Record<string, string>; // Maps image keyword to Shopify URL
  featuredImageUrl?: string; // Featured/hero image URL
}

/**
 * Generate complete HTML blog post from parsed document
 */
export function generateHTML(
  parsed: ParsedDocument,
  options: HTMLGeneratorOptions = {}
): string {
  const {
    includeSchema = true,
    includeImages = true,
    blogTitle,
    blogDate,
    authorName,
    imageUrls = {},
    featuredImageUrl,
  } = options;

  const sections: string[] = [];

  // Add schema markup if enabled
  if (includeSchema) {
    const schema = generateArticleSchema(blogTitle, blogDate, authorName);
    console.log("Generated schema markup:", schema.length, "characters");
    sections.push(schema);
  }

  // Add featured image if provided
  if (includeImages && featuredImageUrl) {
    console.log("Adding featured image to HTML:", featuredImageUrl);
    // Use inline styles for maximum Shopify compatibility
    // Featured image is styled with consistent aspect ratio and shadow
    const featuredImageHtml = `<img src="${featuredImageUrl}" alt="Featured image" style="width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; margin: 0 0 40px 0; border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); display: block;" />`;
    sections.push(featuredImageHtml);
  } else {
    console.log("Featured image not included. includeImages:", includeImages, "featuredImageUrl:", featuredImageUrl);
  }

  // Generate HTML for each section
  for (const section of parsed.sections) {
    const html = generateSectionHTML(section, includeImages, imageUrls);
    console.log(`Section ${section.id} (${section.name}): generated ${html.length} characters`);
    if (html) {
      sections.push(html);
    }
  }

  const result = sections.join("\n\n");
  console.log("Total HTML output:", result.length, "characters from", sections.length, "sections");
  return result;
}

/**
 * Generate HTML for a single section
 */
function generateSectionHTML(
  section: ParsedSection,
  includeImages: boolean,
  imageUrls: Record<string, string>
): string {
  const { id, rawContent, rule, lines } = section;

  // Verify section data
  if (!id) {
    console.warn("Section has no ID");
    return "";
  }
  if (!rawContent && lines.length === 0) {
    console.warn(`Section ${id} has no content`);
    return "";
  }

  switch (id) {
    case "section1":
      return generateHero(rawContent, rule, includeImages, section, imageUrls);

    case "section2":
      return `<p style="font-size: 1.05em; line-height: 1.8; margin-bottom: 15px; margin-top: 0; color: #3a3a3a;">${textWithLinksToHTML(rawContent)}</p>`;

    case "section3":
      return generateList(lines, "ul", "Table of Contents");

    case "section4":
      return generateList(lines, "ul", "Key Benefits");

    case "section5":
      return generateSectionBody(rawContent, includeImages, section, imageUrls);

    case "section6":
      return `<blockquote style="border-left: 5px solid #d4a574; padding: 25px 30px; margin: 20px 0; background-color: #fef9f5; font-style: italic; font-size: 1.15em; color: #5a5a5a; line-height: 1.8;">${textWithLinksToHTML(rawContent)}</blockquote>`;

    case "section7":
      return generateComparisonTable(lines);

    case "section8":
      return `<blockquote style="border-left: 5px solid #d4a574; padding: 25px 30px; margin: 20px 0; background-color: #fef9f5; font-style: italic; font-size: 1.15em; color: #5a5a5a; line-height: 1.8;">${textWithLinksToHTML(rawContent)}</blockquote>`;

    case "section9":
      return generateList(lines, "ol", "Steps");

    case "section10":
      return generateList(lines, "ul", "Related Resources");

    case "section11":
      return generateFAQSection(lines);

    case "section12":
      return `<p style="font-size: 1.05em; line-height: 1.8; margin-bottom: 15px; margin-top: 0; color: #3a3a3a;">${textWithLinksToHTML(rawContent)}</p>`;

    default:
      console.warn(`Unknown section ID: ${id}. Valid sections are section1-section12.`);
      return "";
  }
}

/**
 * Generate hero section (H1 + image)
 */
function generateHero(
  content: string,
  rule: any,
  includeImages: boolean,
  section: ParsedSection,
  imageUrls: Record<string, string>
): string {
  const h1 = `<h1 style="font-size: 2.5em; font-weight: 700; margin-bottom: 20px; margin-top: 0; line-height: 1.2; color: #1a1a1a; letter-spacing: -0.5px;">${textWithLinksToHTML(content)}</h1>`;

  if (includeImages && rule.image?.position === "after" && section.images && section.images.length > 0) {
    const image = section.images[0];
    console.log(`Looking for image keyword: "${image.keyword}"`);
    console.log(`Available imageUrls keys: ${Object.keys(imageUrls).join(", ")}`);
    const imageUrl = imageUrls[image.keyword];

    // Only include image if URL is available (don't use placeholders)
    if (imageUrl) {
      console.log(`Resolved image URL: ${imageUrl}`);
      const imgTag = `<img src="${imageUrl}" alt="${image.keyword}" style="width: 100%; height: auto; display: block; margin: 25px auto 30px auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);" />`;
      return `${h1}\n${imgTag}`;
    } else {
      console.log(`Image URL not available for keyword: ${image.keyword}`);
    }
  }

  return h1;
}

/**
 * Generate list (UL or OL)
 */
function generateList(
  lines: string[],
  listType: "ul" | "ol",
  title?: string
): string {
  const tag = listType === "ul" ? "ul" : "ol";
  const items = lines.map((line) => `<li style="margin-bottom: 10px; font-size: 1.05em; color: #3a3a3a;">${textWithLinksToHTML(line)}</li>`).join("\n");

  let html = `<${tag} style="margin: 15px 0 15px 35px; line-height: 1.9;">\n${items}\n</${tag}>`;

  if (title) {
    html = `<h2 style="font-size: 1.8em; font-weight: 600; margin-top: 25px; margin-bottom: 15px; line-height: 1.3; color: #1a1a1a; border-bottom: 3px solid #e8e8e8; padding-bottom: 12px;">${title}</h2>\n${html}`;
  }

  return html;
}

/**
 * Generate section body with subheadings (H2)
 */
function generateSectionBody(
  content: string,
  includeImages: boolean,
  section: ParsedSection,
  imageUrls: Record<string, string>
): string {
  // Split by double newlines to detect subheadings
  const paragraphs = content.split(/\n\n+/).map((p) => p.trim());
  const sectionImages = section.images || [];
  let imageIndex = 0;

  const html = paragraphs
    .map((para, idx) => {
      // First line of paragraph might be a subheading
      const lines = para.split("\n");
      let result = "";

      // Check if first line looks like a subheading (short, ends with colon or all caps)
      if (
        lines[0].length < 60 &&
        (lines[0].endsWith(":") || lines[0] === lines[0].toUpperCase())
      ) {
        result += `<h2 style="font-size: 1.8em; font-weight: 600; margin-top: 25px; margin-bottom: 15px; line-height: 1.3; color: #1a1a1a; border-bottom: 3px solid #e8e8e8; padding-bottom: 12px;">${textWithLinksToHTML(lines[0])}</h2>\n`;
        lines.shift();
      }

      // Rest of content
      const bodyText = lines.join("\n").trim();
      if (bodyText) {
        result += `<p style="font-size: 1.05em; line-height: 1.8; margin-bottom: 15px; margin-top: 0; color: #3a3a3a;">${textWithLinksToHTML(bodyText)}</p>`;
      }

      // Add image if enabled and available
      if (includeImages && idx % 2 === 1 && imageIndex < sectionImages.length) {
        const image = sectionImages[imageIndex];
        console.log(`Looking for image keyword: "${image.keyword}" in section`);
        const imageUrl = imageUrls[image.keyword];

        // Only include image if URL is available (don't use placeholders)
        if (imageUrl) {
          console.log(`Resolved image URL for section: ${imageUrl}`);
          result += `\n<img src="${imageUrl}" alt="${image.keyword}" style="width: 100%; height: auto; display: block; margin: 30px auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);" />`;
        } else {
          console.log(`Image URL not available for keyword: ${image.keyword}`);
        }
        imageIndex++;
      }

      return result;
    })
    .join("\n\n");

  return html;
}

/**
 * Generate comparison table
 */
function generateComparisonTable(lines: string[]): string {
  if (lines.length < 2) {
    return "<p>No comparison data provided</p>";
  }

  // Assume first line is headers, rest are data
  const headers = lines[0].split("|").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => line.split("|").map((cell) => cell.trim()));

  let html = '<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 1em; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); border-radius: 6px; overflow: hidden;">\n';

  // Header row
  html += '<thead style="background: linear-gradient(135deg, #f5f5f5 0%, #ebebeb 100%);"><tr>';
  for (const header of headers) {
    html += `<th style="padding: 12px 15px; text-align: left; font-weight: 600; color: #1a1a1a; border-bottom: 2px solid #d0d0d0; font-size: 0.95em; text-transform: uppercase; letter-spacing: 0.5px;">${textWithLinksToHTML(header)}</th>`;
  }
  html += "</tr></thead>\n";

  // Data rows
  html += "<tbody>";
  for (const row of rows) {
    html += "<tr>";
    for (const cell of row) {
      html += `<td style="padding: 12px 15px; border-bottom: 1px solid #e8e8e8; color: #3a3a3a;">${textWithLinksToHTML(cell)}</td>`;
    }
    html += "</tr>";
  }
  html += "</tbody>\n</table>";

  return html;
}

/**
 * Generate FAQ section with schema markup
 * Handles flexible formatting with various spacing patterns
 */
function generateFAQSection(lines: string[]): string {
  const faqs: Array<{ question: string; answer: string }> = [];

  // First, try the standard format with Q: and A: prefixes
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match Q: or Q followed by question text (handles Q1:, Q 1:, Q:, etc.)
    if (line.match(/^Q\d*:?\s+/i)) {
      const question = line.replace(/^Q\d*:?\s+/i, "").trim();
      if (!question) continue;

      let answer = "";
      let j = i + 1;

      // Look for the answer - could be on next line, or skip some lines
      while (j < lines.length) {
        const nextLine = lines[j];

        // Stop if we hit the next question
        if (nextLine.match(/^Q\d*:?\s+/i)) {
          break;
        }

        // Found answer line
        if (nextLine.match(/^A\d*:?\s+/i)) {
          answer = nextLine.replace(/^A\d*:?\s+/i, "").trim();
          break;
        }

        // Keep looking if it's just a non-Q/A line
        j++;
      }

      if (question && answer) {
        faqs.push({ question, answer });
      }
    }
  }

  // If standard format didn't work, try pattern matching on the raw content
  // by joining lines and looking for Q/A patterns
  if (faqs.length === 0) {
    const fullText = lines.join(" ");

    // Match pattern: Q...?: ...text... A...?: ...text... (multiple times)
    const qPattern = /Q\d*:?\s*([^QA]+?)(?=A\d*:?\s*)/gi;
    const aPattern = /A\d*:?\s*([^QA]+?)(?=Q\d*:?\s*|$)/gi;

    let qMatch;
    let aMatches = [...fullText.matchAll(aPattern)];
    let qIndex = 0;

    while ((qMatch = qPattern.exec(fullText)) !== null) {
      const question = qMatch[1].trim();
      const answer = aMatches[qIndex] ? aMatches[qIndex][1].trim() : "";

      if (question && answer) {
        faqs.push({ question, answer });
      }
      qIndex++;
    }
  }

  if (faqs.length === 0) {
    return "<p>No FAQs provided</p>";
  }

  let html = '<h2>Frequently Asked Questions</h2>\n';
  html += '<div>\n';

  for (const faq of faqs) {
    html += `
<div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px; background-color: #f9f9f9;">
  <p style="margin: 0 0 10px 0; font-weight: bold;"><strong>Q: ${escapeHTML(faq.question)}</strong></p>
  <p style="margin: 0; color: #555;">A: ${escapeHTML(faq.answer)}</p>
</div>
`;
  }

  html += "</div>";

  return html;
}

/**
 * Generate JSON-LD schema for article
 */
function generateArticleSchema(
  title?: string,
  datePublished?: string,
  author?: string
): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title || "Blog Post",
    datePublished: datePublished || new Date().toISOString().split("T")[0],
    author: {
      "@type": "Person",
      name: author || "Author",
    },
  };

  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

/**
 * Generate FAQ schema markup
 */
function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Convert text with markdown links to HTML
 * Handles format: [link text](url)
 * Includes inline styles for maximum compatibility
 */
function textWithLinksToHTML(text: string): string {
  // First, escape HTML special characters except for brackets and parentheses we'll use for links
  let escaped = text.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Then convert markdown links to HTML links with inline styles
  escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
    // Validate URL to prevent XSS
    if (isValidURL(url)) {
      return `<a href="${escapeHTML(url)}" style="color: #2563eb; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 2px;">${linkText}</a>`;
    }
    return match; // Return original if URL is invalid
  });

  return escaped;
}

/**
 * Check if a URL is valid and safe
 */
function isValidURL(url: string): boolean {
  // Reject dangerous protocols
  if (url.startsWith("javascript:") || url.startsWith("data:") || url.startsWith("vbscript:")) {
    return false;
  }

  // Allow http, https, mailto, and relative URLs
  if (url.startsWith("http://") || url.startsWith("https://") ||
      url.startsWith("mailto:") || url.startsWith("/") ||
      url.startsWith("#") || url.startsWith("?")) {
    return true;
  }

  // Allow relative URLs (no protocol)
  if (!url.includes("://")) {
    return true;
  }

  return false;
}

/**
 * Generate HTML with inline styles (for Shopify/external publishing)
 * Wraps content in a div with core styles for Shopify compatibility
 */
export function generateStyledHTML(
  parsed: ParsedDocument,
  options: HTMLGeneratorOptions = {}
): string {
  const content = generateHTML(parsed, options);

  // Shopify and other platforms strip <style> tags for security
  // All styling uses inline styles on individual elements
  // Wrapper div includes core typography and layout styles
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; line-height: 1.7; color: #2c3e50; max-width: 720px; margin: 0 auto; padding: 20px 0;">\n${content}\n</div>`;
}

/**
 * Generate complete standalone HTML document
 */
export function generateHTMLDocument(
  parsed: ParsedDocument,
  options: HTMLGeneratorOptions = {}
): string {
  const content = generateHTML(parsed, options);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(options.blogTitle || "Blog Post")}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; background-color: #fff; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    h1 { font-size: 2.5em; margin-bottom: 20px; }
    h2 { font-size: 2em; margin-top: 30px; margin-bottom: 15px; }
    p { margin-bottom: 15px; }
    ul, ol { margin-left: 20px; margin-bottom: 15px; }
    li { margin-bottom: 10px; }
    blockquote { border-left: 4px solid #3b82f6; padding-left: 15px; margin: 20px 0; font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f5f5f5; font-weight: bold; }
    img { max-width: 100%; height: auto; margin: 20px 0; }
    details { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 4px; }
    summary { cursor: pointer; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>`;
}
