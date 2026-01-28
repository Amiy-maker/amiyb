import type { BlogPost, FAQItem } from "@/types/blog";

export function generateBlogHTML(post: BlogPost, featuredImageUrl?: string): string {
  const parts: string[] = [];

  // H1 Title
  parts.push(`<h1>${escapeHtml(post.h1Title)}</h1>`);
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
    if (post.sections.howItWorks.diagramImage.file) {
      const imgSrc = URL.createObjectURL(
        post.sections.howItWorks.diagramImage.file
      );
      parts.push(
        `<img src="${imgSrc}" alt="${escapeHtml(post.sections.howItWorks.diagramImage.alt)}" />`
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
    if (post.sections.useCases.image.file) {
      const imgSrc = URL.createObjectURL(post.sections.useCases.image.file);
      parts.push(
        `<img src="${imgSrc}" alt="${escapeHtml(post.sections.useCases.image.alt)}" />`
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
    parts.push(
      `<h2>Frequently Asked Questions About ${post.primaryKeyword}</h2>`
    );
    parts.push("<dl>");
    post.sections.faqs.items.forEach((faq) => {
      if (faq.question && faq.answer) {
        parts.push(`<dt><strong>${escapeHtml(faq.question)}</strong></dt>`);
        parts.push(`<dd>${escapeHtml(faq.answer)}</dd>`);
      }
    });
    parts.push("</dl>");
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
