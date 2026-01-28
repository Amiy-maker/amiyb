import { useState } from "react";
import { ImageUploadField } from "../ImageUploadField";
import { suggestAltText } from "@/lib/blog-validation";
import type { BlogPost } from "@/types/blog";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface FeaturedImageSectionProps {
  post: BlogPost;
  onUpdatePost: (updates: Partial<BlogPost>) => void;
}

export function FeaturedImageSection({ post, onUpdatePost }: FeaturedImageSectionProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = (imageData: typeof post.featuredImage) => {
    // Reset URL when a new file is selected
    onUpdatePost({
      featuredImage: {
        ...imageData,
        alt: imageData.alt || suggestAltText("featured", post.primaryKeyword),
        url: undefined, // Clear Shopify URL when new file is selected
      },
    });
  };

  const uploadToShopify = async () => {
    if (!post.featuredImage.file) {
      toast.error("Please select an image first");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", post.featuredImage.file);
      formData.append("keyword", "featured-image");

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Upload failed: ${data.error || "Unknown error"}`);
        return;
      }

      if (!data.imageUrl) {
        toast.error("Image uploaded but URL not returned");
        return;
      }

      // Update post with the Shopify URL
      onUpdatePost({
        featuredImage: {
          ...post.featuredImage,
          url: data.imageUrl,
        },
      });

      toast.success("Featured image uploaded to Shopify!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <ImageUploadField
        label="Featured Image"
        value={post.featuredImage}
        onChange={handleImageChange}
        suggestedAltText={suggestAltText("featured", post.primaryKeyword)}
        required={true}
        helpText="This image will appear at the top of your blog post. Choose a high-quality, relevant image that represents your topic."
      />

      {/* Upload to Shopify button - show when file is selected but not yet uploaded */}
      {post.featuredImage.file && !post.featuredImage.url && (
        <div className="flex gap-3">
          <Button
            onClick={uploadToShopify}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {isUploading ? "Uploading..." : "Upload to Shopify"}
          </Button>
          <p className="text-sm text-gray-600 flex items-center">
            Upload to Shopify to make this image available for publishing
          </p>
        </div>
      )}

      {/* Show upload status */}
      {post.featuredImage.url && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-4 rounded-lg border border-green-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Image uploaded to Shopify</p>
            <p className="text-xs text-green-600 mt-1">Ready for publishing</p>
          </div>
        </div>
      )}

      {/* Error state if upload failed */}
      {post.featuredImage.file && !post.featuredImage.url && isUploading && (
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="animate-spin w-4 h-4 border-2 border-blue-300 border-t-blue-700 rounded-full"></div>
          <p>Uploading image to Shopify...</p>
        </div>
      )}

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
        <p className="text-sm text-blue-900">
          <strong>📏 Image Guidelines:</strong>
        </p>
        <ul className="text-sm text-blue-800 space-y-1 ml-4">
          <li>• Use landscape format (16:9 aspect ratio)</li>
          <li>• File size: less than 5MB</li>
          <li>• Formats: JPG, PNG, or WebP</li>
          <li>• Alt text is required for SEO and accessibility</li>
          <li>• Click "Upload to Shopify" to prepare image for publishing</li>
        </ul>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>💡 Tip:</strong> The alt text helps search engines understand your
          image and improves accessibility for screen readers. Make sure it describes
          the image content and includes your primary keyword when possible.
        </p>
      </div>
    </div>
  );
}
