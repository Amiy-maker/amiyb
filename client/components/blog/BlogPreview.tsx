import type { BlogPost } from "@/types/blog";
import { generateBlogHTML } from "@/lib/blog-output";
import { Eye } from "lucide-react";

interface BlogPreviewProps {
  post: BlogPost;
}

export function BlogPreview({ post }: BlogPreviewProps) {
  const htmlContent = generateBlogHTML(post, post.featuredImage.url);

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Preview Header */}
      <div className="border-b border-gray-200 px-8 py-4 sticky top-0 z-10 bg-white">
        <div className="flex items-center gap-2 text-gray-700">
          <Eye className="w-4 h-4" />
          <h2 className="font-semibold">Live Preview</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          This is how your blog post will appear
        </p>
      </div>

      {/* Preview Content */}
      <div className="overflow-y-auto flex-1 px-8 py-8">
        {!post.primaryKeyword ? (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">👋</p>
            <p className="font-medium">Start by setting your primary keyword</p>
            <p className="text-sm">Your preview will appear here as you fill in sections.</p>
          </div>
        ) : (
          <article className="prose prose-sm max-w-none">
            {/* This is a simplified preview - in real implementation, you'd want
              to render the HTML safely. For now, we're showing a text-based preview
              to keep it simple and secure. */}
            <div className="space-y-6 text-gray-800">
              {/* H1 */}
              {post.h1Title && (
                <h1 className="text-3xl font-bold mb-4">{post.h1Title}</h1>
              )}

              {/* Featured Image */}
              {(post.featuredImage.file || post.featuredImage.url) && (
                <figure className="my-6">
                  <img
                    src={post.featuredImage.url || URL.createObjectURL(post.featuredImage.file!)}
                    alt={post.featuredImage.alt}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <figcaption className="text-sm text-gray-600 mt-2">
                    {post.featuredImage.alt}
                  </figcaption>
                </figure>
              )}

              {/* Introduction */}
              {post.introduction && (
                <p className="text-base leading-relaxed">
                  {post.introduction}
                </p>
              )}

              {/* What Is Section */}
              {post.sections.whatIs.content && (
                <>
                  <h2 className="text-2xl font-bold mt-8">
                    What Is {post.primaryKeyword} and Why It Matters Today
                  </h2>
                  <p className="text-base leading-relaxed">
                    {post.sections.whatIs.content}
                  </p>
                  {post.sections.whatIs.image.file && (
                    <figure className="my-6">
                      <img
                        src={URL.createObjectURL(post.sections.whatIs.image.file)}
                        alt={post.sections.whatIs.image.alt}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </figure>
                  )}
                </>
              )}

              {/* Benefits Section */}
              {post.sections.benefits.items.length > 0 && (
                <>
                  <h2 className="text-2xl font-bold mt-8">
                    {post.primaryKeyword} Benefits: Key Advantages You Need to Know
                  </h2>
                  <ul className="space-y-2">
                    {post.sections.benefits.items.map((benefit, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-blue-600">•</span>
                        <span>
                          <strong>{benefit.title}:</strong> {benefit.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {post.sections.benefits.image.file && (
                    <figure className="my-6">
                      <img
                        src={URL.createObjectURL(post.sections.benefits.image.file)}
                        alt={post.sections.benefits.image.alt}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </figure>
                  )}
                </>
              )}

              {/* Types Section */}
              {post.sections.types.items.some((t) => t.title) && (
                <>
                  <h2 className="text-2xl font-bold mt-8">
                    {post.primaryKeyword} Types: A Comprehensive Breakdown
                  </h2>
                  {post.sections.types.items.map((type, idx) => (
                    type.title && (
                      <div key={idx}>
                        <h3 className="text-xl font-semibold mt-4">{type.title}</h3>
                        <p className="text-base leading-relaxed">
                          {type.description}
                        </p>
                      </div>
                    )
                  ))}
                  {post.sections.types.comparisonImage.file && (
                    <figure className="my-6">
                      <img
                        src={URL.createObjectURL(
                          post.sections.types.comparisonImage.file
                        )}
                        alt={post.sections.types.comparisonImage.alt}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </figure>
                  )}
                </>
              )}

              {/* How It Works Section */}
              {post.sections.howItWorks.steps.some((s) => s.title) && (
                <>
                  <h2 className="text-2xl font-bold mt-8">
                    How {post.primaryKeyword} Works: Step-by-Step Process
                  </h2>
                  <ol className="space-y-3 list-decimal list-inside">
                    {post.sections.howItWorks.steps.map((step, idx) => (
                      step.title && (
                        <li key={idx} className="text-base">
                          <span className="font-semibold">{step.title}:</span>{" "}
                          {step.description}
                        </li>
                      )
                    ))}
                  </ol>
                  {post.sections.howItWorks.diagramImage.file && (
                    <figure className="my-6">
                      <img
                        src={URL.createObjectURL(
                          post.sections.howItWorks.diagramImage.file
                        )}
                        alt={post.sections.howItWorks.diagramImage.alt}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </figure>
                  )}
                </>
              )}

              {/* Use Cases Section */}
              {post.sections.useCases.items.some((u) => u.description) && (
                <>
                  <h2 className="text-2xl font-bold mt-8">
                    {post.primaryKeyword} Use Cases: Real-World Applications
                  </h2>
                  {post.sections.useCases.items.map((useCase, idx) => (
                    useCase.description && (
                      <div key={idx}>
                        <h3 className="text-xl font-semibold mt-4">
                          {useCase.title}
                        </h3>
                        <p className="text-base leading-relaxed">
                          {useCase.description}
                        </p>
                      </div>
                    )
                  ))}
                  {post.sections.useCases.image.file && (
                    <figure className="my-6">
                      <img
                        src={URL.createObjectURL(post.sections.useCases.image.file)}
                        alt={post.sections.useCases.image.alt}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </figure>
                  )}
                </>
              )}

              {/* Brand Promotion */}
              {post.sections.brandPromotion.enabled &&
                post.sections.brandPromotion.brandName && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 my-8 rounded">
                    <h3 className="font-bold text-lg mb-3">
                      {post.sections.brandPromotion.brandName}
                    </h3>
                    {post.sections.brandPromotion.uspBullets.length > 0 && (
                      <ul className="space-y-2 mb-4">
                        {post.sections.brandPromotion.uspBullets.map(
                          (bullet, idx) => (
                            <li key={idx} className="text-sm flex gap-2">
                              <span>✓</span> {bullet}
                            </li>
                          )
                        )}
                      </ul>
                    )}
                    {post.sections.brandPromotion.cta && (
                      <p className="font-semibold text-blue-600">
                        {post.sections.brandPromotion.cta}
                      </p>
                    )}
                  </div>
                )}

              {/* FAQs */}
              {post.sections.faqs.items.length > 0 && (
                <>
                  <h2 className="text-2xl font-bold mt-8">
                    Frequently Asked Questions About {post.primaryKeyword}
                  </h2>
                  <div className="space-y-4">
                    {post.sections.faqs.items.map((faq, idx) => (
                      faq.question &&
                      faq.answer && (
                        <div key={idx}>
                          <p className="font-semibold text-gray-900">
                            {faq.question}
                          </p>
                          <p className="text-gray-700 mt-2">{faq.answer}</p>
                        </div>
                      )
                    ))}
                  </div>
                </>
              )}

              {/* Conclusion */}
              {post.sections.conclusion.content && (
                <>
                  <h2 className="text-2xl font-bold mt-8">
                    Conclusion: {post.primaryKeyword} & Moving Forward
                  </h2>
                  <p className="text-base leading-relaxed">
                    {post.sections.conclusion.content}
                  </p>
                  {post.sections.conclusion.cta && (
                    <p className="italic text-gray-600 mt-4">
                      {post.sections.conclusion.cta}
                    </p>
                  )}
                </>
              )}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
