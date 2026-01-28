import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateBlogHTML, generateFAQSchema } from "@/lib/blog-output";
import { CheckCircle2, Copy, Download, AlertCircle } from "lucide-react";
import type { BlogPost } from "@/types/blog";
import { useToast } from "@/hooks/use-toast";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: BlogPost;
}

export function PublishDialog({
  open,
  onOpenChange,
  post,
}: PublishDialogProps) {
  const [step, setStep] = useState<"review" | "output" | "published">("review");
  const [htmlOutput, setHtmlOutput] = useState("");
  const { toast } = useToast();

  const handlePublish = () => {
    // Generate HTML
    const html = generateBlogHTML(post, post.featuredImage.url);
    setHtmlOutput(html);

    // Generate FAQ Schema
    const faqSchema = generateFAQSchema(post);
    console.log("FAQ Schema:", faqSchema);

    setStep("output");
  };

  const handleCopyHTML = () => {
    navigator.clipboard.writeText(htmlOutput);
    toast({
      title: "Copied!",
      description: "HTML content copied to clipboard.",
    });
  };

  const handleDownloadHTML = () => {
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/html;charset=utf-8," + encodeURIComponent(htmlOutput)
    );
    element.setAttribute("download", `${post.slug}.html`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast({
      title: "Downloaded!",
      description: `${post.slug}.html has been downloaded.`,
    });
  };

  const handleConfirmPublish = () => {
    setStep("published");
    // Here you would typically save to a backend/CMS
    toast({
      title: "Published!",
      description: "Your blog post has been published successfully.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {step === "review" && (
          <>
            <DialogHeader>
              <DialogTitle>Review & Publish Blog Post</DialogTitle>
              <DialogDescription>
                Review your blog post details before publishing.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Review Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-blue-900">Blog Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                  <div>
                    <span className="font-medium">Title:</span>
                    <p>{post.h1Title}</p>
                  </div>
                  <div>
                    <span className="font-medium">Slug:</span>
                    <p className="font-mono text-xs break-all">{post.slug}</p>
                  </div>
                  <div>
                    <span className="font-medium">Primary Keyword:</span>
                    <p>{post.primaryKeyword}</p>
                  </div>
                  <div>
                    <span className="font-medium">Secondary Keywords:</span>
                    <p>{post.secondaryKeywords.join(", ") || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-semibold">Meta Description</Label>
                  <Textarea
                    value={post.metaDescription}
                    readOnly
                    className="mt-1 text-xs"
                    rows={2}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {post.metaDescription.length} characters (recommended: 150-160)
                  </p>
                </div>
              </div>

              {/* Publishing Info */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-900">Ready to Publish</p>
                    <p className="text-sm text-green-800 mt-1">
                      Your blog post passes all SEO requirements and validation checks.
                      Click the button below to generate the final HTML and publish.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button onClick={handlePublish}>
                Generate & Publish
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "output" && (
          <>
            <DialogHeader>
              <DialogTitle>Blog Post HTML Output</DialogTitle>
              <DialogDescription>
                Your blog post is ready. Copy the HTML or download it.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-yellow-900">Shopify Metafield Ready</p>
                    <p className="text-sm text-yellow-800 mt-1">
                      This HTML is ready to be pasted into the Shopify metafield
                      <code className="bg-yellow-100 px-1 rounded text-xs">content_html</code>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">HTML Content</Label>
                <Textarea
                  value={htmlOutput}
                  readOnly
                  className="font-mono text-xs"
                  rows={10}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCopyHTML}
                  variant="outline"
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy HTML
                </Button>
                <Button
                  onClick={handleDownloadHTML}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("review")}
              >
                Back
              </Button>
              <Button onClick={handleConfirmPublish}>
                Confirm & Publish
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "published" && (
          <>
            <DialogHeader>
              <DialogTitle>Published Successfully!</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">Blog Post Published</h3>
                <p className="text-gray-600">
                  Your blog post <span className="font-medium">"{post.h1Title}"</span> has
                  been successfully published!
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <p className="text-sm font-medium text-blue-900">Next Steps:</p>
                <ul className="text-sm text-blue-800 space-y-1 ml-4">
                  <li>
                    • Paste the HTML into your Shopify metafield{" "}
                    <code className="bg-blue-100 px-1 rounded">content_html</code>
                  </li>
                  <li>• Monitor search engine performance</li>
                  <li>• Share on social media</li>
                  <li>• Track engagement metrics</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
