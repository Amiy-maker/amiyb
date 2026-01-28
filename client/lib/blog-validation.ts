import type { BlogPost, ValidationState } from "@/types/blog";

export function validateBlogPost(post: BlogPost): ValidationState {
  const errors: string[] = [];
  const warnings: string[] = [];
  const completedSections: string[] = [];

  // 1. Keyword Setup
  if (!post.primaryKeyword.trim()) {
    errors.push("Primary keyword is required");
  } else {
    completedSections.push("Keyword Setup");
  }

  // 2. H1 Title
  if (!post.h1Title.trim()) {
    errors.push("Blog title (H1) is required");
  } else if (!post.primaryKeyword || !post.h1Title.toLowerCase().includes(post.primaryKeyword.toLowerCase())) {
    warnings.push("H1 title should include the primary keyword for SEO");
  } else {
    completedSections.push("Blog Title");
  }

  // 3. Featured Image
  if (!post.featuredImage.file && !post.featuredImage.url) {
    errors.push("Featured image is required");
  } else if (!post.featuredImage.url) {
    warnings.push("Featured image needs to be uploaded to Shopify before publishing");
  } else if (!post.featuredImage.alt.trim()) {
    warnings.push("Featured image alt text is recommended for accessibility");
  } else {
    completedSections.push("Featured Image");
  }

  // 4. Introduction
  const introLength = post.introduction.trim().split(/\s+/).length;
  if (!post.introduction.trim()) {
    errors.push("Introduction paragraph is required");
  } else if (introLength < 120) {
    warnings.push(`Introduction is too short (${introLength} words, recommended 120-180)`);
  } else if (introLength > 180) {
    warnings.push(`Introduction is too long (${introLength} words, recommended 120-180)`);
  } else {
    completedSections.push("Introduction");
  }

  // 5. What Is Section
  if (!post.sections.whatIs.content.trim()) {
    errors.push("'What Is' section content is required");
  } else {
    completedSections.push("What Is Section");
  }

  // 6. Benefits Section
  if (post.sections.benefits.items.length === 0) {
    errors.push("At least one benefit must be added");
  } else if (post.sections.benefits.items.length < 3) {
    warnings.push(`Benefits section should have 3-5 items (currently ${post.sections.benefits.items.length})`);
  } else {
    completedSections.push("Benefits Section");
  }

  // 7. Types Section
  const validTypes = post.sections.types.items.filter(
    (t) => t.title.trim() && t.description.trim()
  );
  if (validTypes.length < 3) {
    errors.push("All 3 types must have both title and description");
  } else {
    completedSections.push("Types Section");
  }

  // 8. How It Works Section
  const validSteps = post.sections.howItWorks.steps.filter(
    (s) => s.title.trim() && s.description.trim()
  );
  if (validSteps.length < 3) {
    errors.push("All 3 process steps must have both title and description");
  } else {
    completedSections.push("How It Works");
  }

  // 9. Use Cases Section
  const validUseCases = post.sections.useCases.items.filter(
    (u) => u.description.trim()
  );
  if (validUseCases.length < 3) {
    errors.push("All 3 use case sections must have descriptions");
  } else {
    completedSections.push("Use Cases");
  }

  // 10. Brand Promotion (optional)
  if (post.sections.brandPromotion.enabled) {
    if (!post.sections.brandPromotion.brandName.trim()) {
      errors.push("Brand name is required when Brand Promotion is enabled");
    } else {
      completedSections.push("Brand Promotion");
    }
  } else {
    completedSections.push("Brand Promotion (Skipped)");
  }

  // 11. FAQs
  const validFAQs = post.sections.faqs.items.filter(
    (f) => f.question.trim() && f.answer.trim()
  );
  if (validFAQs.length < 4) {
    errors.push(
      `FAQs section requires at least 4 complete Q&A pairs (currently ${validFAQs.length})`
    );
  } else if (validFAQs.length > 6) {
    warnings.push(`FAQs section should have 4-6 items (currently ${validFAQs.length})`);
  } else {
    completedSections.push("FAQs");
  }

  // 12. Conclusion
  if (!post.sections.conclusion.content.trim()) {
    errors.push("Conclusion is required");
  } else {
    completedSections.push("Conclusion");
  }

  // Additional Validations
  if (post.h1Title && (post.h1Title.match(/<h1/gi) || post.h1Title.match(/<h[2-6]/gi))) {
    errors.push("H1 title cannot contain HTML tags");
  }

  // Check for heading tags in restricted areas
  if (post.introduction.toLowerCase().includes("<h")) {
    errors.push("Introduction paragraph cannot contain heading tags");
  }

  if (post.sections.faqs.items.some((f) => f.answer.toLowerCase().includes("<h"))) {
    errors.push("FAQ answers cannot contain heading tags");
  }

  return {
    errors,
    warnings,
    completedSections,
  };
}

export function generateMetaDescription(post: BlogPost): string {
  if (post.metaDescription) return post.metaDescription;

  const introText = post.introduction
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .substring(0, 150);

  return (
    introText + (introText.length === 150 ? "..." : "")
  );
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .slice(0, 60);
}

export function suggestAltText(
  context: "featured" | "whatIs" | "benefits" | "types" | "howItWorks" | "useCases" | "faqs",
  keyword: string
): string {
  const suggestions: Record<string, string> = {
    featured: `${keyword} - Complete Guide`,
    whatIs: `What is ${keyword}`,
    benefits: `${keyword} benefits`,
    types: `${keyword} types comparison`,
    howItWorks: `${keyword} process diagram`,
    useCases: `${keyword} real-world use cases`,
    faqs: `${keyword} frequently asked questions`,
  };

  return suggestions[context] || keyword;
}

export function countWords(text: string): number {
  return text
    .trim()
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (file.size > maxSize) {
    return { valid: false, error: "Image must be smaller than 5MB" };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Image must be JPG, PNG, or WebP" };
  }

  return { valid: true };
}
