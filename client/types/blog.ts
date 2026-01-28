export interface ImageData {
  file: File | null;
  alt: string;
  url?: string; // Shopify image URL after upload
  isUploading?: boolean; // Track upload state
}

export interface BenefitItem {
  title: string;
  description: string;
}

export interface TypeItem {
  title: string;
  description: string;
}

export interface StepItem {
  title: string;
  description: string;
}

export interface UseCaseItem {
  title: string;
  description: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface BlogPost {
  primaryKeyword: string;
  secondaryKeywords: string[];
  keywordLocked: boolean;
  h1Title: string;
  featuredImage: ImageData;
  introduction: string;
  sections: {
    whatIs: {
      content: string;
      image: ImageData;
    };
    benefits: {
      items: BenefitItem[];
      image: ImageData;
    };
    types: {
      items: TypeItem[];
      comparisonImage: ImageData;
    };
    howItWorks: {
      steps: StepItem[];
      diagramImage: ImageData;
    };
    useCases: {
      items: UseCaseItem[];
      image: ImageData;
    };
    brandPromotion: {
      enabled: boolean;
      brandName: string;
      uspBullets: string[];
      cta: string;
    };
    faqs: {
      items: FAQItem[];
    };
    conclusion: {
      content: string;
      cta: string;
    };
  };
  metaDescription: string;
  slug: string;
}

export interface ValidationError {
  section: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationState {
  errors: string[];
  warnings: string[];
  completedSections: string[];
}

export interface BlogValidationRules {
  h1Count: number;
  h1HasKeyword: boolean;
  featuredImageExists: boolean;
  introductionLength: number;
  primaryKeywordFilled: boolean;
}
