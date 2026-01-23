/**
 * Shopify API Client
 * Handles publishing blog posts to Shopify
 */

interface ShopifyArticleInput {
  title: string;
  bodyHtml: string;
  author?: string;
  publishedAt?: string;
  tags?: string[];
  handle?: string;
}

interface ShopifyGraphQLResponse {
  data?: any;
  errors?: Array<{ message: string }>;
}

export class ShopifyClient {
  private shopName: string;
  private accessToken: string;
  private apiVersion: string;
  private baseUrl: string;

  constructor() {
    this.shopName = process.env.SHOPIFY_SHOP || "";
    this.accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
    this.apiVersion = process.env.SHOPIFY_API_VERSION || "2025-01";
    this.baseUrl = `https://${this.shopName}/admin/api/${this.apiVersion}`;
  }

  /**
   * Validate that Shopify credentials are configured
   */
  private validateCredentials(): void {
    if (!this.shopName || !this.accessToken) {
      throw new Error(
        "Shopify credentials not configured. Please set SHOPIFY_SHOP and SHOPIFY_ADMIN_ACCESS_TOKEN environment variables."
      );
    }
  }

  /**
   * Make a GraphQL request to Shopify
   */
  private async graphql(query: string, variables?: Record<string, any>): Promise<ShopifyGraphQLResponse> {
    this.validateCredentials();

    const response = await fetch(`${this.baseUrl}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.accessToken,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    return response.json() as Promise<ShopifyGraphQLResponse>;
  }

  /**
   * Publish a blog article to Shopify
   */
  async publishArticle(blogId: string, article: ShopifyArticleInput): Promise<string> {
    this.validateCredentials();

    // Use REST API instead of GraphQL for simpler implementation
    const restUrl = `${this.baseUrl.replace("/graphql.json", "")}/blogs/${blogId}/articles.json`;

    const response = await fetch(restUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.accessToken,
      },
      body: JSON.stringify({
        article: {
          title: article.title,
          body_html: article.bodyHtml,
          author: article.author || "Blog Generator",
          published_at: article.publishedAt || new Date().toISOString(),
          tags: article.tags?.join(",") || "",
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to publish article: ${error}`);
    }

    const data = await response.json() as { article: { id: string; title: string; handle: string } };
    return data.article.id;
  }

  /**
   * Update an existing article
   */
  async updateArticle(
    blogId: string,
    articleId: string,
    article: Partial<ShopifyArticleInput>
  ): Promise<string> {
    const restUrl = `${this.baseUrl.replace("/graphql.json", "")}/blogs/${blogId}/articles/${articleId}.json`;

    const updateData: any = {};
    if (article.title) updateData.title = article.title;
    if (article.bodyHtml) updateData.body_html = article.bodyHtml;
    if (article.author) updateData.author = article.author;
    if (article.tags) updateData.tags = article.tags.join(",");

    const response = await fetch(restUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.accessToken,
      },
      body: JSON.stringify({ article: updateData }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update article: ${error}`);
    }

    const data = await response.json() as { article: { id: string; title: string } };
    return data.article.id;
  }

  /**
   * Get blog ID from shop
   */
  async getBlogId(): Promise<string> {
    const blogIdEnv = process.env.BLOG_ID;
    if (blogIdEnv) {
      return blogIdEnv;
    }

    // Fetch blog ID from Shopify if not in env
    const restUrl = `${this.baseUrl.replace("/graphql.json", "")}/blogs.json`;

    const response = await fetch(restUrl, {
      headers: {
        "X-Shopify-Access-Token": this.accessToken,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch blogs from Shopify");
    }

    const data = await response.json() as { blogs: Array<{ id: string; title: string }> };
    
    if (data.blogs.length === 0) {
      throw new Error("No blogs found in this Shopify store");
    }

    // Return the first blog's ID
    return data.blogs[0].id;
  }

  /**
   * Upload an image to Shopify's File Storage
   * Uses stagedUploads -> fileCreate flow to properly register files
   */
  async uploadImage(fileBuffer: Buffer, filename: string, altText?: string): Promise<string> {
    try {
      // Determine MIME type from filename
      const mimeType = this.getMimeType(filename);

      // Step 1: Get signed upload URL using stagedUploadsCreate
      const stagedUploadQuery = `
        mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
          stagedUploadsCreate(input: $input) {
            stagedTargets {
              url
              resourceUrl
              parameters {
                name
                value
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const stagedVariables = {
        input: [
          {
            resource: "FILE",
            filename: filename,
            mimeType: mimeType,
            httpMethod: "POST",
          },
        ],
      };

      const stagedResponse = await this.graphql(stagedUploadQuery, stagedVariables);

      if (stagedResponse.errors || !stagedResponse.data?.stagedUploadsCreate?.stagedTargets?.length) {
        throw new Error(
          `Failed to get upload URL: ${stagedResponse.errors?.[0]?.message || "Unknown error"}`
        );
      }

      const stagedTarget = stagedResponse.data.stagedUploadsCreate.stagedTargets[0];
      const uploadUrl = stagedTarget.url;
      const parameters = stagedTarget.parameters || [];
      const resourceUrl = stagedTarget.resourceUrl;

      // Step 2: Upload file to signed URL
      const formData = new FormData();

      // Add parameters as form fields
      for (const param of parameters) {
        formData.append(param.name, param.value);
      }

      // Add file
      const uint8Array = new Uint8Array(fileBuffer);
      const headers: Record<string, string> = {};

      // Include Content-Length for AWS S3 targets
      if (uploadUrl.includes('amazonaws.com')) {
        headers['Content-Length'] = String(fileBuffer.length + 5000);
      }

      formData.append("file", new Blob([uint8Array], { type: mimeType }), filename);

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        headers,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload image: ${uploadResponse.statusText}`);
      }

      console.log("File uploaded successfully to staging URL:", resourceUrl);

      // Step 3: Create the file in Shopify's file storage using fileCreate mutation
      const fileCreateQuery = `
        mutation fileCreate($files: [FileCreateInput!]!) {
          fileCreate(files: $files) {
            files {
              id
              fileStatus
              alt
              preview { image { url } status }
            }
            userErrors { message }
          }
        }
      `;

      const fileCreateVariables = {
        files: [
          {
            alt: altText || filename,
            contentType: "IMAGE",
            originalSource: resourceUrl,
          },
        ],
      };

      console.log("Creating file record in Shopify for:", resourceUrl);
      const fileCreateResponse = await this.graphql(fileCreateQuery, fileCreateVariables);

      console.log("FileCreate response:", JSON.stringify(fileCreateResponse, null, 2));

      if (fileCreateResponse.errors) {
        console.error("FileCreate errors:", fileCreateResponse.errors);
        throw new Error(
          `FileCreate failed: ${fileCreateResponse.errors.map((e: any) => e.message).join('; ')}`
        );
      }

      const fileData = fileCreateResponse.data?.fileCreate;
      if (!fileData?.files?.length) {
        throw new Error("FileCreate returned no files");
      }

      const createdFile = fileData.files[0];
      let imageUrl = createdFile.preview?.image?.url || null;

      // If file is not fully processed, poll for the image URL
      if (!imageUrl && createdFile.fileStatus === 'UPLOADED') {
        const fileId = createdFile.id;
        console.log("File uploaded but not yet processed, polling for image URL. File ID:", fileId);

        for (let i = 0; i < 5; i++) {
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const pollQuery = `
            query getFile($id: ID!) {
              node(id: $id) {
                ... on MediaImage {
                  fileStatus
                  preview { image { url } status }
                }
                ... on GenericFile {
                  fileStatus
                  preview { image { url } status }
                }
              }
            }
          `;

          const pollResponse = await this.graphql(pollQuery, { id: fileId });
          const node = pollResponse.data?.node;

          if (!node) break;

          const status = node.fileStatus || node.preview?.status;
          const url = node.preview?.image?.url;

          if (url) {
            imageUrl = url;
            console.log("Poll successful, obtained image URL:", imageUrl);
            break;
          }

          if (status === 'READY') break;

          console.log(`Poll attempt ${i + 1}: File status is ${status}, waiting...`);
        }
      }

      if (!imageUrl) {
        // Fallback to resourceUrl if processing is delayed
        console.warn("Image URL not obtained from preview, using resourceUrl as fallback");
        imageUrl = resourceUrl;
      }

      console.log("Successfully uploaded image. Final URL:", imageUrl);
      return imageUrl;
    } catch (error) {
      throw new Error(
        `Image upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Determine MIME type from filename
   */
  private getMimeType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    return mimeTypes[ext] || "image/jpeg";
  }

  /**
   * Validate Shopify connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      const restUrl = `${this.baseUrl.replace("/graphql.json", "")}/shop.json`;

      const response = await fetch(restUrl, {
        headers: {
          "X-Shopify-Access-Token": this.accessToken,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Singleton instance
 */
let client: ShopifyClient | null = null;

export function getShopifyClient(): ShopifyClient {
  if (!client) {
    const shopName = process.env.SHOPIFY_SHOP;
    const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

    if (!shopName || !accessToken) {
      throw new Error(
        "Shopify credentials not configured. Please set SHOPIFY_SHOP and SHOPIFY_ADMIN_ACCESS_TOKEN environment variables."
      );
    }

    client = new ShopifyClient();
  }
  return client;
}
