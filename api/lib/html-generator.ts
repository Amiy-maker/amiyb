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
      return `<blockquote class="border-l-4 border-blue-500 pl-4 italic text-gray-700">${escapeHTML(rawContent)}</blockquote>`;

    case "section7":
      return generateComparisonTable(lines);

    case "section8":
      return `<blockquote class="border-l-4 border-green-500 pl-4 italic">${escapeHTML(rawContent)}</blockquote>`;

    case "section9":
      return generateList(lines, "ol", "Steps");

    case "section10":
      return generateList(lines, "ul", "Related Resources");

    case "section11":
      return generateFAQSection(lines);

    case "section12":
      return `<p class="text-lg font-semibold text-center mt-8">${escapeHTML(rawContent)}</p>`;

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
  const h1 = `<h1>${escapeHTML(content)}</h1>`;

  if (includeImages && rule.image?.position === "after" && section.images && section.images.length > 0) {
    const image = section.images[0];
    console.log(`Looking for image keyword: "${image.keyword}"`);
    console.log(`Available imageUrls keys: ${Object.keys(imageUrls).join(", ")}`);
    const imageUrl = imageUrls[image.keyword] || "/placeholder-featured.jpg";
    console.log(`Resolved image URL: ${imageUrl}`);
    const imgTag = `<img src="${imageUrl}" alt="${image.keyword}" class="${rule.image.class || ""}" />`;
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

  let html = `<${tag} class="space-y-2">\n${items}\n</${tag}>`;

  if (title) {
    html = `<h2 class="text-2xl font-bold mb-4">${title}</h2>\n${html}`;
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
        result += `<h2 class="text-2xl font-bold mt-6 mb-4">${escapeHTML(lines[0])}</h2>\n`;
        lines.shift();
      }

      // Rest of content
      const bodyText = lines.join("\n").trim();
      if (bodyText) {
        result += `<p class="text-base leading-relaxed">${escapeHTML(bodyText)}</p>`;
      }

      // Add image if enabled and available
      if (includeImages && idx % 2 === 1 && imageIndex < sectionImages.length) {
        const image = sectionImages[imageIndex];
        console.log(`Looking for image keyword: "${image.keyword}" in section`);
        const imageUrl = imageUrls[image.keyword] || "/placeholder-section.jpg";
        console.log(`Resolved image URL for section: ${imageUrl}`);
        result += `\n<img src="${imageUrl}" alt="${image.keyword}" class="rounded-lg my-4" />`;
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

  let html = '<table class="w-full border-collapse border border-gray-300">\n';

  // Header row
  html += "<thead><tr>";
  for (const header of headers) {
    html += `<th class="border border-gray-300 p-3 bg-gray-100 font-bold">${escapeHTML(header)}</th>`;
  }
  html += "</tr></thead>\n";

  // Data rows
  html += "<tbody>";
  for (const row of rows) {
    html += "<tr>";
    for (const cell of row) {
      html += `<td class="border border-gray-300 p-3">${escapeHTML(cell)}</td>`;
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

  let html = '<h2 class="text-2xl font-bold mb-6">Frequently Asked Questions</h2>\n';
  html += '<div class="space-y-4">\n';

  for (const faq of faqs) {
    html += `
<details class="border border-gray-300 rounded-lg p-4">
  <summary class="font-bold cursor-pointer">${escapeHTML(faq.question)}</summary>
  <p class="mt-3 text-gray-700">${escapeHTML(faq.answer)}</p>
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
