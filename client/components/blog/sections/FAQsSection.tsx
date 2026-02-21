import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { BlogPost, FAQItem } from "@/types/blog";

interface FAQsSectionProps {
  post: BlogPost;
  onUpdateSection: (sectionName: keyof BlogPost["sections"], updates: any) => void;
}

export function FAQsSection({ post, onUpdateSection }: FAQsSectionProps) {
  const title = post.primaryKeyword
    ? `Frequently Asked Questions About ${post.primaryKeyword}`
    : "Frequently Asked Questions";

  const handleAddFAQ = () => {
    onUpdateSection("faqs", {
      items: [...post.sections.faqs.items, { question: "", answer: "" }],
    });
  };

  const handleUpdateFAQ = (index: number, item: FAQItem) => {
    const items = [...post.sections.faqs.items];
    items[index] = item;
    onUpdateSection("faqs", { items });
  };

  const handleRemoveFAQ = (index: number) => {
    const items = post.sections.faqs.items.filter((_, i) => i !== index);
    onUpdateSection("faqs", { items });
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Section Title (Auto-Generated):</strong>
          <br />
          <code className="bg-blue-100 px-2 py-1 rounded text-xs">{title}</code>
          <br />
          <span className="text-xs mt-2 block text-blue-800">
            This section is optimized for FAQ schema markup, which helps search
            engines display your Q&A in rich snippets.
          </span>
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <Label className="text-base font-semibold">
            FAQ Items <span className="text-red-500">*</span>
          </Label>
          <span className="text-sm text-gray-600">
            {post.sections.faqs.items.length} / 12 items
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Add 4-12 frequently asked questions and their answers. This section is
          schema-friendly for search engine visibility.
        </p>

        {/* FAQs List */}
        <div className="space-y-4">
          {post.sections.faqs.items.map((faq, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg space-y-3"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-600">
                  FAQ #{index + 1}
                </span>
                <Button
                  onClick={() => handleRemoveFAQ(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Question
                </Label>
                <Input
                  type="text"
                  placeholder="What is...?"
                  value={faq.question}
                  onChange={(e) =>
                    handleUpdateFAQ(index, { ...faq, question: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  Questions are automatically bolded in the output.
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Answer</Label>
                <Textarea
                  placeholder="Provide a concise answer..."
                  value={faq.answer}
                  onChange={(e) =>
                    handleUpdateFAQ(index, { ...faq, answer: e.target.value })
                  }
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Keep answers under 100 words.
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          {post.sections.faqs.items.length < 12 && (
            <Button
              onClick={handleAddFAQ}
              variant="outline"
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add FAQ
            </Button>
          )}

          {post.sections.faqs.items.length === 0 && (
            <Button onClick={handleAddFAQ} className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Add First FAQ
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-900">
          <strong>⚠️ Restrictions:</strong> No headings or images allowed in FAQs.
          Keep answers concise and focused.
        </p>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
        <p className="text-sm text-blue-900">
          <strong>💡 Tips:</strong>
        </p>
        <ul className="text-sm text-blue-800 space-y-1 ml-4">
          <li>• Include 4-6 important questions your audience might ask</li>
          <li>• Provide clear, helpful answers (under 100 words each)</li>
          <li>• Use natural, conversational language</li>
          <li>• This section supports FAQ schema for search rankings</li>
        </ul>
      </div>
    </div>
  );
}
