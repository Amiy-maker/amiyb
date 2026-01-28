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
  } = options;

  const sections: string[] = [];

  // Add schema markup if enabled
  if (includeSchema) {
    const schema = generateArticleSchema(blogTitle, blogDate, authorName);
    console.log("Generated schema markup:", schema.length, "characters");
    sections.push(schema);
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
      return `<p>${escapeHTML(rawContent)}</p>`;

    case "section3":
      return generateList(lines, "ul", "Table of Contents");

    case "section4":
      return generateList(lines, "ul", "Key Benefits");

    case "section5":
      return generateSectionBody(rawContent, includeImages, section, imageUrls);

    case "section6":
      return `<blockquote>${escapeHTML(rawContent)}</blockquote>`;

    case "section7":
      return generateComparisonTable(lines);

    case "section8":
      return `<blockquote>${escapeHTML(rawContent)}</blockquote>`;

    case "section9":
      return generateList(lines, "ol", "Steps");

    case "section10":
      return generateList(lines, "ul", "Related Resources");

    case "section11":
      return generateFAQSection(lines);

    case "section12":
      return `<p>${escapeHTML(rawContent)}</p>`;

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
  const h1 = `<h1>${textWithLinksToHTML(content)}</h1>`;

  if (includeImages && rule.image?.position === "after" && section.images && section.images.length > 0) {
    const image = section.images[0];
    console.log(`Looking for image keyword: "${image.keyword}"`);
    console.log(`Available imageUrls keys: ${Object.keys(imageUrls).join(", ")}`);
    const imageUrl = imageUrls[image.keyword] || "/placeholder-featured.jpg";
    console.log(`Resolved image URL: ${imageUrl}`);
    const imgTag = `<img src="${imageUrl}" alt="${image.keyword}" />`;
    return `${h1}\n${imgTag}`;
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
  const items = lines.map((line) => `<li>${escapeHTML(line)}</li>`).join("\n");

  let html = `<${tag}>\n${items}\n</${tag}>`;

  if (title) {
    html = `<h2>${title}</h2>\n${html}`;
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
        result += `<h2>${escapeHTML(lines[0])}</h2>\n`;
        lines.shift();
      }

      // Rest of content
      const bodyText = lines.join("\n").trim();
      if (bodyText) {
        result += `<p>${escapeHTML(bodyText)}</p>`;
      }

      // Add image if enabled and available
      if (includeImages && idx % 2 === 1 && imageIndex < sectionImages.length) {
        const image = sectionImages[imageIndex];
        console.log(`Looking for image keyword: "${image.keyword}" in section`);
        const imageUrl = imageUrls[image.keyword] || "/placeholder-section.jpg";
        console.log(`Resolved image URL for section: ${imageUrl}`);
        result += `\n<img src="${imageUrl}" alt="${image.keyword}" />`;
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

  let html = '<table>\n';

  // Header row
  html += "<thead><tr>";
  for (const header of headers) {
    html += `<th>${escapeHTML(header)}</th>`;
  }
  html += "</tr></thead>\n";

  // Data rows
  html += "<tbody>";
  for (const row of rows) {
    html += "<tr>";
    for (const cell of row) {
      html += `<td>${escapeHTML(cell)}</td>`;
    }
    html += "</tr>";
  }
  html += "</tbody>\n</table>";

  return html;
}

/**
 * Generate FAQ section with schema markup
 */
function generateFAQSection(lines: string[]): string {
  const faqs: Array<{ question: string; answer: string }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("Q:") || line.startsWith("Q ")) {
      const question = line.replace(/^Q:?\s*/, "").trim();
      let answer = "";

      // Collect answer lines
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith("Q:") && !lines[j].startsWith("Q ")) {
        if (lines[j].startsWith("A:") || lines[j].startsWith("A ")) {
          answer = lines[j].replace(/^A:?\s*/, "").trim();
        } else if (answer) {
          answer += " " + lines[j];
        }
        j++;
      }

      if (question && answer) {
        faqs.push({ question, answer });
      }
    }
  }

  if (faqs.length === 0) {
    return "<p>No FAQs provided</p>";
  }

  let html = '<h2>Frequently Asked Questions</h2>\n';
  html += '<div>\n';

  for (const faq of faqs) {
    html += `
<details>
  <summary>${escapeHTML(faq.question)}</summary>
  <p>${escapeHTML(faq.answer)}</p>
</details>
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
 */
function textWithLinksToHTML(text: string): string {
  // First, escape HTML special characters except for brackets and parentheses we'll use for links
  let escaped = text.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Then convert markdown links to HTML links: [text](url) -> <a href="url">text</a>
  escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
    // Validate URL to prevent XSS
    if (isValidURL(url)) {
      return `<a href="${escapeHTML(url)}">${linkText}</a>`;
    }
    return match; // Return original if URL is invalid
  });

  return escaped;
}

/**
 * Check if a URL is valid and safe
 */
function isValidURL(url: string): boolean {
  try {
    // Allow http, https, mailto, and relative URLs
    if (url.startsWith("http://") || url.startsWith("https://") ||
        url.startsWith("mailto:") || url.startsWith("/")) {
      new URL(url.startsWith("http") ? url : "https://example.com" + (url.startsWith("/") ? url : "/" + url));
      return true;
    }
    // Allow relative URLs without protocol
    if (!url.includes("://") && !url.startsWith("javascript:") && !url.startsWith("data:")) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Get the CSS styles used for blog posts - scoped to .blog-content wrapper
 */
function getBlogStyles(): string {
  return `
    .blog-content {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      line-height: 1.7;
      color: #2c3e50;
      max-width: 720px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    .blog-content * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    /* Typography */
    .blog-content h1 {
      font-size: 2.5em;
      font-weight: 700;
      margin-bottom: 30px;
      margin-top: 0;
      line-height: 1.2;
      color: #1a1a1a;
      letter-spacing: -0.5px;
    }

    .blog-content h2 {
      font-size: 1.8em;
      font-weight: 600;
      margin-top: 50px;
      margin-bottom: 25px;
      line-height: 1.3;
      color: #1a1a1a;
      border-bottom: 3px solid #e8e8e8;
      padding-bottom: 12px;
    }

    .blog-content h3 {
      font-size: 1.4em;
      font-weight: 600;
      margin-top: 35px;
      margin-bottom: 20px;
      line-height: 1.3;
      color: #1a1a1a;
    }

    .blog-content p {
      font-size: 1.05em;
      line-height: 1.8;
      margin-bottom: 25px;
      color: #3a3a3a;
      text-align: justify;
    }

    /* Images */
    .blog-content img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 40px auto;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    /* Lists */
    .blog-content ul,
    .blog-content ol {
      margin: 30px 0 30px 35px;
      line-height: 1.9;
    }

    .blog-content li {
      margin-bottom: 15px;
      font-size: 1.05em;
      color: #3a3a3a;
    }

    /* Blockquotes */
    .blog-content blockquote {
      border-left: 5px solid #d4a574;
      padding: 25px 30px;
      margin: 40px 0;
      background-color: #fef9f5;
      font-style: italic;
      font-size: 1.15em;
      color: #5a5a5a;
      line-height: 1.8;
    }

    /* Tables */
    .blog-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 40px 0;
      font-size: 1em;
      background-color: #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border-radius: 6px;
      overflow: hidden;
    }

    .blog-content thead {
      background: linear-gradient(135deg, #f5f5f5 0%, #ebebeb 100%);
    }

    .blog-content th {
      padding: 18px;
      text-align: left;
      font-weight: 600;
      color: #1a1a1a;
      border-bottom: 2px solid #d0d0d0;
      font-size: 0.95em;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .blog-content td {
      padding: 16px 18px;
      border-bottom: 1px solid #e8e8e8;
      color: #3a3a3a;
    }

    .blog-content tbody tr:last-child td {
      border-bottom: none;
    }

    .blog-content tbody tr:hover {
      background-color: #f9f9f9;
    }

    /* Details/Accordion */
    .blog-content details {
      margin: 25px 0;
      padding: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      background-color: #fafafa;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .blog-content details:hover {
      background-color: #f5f5f5;
      border-color: #d0d0d0;
    }

    .blog-content details[open] {
      background-color: #f5f5f5;
    }

    .blog-content summary {
      font-weight: 600;
      font-size: 1.1em;
      color: #1a1a1a;
      cursor: pointer;
      outline: none;
      user-select: none;
      padding: 5px 0;
    }

    .blog-content details p {
      margin-top: 18px;
      margin-bottom: 0;
      font-size: 1em;
      color: #3a3a3a;
    }

    /* Schema markup */
    .blog-content script[type="application/ld+json"] {
      display: none;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .blog-content h1 {
        font-size: 2em;
        margin-bottom: 24px;
      }

      .blog-content h2 {
        font-size: 1.5em;
        margin-top: 40px;
        margin-bottom: 20px;
      }

      .blog-content p {
        font-size: 1em;
        text-align: left;
      }

      .blog-content ul,
      .blog-content ol {
        margin-left: 24px;
      }

      .blog-content blockquote {
        padding: 20px 24px;
        font-size: 1.05em;
      }

      .blog-content table {
        font-size: 0.95em;
      }

      .blog-content th,
      .blog-content td {
        padding: 12px;
      }
    }
  `;
}

/**
 * Generate HTML with embedded styles (for Shopify/external publishing)
 */
export function generateStyledHTML(
  parsed: ParsedDocument,
  options: HTMLGeneratorOptions = {}
): string {
  const content = generateHTML(parsed, options);
  const styles = getBlogStyles();

  return `<style>${styles}</style>\n<div class="blog-content">\n${content}\n</div>`;
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
    html {
      scroll-behavior: smooth;
    }
    body {
      background-color: #fafafa;
      margin: 0;
      padding: 0;
    }
    ${getBlogStyles()}
  </style>
</head>
<body>
  <div class="blog-content">
    ${content}
  </div>
</body>
</html>`;
}
