import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SECTION_RULES, getSectionsByOrder } from "@shared/section-rules";
import { GenerateHTMLRequest, GenerateHTMLResponse } from "@shared/api";
import { toast } from "sonner";
import { Copy, Download, Zap, Upload, Edit2, Trash2 } from "lucide-react";
import * as mammoth from "mammoth";

export default function BlogGenerator() {
  const [documentContent, setDocumentContent] = useState("");
  const [html, setHtml] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishData, setPublishData] = useState({
    title: "",
    author: "",
    tags: "",
    publicationDate: new Date().toISOString().split("T")[0],
  });
  const [images, setImages] = useState<Array<{ keyword: string; sectionId: string }>>([]);
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputsRef = useRef<Record<string, HTMLInputElement>>({});

  const sections = getSectionsByOrder();

  /**
   * Handle document file upload
   */
  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Allow text-based and Word formats
    const allowedExtensions = [".txt", ".md", ".docx"];
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      toast.error(
        `Unsupported file format: ${fileExtension}. Please use .txt, .md, or .docx files.`
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    try {
      let content: string;

      if (fileExtension === ".docx") {
        // Parse DOCX file using mammoth
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;

        if (result.messages.length > 0) {
          console.warn("DOCX parsing warnings:", result.messages);
        }
      } else {
        // Read text file as plain text
        content = await file.text();
      }

      setDocumentContent(content);
      toast.success(`Document "${file.name}" loaded successfully`);
    } catch (error) {
      console.error("Error reading file:", error);
      toast.error(
        `Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Reset input so same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * Insert section marker at cursor position
   */
  const insertSection = (sectionId: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = documentContent.substring(0, start);
    const after = documentContent.substring(end);
    const marker = `\n\n{${sectionId}}\n`;

    const newDoc = before + marker + after;
    setDocumentContent(newDoc);

    // Move cursor after inserted marker
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + marker.length;
      textarea.selectionEnd = start + marker.length;
    }, 0);
  };

  /**
   * Upload a single image to Shopify
   */
  const uploadImageToShopify = async (keyword: string, file: File) => {
    setUploadingImages((prev) => ({ ...prev, [keyword]: true }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("keyword", keyword);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Failed to upload image for "${keyword}": ${data.error}`);
        return;
      }

      setImageUrls((prev) => ({ ...prev, [keyword]: data.imageUrl }));
      toast.success(`Image "${keyword}" uploaded to Shopify!`);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(`Error uploading image: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setUploadingImages((prev) => ({ ...prev, [keyword]: false }));
    }
  };

  /**
   * Handle image file selection for a specific keyword
   */
  const handleImageFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    keyword: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await uploadImageToShopify(keyword, file);

    // Reset input
    if (imageFileInputsRef.current[keyword]) {
      imageFileInputsRef.current[keyword].value = "";
    }
  };

  /**
   * Remove an uploaded image
   */
  const removeImage = (keyword: string) => {
    setImageUrls((prev) => {
      const updated = { ...prev };
      delete updated[keyword];
      return updated;
    });
    toast.success(`Image "${keyword}" removed`);
  };

  /**
   * Generate HTML from document
   */
  const generateBlogHTML = async () => {
    if (!documentContent.trim()) {
      toast.error("Please write some content first");
      return;
    }

    setIsLoading(true);
    try {
      const payload: GenerateHTMLRequest = {
        document: documentContent,
        format: "fragment",
        options: {
          includeSchema: true,
          includeImages: true,
          imageUrls: Object.keys(imageUrls).length > 0 ? imageUrls : undefined,
        },
      };

      const response = await fetch("/api/generate-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Read response text first to debug
      const responseText = await response.text();
      console.log("Response status:", response.status);
      console.log("Response text:", responseText);

      if (!responseText) {
        toast.error("Server returned empty response");
        return;
      }

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error("Failed to parse JSON:", responseText);
        toast.error("Server returned invalid response: " + responseText.substring(0, 100));
        return;
      }

      // Check if images need to be uploaded first
      if (response.status === 202 && data.requiresImageUpload) {
        setImages(data.images || []);
        setImageUrls({}); // Reset image URLs
        toast.info(`Found ${data.images.length} image(s). Please upload them first.`);
        return;
      }

      // Check for images even if validation failed (in parsed data)
      if (data.data?.images && data.data.images.length > 0 && !response.ok) {
        setImages(data.data.images || []);
        setImageUrls({}); // Reset image URLs
        setMetadata(data.metadata);
        toast.info(
          `Found ${data.data.images.length} image(s). Please upload them first. (Note: Document has validation warnings)`
        );
        return;
      }

      if (!response.ok) {
        toast.error(data.error || data.metadata?.warnings?.[0] || "Failed to generate HTML");
        setMetadata(data.metadata);
        return;
      }

      setHtml(data.html);
      setMetadata(data.metadata);
      setImages([]); // Clear images list
      setActiveTab("preview");
      toast.success("Blog HTML generated successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Copy HTML to clipboard
   */
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(html);
      toast.success("HTML copied to clipboard!");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  /**
   * Download HTML as file
   */
  const downloadHTML = () => {
    const element = globalThis.document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/html;charset=utf-8," + encodeURIComponent(html)
    );
    element.setAttribute("download", "blog-post.html");
    element.style.display = "none";
    globalThis.document.body.appendChild(element);
    element.click();
    globalThis.document.body.removeChild(element);
    toast.success("HTML file downloaded!");
  };

  /**
   * Publish to Shopify
   */
  const publishToShopify = async () => {
    if (!publishData.title.trim()) {
      toast.error("Please enter a blog title");
      return;
    }

    setIsPublishing(true);
    try {
      const response = await fetch("/api/publish-shopify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: documentContent,
          title: publishData.title,
          author: publishData.author || undefined,
          tags: publishData.tags
            ? publishData.tags.split(",").map((t) => t.trim())
            : undefined,
          publicationDate: publishData.publicationDate,
          imageUrls: Object.keys(imageUrls).length > 0 ? imageUrls : undefined,
        }),
      });

      const data = await response.json();

      // Check if images need to be uploaded first
      if (response.status === 202 && data.requiresImageUpload) {
        setImages(data.images || []);
        setImageUrls({}); // Reset image URLs
        setShowPublishModal(false);
        toast.info(`Found ${data.images.length} image(s). Please upload them first.`);
        return;
      }

      if (!response.ok) {
        toast.error(data.error || "Failed to publish to Shopify");
        return;
      }

      toast.success("Published to Shopify successfully!");
      setShowPublishModal(false);
      setPublishData({
        title: "",
        author: "",
        tags: "",
        publicationDate: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to publish to Shopify");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Blog Generator</h1>
          <p className="text-gray-600">
            Write content using section markers and we'll generate SEO-optimized HTML
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar: Section Buttons */}
          <div className="lg:col-span-1">
            {/* Upload Document Card */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Upload Document</CardTitle>
                <CardDescription>Load content from a file</CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.docx"
                  onChange={handleDocumentUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Upload size={16} />
                  Choose File
                </Button>
                <p className="text-xs text-gray-500 mt-3">
                  Supports: .txt, .md, .docx
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Insert</CardTitle>
                <CardDescription>Click to insert section markers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {sections.map((section) => (
                  <Button
                    key={section.id}
                    variant="outline"
                    className="w-full justify-start text-xs h-auto py-2"
                    onClick={() => insertSection(section.id)}
                  >
                    <span className="font-mono text-xs mr-2">{section.id}</span>
                    <span className="truncate">{section.name}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Info</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-3">
                <div>
                  <p className="font-semibold text-gray-700">Total Sections: 12</p>
                  <p className="text-gray-600">Each section has specific HTML rules</p>
                </div>
                {metadata && (
                  <div>
                    <p className="font-semibold text-gray-700">
                      Words: {metadata.totalWords}
                    </p>
                    <p className="text-gray-600">Sections: {metadata.totalSections}</p>
                    {metadata.warnings?.length > 0 && (
                      <p className="text-yellow-600">
                        ⚠️ {metadata.warnings.length} warning(s)
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b">
              <button
                onClick={() => setActiveTab("editor")}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === "editor"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === "preview"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Preview
              </button>
            </div>

            {/* Editor Tab */}
            {activeTab === "editor" && (
              <Card>
                <CardContent className="p-0">
                  <textarea
                    ref={textareaRef}
                    value={documentContent}
                    onChange={(e) => setDocumentContent(e.target.value)}
                    placeholder="Write your blog content here. Use {section1}, {section2}, etc. to mark sections."
                    className="w-full h-[600px] p-4 font-mono text-sm border-0 focus:ring-0 resize-none"
                  />
                </CardContent>
              </Card>
            )}

            {/* Preview Tab */}
            {activeTab === "preview" && (
              <>
                {html ? (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Generated HTML</CardTitle>
                        <CardDescription>
                          Your SEO-optimized blog post
                        </CardDescription>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={copyToClipboard}
                          className="gap-2"
                        >
                          <Copy size={16} />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={downloadHTML}
                          className="gap-2"
                        >
                          <Download size={16} />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowPublishModal(true)}
                          className="gap-2 bg-green-50 hover:bg-green-100 text-green-700"
                        >
                          <Upload size={16} />
                          Publish to Shopify
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 max-h-[500px] overflow-y-auto">
                        <div className="prose prose-sm max-w-none">
                          <pre className="text-xs whitespace-pre-wrap break-words bg-white p-4 rounded border">
                            {html}
                          </pre>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-gray-500">
                        Generate HTML first to see the preview
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Image Upload Section */}
            {images.length > 0 && (
              <Card className="mt-6 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-900">Upload Images to Shopify</CardTitle>
                  <CardDescription className="text-blue-800">
                    Your document contains {images.length} image(s). Upload them to generate the final HTML.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {images.map((image, idx) => (
                    <div key={`${image.sectionId}-${image.keyword}-${idx}`} className="flex items-center justify-between p-3 bg-white rounded border border-blue-200">
                      <div>
                        <p className="font-medium text-gray-900">{image.keyword}</p>
                        <p className="text-xs text-gray-600">Section: {image.sectionId}</p>
                        {imageUrls[image.keyword] && (
                          <p className="text-xs text-green-600 mt-1">✓ Uploaded</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          ref={(el) => {
                            if (el) imageFileInputsRef.current[image.keyword] = el;
                          }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={(e) => handleImageFileSelect(e, image.keyword)}
                          className="hidden"
                        />
                        {imageUrls[image.keyword] ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => imageFileInputsRef.current[image.keyword]?.click()}
                              disabled={uploadingImages[image.keyword]}
                              className="gap-2"
                            >
                              <Edit2 size={14} />
                              {uploadingImages[image.keyword] ? "Uploading..." : "Change"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeImage(image.keyword)}
                              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                              Remove
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => imageFileInputsRef.current[image.keyword]?.click()}
                            disabled={uploadingImages[image.keyword]}
                            className="gap-2"
                          >
                            <Upload size={14} />
                            {uploadingImages[image.keyword] ? "Uploading..." : "Upload"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Generate Button */}
            {(() => {
              // Check if all unique image keywords are uploaded
              const uniqueKeywords = new Set(images.map((img) => img.keyword));
              const allImagesUploaded = images.length === 0 || [...uniqueKeywords].every((keyword) => imageUrls[keyword]);
              return (
                <Button
                  onClick={generateBlogHTML}
                  disabled={isLoading}
                  className="w-full mt-6 h-12 gap-2 text-base font-semibold"
                >
                  <Zap size={18} />
                  {isLoading ? "Generating..." : "Generate Blog HTML"}
                </Button>
              );
            })()}

            {/* Warnings/Errors */}
            {metadata?.warnings?.length > 0 && (
              <Card className="mt-6 border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-yellow-800">Validation Warnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {metadata.warnings.map((warning: string, idx: number) => (
                      <li key={`warning-${idx}`} className="text-yellow-700 flex gap-2">
                        <span>⚠️</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {metadata?.missingRequired?.length > 0 && (
              <Card className="mt-6 border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800">Missing Required Sections</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {metadata.missingRequired.map((section: string, idx: number) => (
                      <li key={`missing-${idx}`} className="text-red-700 flex gap-2">
                        <span>❌</span>
                        <span>{section}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Shopify Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload size={20} />
                Publish to Shopify
              </CardTitle>
              <CardDescription>
                Configure and publish your blog post to Shopify
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blog Title *
                </label>
                <input
                  type="text"
                  value={publishData.title}
                  onChange={(e) =>
                    setPublishData({ ...publishData, title: e.target.value })
                  }
                  placeholder="Enter blog post title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Author
                </label>
                <input
                  type="text"
                  value={publishData.author}
                  onChange={(e) =>
                    setPublishData({ ...publishData, author: e.target.value })
                  }
                  placeholder="Author name (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  value={publishData.tags}
                  onChange={(e) =>
                    setPublishData({ ...publishData, tags: e.target.value })
                  }
                  placeholder="Comma-separated tags"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Publication Date
                </label>
                <input
                  type="date"
                  value={publishData.publicationDate}
                  onChange={(e) =>
                    setPublishData({
                      ...publishData,
                      publicationDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPublishModal(false)}
                  disabled={isPublishing}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={publishToShopify}
                  disabled={isPublishing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isPublishing ? "Publishing..." : "Publish"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
