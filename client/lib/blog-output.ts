import type { BlogPost, FAQItem } from "@/types/blog";

// Comprehensive CSS styles for blog posts
const BLOG_CSS = `
<style>
  /* Reset and Base Styles */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
    font-size: 16px;
    line-height: 1.6;
    color: #222;
    background-color: #fff;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Container */
  .blog-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
  }

  /* Typography - Headings */
  h1 {
    font-size: 2.5rem;
    font-weight: 800;
    line-height: 1.2;
    margin-bottom: 30px;
    margin-top: 0;
    color: #1a1a1a;
    letter-spacing: -0.5px;
  }

  h2 {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.3;
    margin-top: 45px;
    margin-bottom: 20px;
    color: #1a1a1a;
    border-bottom: 3px solid #2563eb;
    padding-bottom: 12px;
  }

  h3 {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.4;
    margin-top: 30px;
    margin-bottom: 15px;
    color: #2563eb;
  }

  h4 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 24px;
    margin-bottom: 12px;
    color: #1a1a1a;
  }

  h5, h6 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-top: 20px;
    margin-bottom: 10px;
    color: #1a1a1a;
  }

  /* Typography - Body */
  p {
    margin-bottom: 18px;
    line-height: 1.8;
    color: #444;
  }

  p + p {
    margin-top: 0;
  }

  /* Links */
  a {
    color: #2563eb;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: all 0.2s ease;
  }

  a:hover {
    color: #1d4ed8;
    border-bottom-color: #2563eb;
  }

  a:visited {
    color: #7c3aed;
  }

  /* Images */
  img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 30px 0;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  img:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
  }

  /* Lists */
  ul, ol {
    margin-bottom: 24px;
    margin-left: 30px;
    padding-left: 0;
  }

  li {
    margin-bottom: 12px;
    line-height: 1.8;
    color: #444;
  }

  li + li {
    margin-top: 8px;
  }

  /* Nested lists */
  ul ul, ul ol, ol ul, ol ol {
    margin-top: 12px;
    margin-bottom: 0;
    margin-left: 20px;
  }

  /* List styling */
  ul > li {
    list-style-type: disc;
  }

  ul ul > li {
    list-style-type: circle;
  }

  ul ul ul > li {
    list-style-type: square;
  }

  /* Strong emphasis */
  strong, b {
    font-weight: 700;
    color: #1a1a1a;
  }

  em, i {
    font-style: italic;
    color: #555;
  }

  /* Blockquote */
  blockquote {
    border-left: 4px solid #2563eb;
    padding: 20px 25px;
    margin: 30px 0;
    background-color: #f0f9ff;
    color: #1e40af;
    font-style: italic;
    border-radius: 0 8px 8px 0;
  }

  blockquote p {
    margin-bottom: 10px;
    color: #1e40af;
  }

  blockquote p:last-child {
    margin-bottom: 0;
  }

  /* Table */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 30px 0;
    background-color: #fff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  }

  thead {
    background-color: #f3f4f6;
  }

  th {
    padding: 16px;
    text-align: left;
    font-weight: 700;
    color: #1a1a1a;
    border-bottom: 2px solid #e5e7eb;
    font-size: 0.95rem;
  }

  td {
    padding: 14px 16px;
    border-bottom: 1px solid #e5e7eb;
    color: #555;
  }

  tbody tr:hover {
    background-color: #f9fafb;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  /* Code */
  code {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.9em;
    background-color: #f3f4f6;
    color: #d97706;
    padding: 2px 6px;
    border-radius: 3px;
    word-break: break-word;
  }

  pre {
    background-color: #1f2937;
    color: #e5e7eb;
    padding: 20px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 24px 0;
    line-height: 1.5;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.9em;
  }

  pre code {
    background-color: transparent;
    color: #e5e7eb;
    padding: 0;
    border-radius: 0;
  }

  /* Details/Collapse */
  details {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    margin: 20px 0;
    background-color: #f9fafb;
    transition: all 0.2s ease;
  }

  details[open] {
    background-color: #f3f4f6;
  }

  summary {
    cursor: pointer;
    font-weight: 600;
    color: #2563eb;
    user-select: none;
    padding: 4px 8px;
    margin: -4px -8px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  summary:hover {
    background-color: #dbeafe;
  }

  details p {
    margin-top: 16px;
    color: #555;
  }

  details p:first-of-type {
    margin-top: 12px;
  }

  /* Definition List (for FAQs) */
  dl {
    margin: 24px 0;
  }

  dt {
    font-weight: 700;
    color: #2563eb;
    margin-top: 20px;
    margin-bottom: 8px;
    font-size: 1.05rem;
  }

  dt:first-child {
    margin-top: 0;
  }

  dd {
    margin-left: 0;
    margin-bottom: 16px;
    color: #555;
    line-height: 1.8;
  }

  /* Brand Promotion Section */
  .brand-promotion {
    background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
    border: 2px solid #2563eb;
    border-radius: 12px;
    padding: 30px;
    margin: 40px 0;
    color: #1e3a8a;
  }

  .brand-promotion h3 {
    color: #1e3a8a;
    margin-top: 0;
    border-bottom: none;
    padding-bottom: 0;
  }

  .brand-promotion ul {
    margin-left: 20px;
  }

  .brand-promotion li {
    color: #1e40af;
  }

  .brand-promotion strong {
    color: #1e40af;
  }

  /* Horizontal Rule */
  hr {
    border: none;
    border-top: 2px solid #e5e7eb;
    margin: 40px 0;
  }

  /* FAQ Section Styles */
  .faq-section {
    background-color: #f9fafb;
    border-radius: 12px;
    padding: 30px;
    margin: 40px 0;
  }

  .faq-section h2 {
    margin-top: 0;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .blog-container {
      padding: 24px 16px;
    }

    h1 {
      font-size: 2rem;
      margin-bottom: 24px;
    }

    h2 {
      font-size: 1.5rem;
      margin-top: 30px;
      margin-bottom: 16px;
    }

    h3 {
      font-size: 1.25rem;
      margin-top: 24px;
    }

    p {
      margin-bottom: 16px;
    }

    ul, ol {
      margin-left: 20px;
    }

    blockquote {
      padding: 16px 20px;
      margin: 24px 0;
    }

    table {
      font-size: 0.9rem;
      margin: 24px 0;
    }

    th, td {
      padding: 12px;
    }

    img {
      margin: 20px 0;
    }
  }

  @media (max-width: 480px) {
    h1 {
      font-size: 1.5rem;
    }

    h2 {
      font-size: 1.25rem;
    }

    h3 {
      font-size: 1.1rem;
    }

    .brand-promotion {
      padding: 20px;
      margin: 24px 0;
    }
  }
</style>
`;

export function generateBlogHTML(post: BlogPost, featuredImageUrl?: string): string {
  const parts: string[] = [];

  // H1 Title with no top margin since it's the first element
  parts.push(`<h1 style="margin-top: 0;">${escapeHtml(post.h1Title)}</h1>`);
  parts.push("");

  // Featured Image
  if (post.featuredImage.file || featuredImageUrl) {
    const imgSrc = featuredImageUrl || URL.createObjectURL(post.featuredImage.file!);
    parts.push(
      `<img src="${imgSrc}" alt="${escapeHtml(post.featuredImage.alt)}" style="width: 100%; height: auto; margin: 1.5rem 0;" />`
    );
    parts.push("");
  }

  // Introduction
  if (post.introduction) {
    parts.push(`<p>${escapeHtml(post.introduction)}</p>`);
    parts.push("");
  }

  // What Is Section
  if (post.sections.whatIs.content) {
    parts.push(
      `<h2>What Is ${post.primaryKeyword} and Why It Matters Today</h2>`
    );
    parts.push(`<p>${escapeHtml(post.sections.whatIs.content)}</p>`);
    if (post.sections.whatIs.image.file || post.sections.whatIs.image.url) {
      const imgSrc = post.sections.whatIs.image.url || URL.createObjectURL(post.sections.whatIs.image.file!);
      parts.push(
        `<img src="${imgSrc}" alt="${escapeHtml(post.sections.whatIs.image.alt)}" style="width: 100%; height: auto; margin: 1.5rem 0; border-radius: 8px;" />`
      );
    }
    parts.push("");
  }

  // Benefits Section
  if (post.sections.benefits.items.length > 0) {
    parts.push(
      `<h2>${post.primaryKeyword} Benefits: Key Advantages You Need to Know</h2>`
    );
    parts.push("<ul>");
    post.sections.benefits.items.forEach((benefit) => {
      parts.push(
        `<li><strong>${escapeHtml(benefit.title)}</strong>: ${escapeHtml(benefit.description)}</li>`
      );
    });
    parts.push("</ul>");
    if (post.sections.benefits.image.file || post.sections.benefits.image.url) {
      const imgSrc = post.sections.benefits.image.url || URL.createObjectURL(post.sections.benefits.image.file!);
      parts.push(
        `<img src="${imgSrc}" alt="${escapeHtml(post.sections.benefits.image.alt)}" style="width: 100%; height: auto; margin: 1.5rem 0; border-radius: 8px;" />`
      );
    }
    parts.push("");
  }

  // Types Section
  if (post.sections.types.items.some((t) => t.title)) {
    parts.push(
      `<h2>${post.primaryKeyword} Types: A Comprehensive Breakdown</h2>`
    );
    post.sections.types.items.forEach((type) => {
      if (type.title) {
        parts.push(`<h3>${escapeHtml(type.title)}</h3>`);
        if (type.description) {
          parts.push(`<p>${escapeHtml(type.description)}</p>`);
        }
      }
    });
    if (post.sections.types.comparisonImage.file || post.sections.types.comparisonImage.url) {
      const imgSrc = post.sections.types.comparisonImage.url || URL.createObjectURL(
        post.sections.types.comparisonImage.file!
      );
      parts.push(
        `<img src="${imgSrc}" alt="${escapeHtml(post.sections.types.comparisonImage.alt)}" style="width: 100%; height: auto; margin: 1.5rem 0; border-radius: 8px;" />`
      );
    }
    parts.push("");
  }

  // How It Works Section
  if (post.sections.howItWorks.steps.some((s) => s.title)) {
    parts.push(`<h2>How ${post.primaryKeyword} Works: Step-by-Step Process</h2>`);
    parts.push("<ol>");
    post.sections.howItWorks.steps.forEach((step) => {
      if (step.title) {
        parts.push(
          `<li><strong>${escapeHtml(step.title)}</strong>: ${escapeHtml(step.description)}</li>`
        );
      }
    });
    parts.push("</ol>");
    if (post.sections.howItWorks.diagramImage.file || post.sections.howItWorks.diagramImage.url) {
      const imgSrc = post.sections.howItWorks.diagramImage.url || URL.createObjectURL(
        post.sections.howItWorks.diagramImage.file!
      );
      parts.push(
        `<img src="${imgSrc}" alt="${escapeHtml(post.sections.howItWorks.diagramImage.alt)}" style="width: 100%; height: auto; margin: 1.5rem 0; border-radius: 8px;" />`
      );
    }
    parts.push("");
  }

  // Use Cases Section
  if (post.sections.useCases.items.some((u) => u.description)) {
    parts.push(
      `<h2>${post.primaryKeyword} Use Cases: Real-World Applications</h2>`
    );
    post.sections.useCases.items.forEach((useCase) => {
      if (useCase.description) {
        parts.push(`<h3>${escapeHtml(useCase.title)}</h3>`);
        parts.push(`<p>${escapeHtml(useCase.description)}</p>`);
      }
    });
    if (post.sections.useCases.image.file || post.sections.useCases.image.url) {
      const imgSrc = post.sections.useCases.image.url || URL.createObjectURL(post.sections.useCases.image.file!);
      parts.push(
        `<img src="${imgSrc}" alt="${escapeHtml(post.sections.useCases.image.alt)}" style="width: 100%; height: auto; margin: 1.5rem 0; border-radius: 8px;" />`
      );
    }
    parts.push("");
  }

  // Brand Promotion Section
  if (post.sections.brandPromotion.enabled && post.sections.brandPromotion.brandName) {
    parts.push("<div class='brand-promotion'>");
    parts.push(
      `<h3>${escapeHtml(post.sections.brandPromotion.brandName)}</h3>`
    );
    if (post.sections.brandPromotion.uspBullets.length > 0) {
      parts.push("<ul>");
      post.sections.brandPromotion.uspBullets.forEach((bullet) => {
        parts.push(`<li>${escapeHtml(bullet)}</li>`);
      });
      parts.push("</ul>");
    }
    if (post.sections.brandPromotion.cta) {
      parts.push(
        `<p><strong>${escapeHtml(post.sections.brandPromotion.cta)}</strong></p>`
      );
    }
    parts.push("</div>");
    parts.push("");
  }

  // FAQs Section
  if (post.sections.faqs.items.length > 0) {
    parts.push(`<section class="faq-section">`);
    parts.push(
      `<h2>Frequently Asked Questions About ${post.primaryKeyword}</h2>`
    );
    parts.push("<dl>");
    post.sections.faqs.items.forEach((faq) => {
      if (faq.question && faq.answer) {
        parts.push(`<dt>${escapeHtml(faq.question)}</dt>`);
        parts.push(`<dd>${escapeHtml(faq.answer)}</dd>`);
      }
    });
    parts.push("</dl>");
    parts.push("</section>");
    parts.push("");
  }

  // Conclusion Section
  if (post.sections.conclusion.content) {
    parts.push(
      `<h2>Conclusion: ${post.primaryKeyword} & Moving Forward</h2>`
    );
    parts.push(`<p>${escapeHtml(post.sections.conclusion.content)}</p>`);
    if (post.sections.conclusion.cta) {
      parts.push(
        `<p><em>${escapeHtml(post.sections.conclusion.cta)}</em></p>`
      );
    }
  }

  return parts.join("\n");
}

export function generateFAQSchema(post: BlogPost): string {
  const faqs: FAQItem[] = post.sections.faqs.items.filter(
    (f) => f.question && f.answer
  );

  if (faqs.length === 0) {
    return "";
  }

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
 * Generate complete blog HTML with all styling included
 * Use this when generating HTML for publishing or downloading
 */
export function generateCompleteStyledBlog(post: BlogPost, featuredImageUrl?: string): string {
  const content = generateBlogHTML(post, featuredImageUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(post.metaDescription)}">
  <meta property="og:title" content="${escapeHtml(post.h1Title)}">
  <meta property="og:description" content="${escapeHtml(post.metaDescription)}">
  ${featuredImageUrl ? `<meta property="og:image" content="${escapeHtml(featuredImageUrl)}">` : ''}
  <title>${escapeHtml(post.h1Title)}</title>
  ${BLOG_CSS}
</head>
<body>
  <article class="blog-container">
    ${content}
  </article>
</body>
</html>`;
}

export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export function generateMetaData(post: BlogPost, featuredImageUrl?: string): {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
} {
  const title = post.h1Title;
  const description =
    post.metaDescription ||
    post.introduction.substring(0, 150).replace(/<[^>]*>/g, "");
  const keywords = [post.primaryKeyword, ...post.secondaryKeywords].join(", ");
  const ogImage = featuredImageUrl || (post.featuredImage.file
    ? URL.createObjectURL(post.featuredImage.file)
    : "");

  return {
    title,
    description,
    keywords,
    ogImage,
  };
}
