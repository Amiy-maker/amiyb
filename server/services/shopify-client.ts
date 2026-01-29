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
  image?: {
    src: string;
    alt?: string;
  };
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
    const restUrl = `${this.baseUrl}/blogs/${blogId}/articles.json`;

    const articleData: any = {
      title: article.title,
      body_html: article.bodyHtml,
      author: article.author || "Blog Generator",
      published_at: article.publishedAt || new Date().toISOString(),
      tags: article.tags?.join(",") || "",
    };

    // Include featured image if provided
    // Shopify REST API expects image.src to be a valid, publicly accessible URL
    if (article.image?.src) {
      // Ensure the URL is properly formatted for Shopify
      const imageUrl = article.image.src;

      // Validate URL format - must be absolute HTTP/HTTPS URL
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        console.error('Invalid featured image URL format:', imageUrl);
        throw new Error(
          `Featured image URL must be an absolute HTTP/HTTPS URL. ` +
          `Received: ${imageUrl}. ` +
          `Please ensure the image was successfully uploaded to Shopify.`
        );
      }

      // Additional validation: try to parse as URL
      try {
        new URL(imageUrl);
      } catch (urlError) {
        console.error('Featured image URL parse error:', urlError);
        throw new Error(
          `Featured image URL is malformed: ${imageUrl}. ` +
          `Please ensure you're using a valid Shopify image URL.`
        );
      }

      articleData.image = {
        src: imageUrl,
      };

      if (article.image.alt) {
        articleData.image.alt = article.image.alt;
      }

      console.log(`Publishing article with featured image URL: ${imageUrl}`);
    } else {
      console.warn('No featured image provided for article');
    }

    const response = await fetch(restUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.accessToken,
      },
      body: JSON.stringify({ article: articleData }),
    });

    const responseData = await response.json() as any;

    if (!response.ok) {
      const error = JSON.stringify(responseData, null, 2);
      console.error("Article creation failed:", error);
      throw new Error(`Failed to publish article: ${error}`);
    }

    if (responseData.errors) {
      console.error("Shopify API returned errors:", responseData.errors);
      throw new Error(`Shopify API error: ${JSON.stringify(responseData.errors)}`);
    }

    const articleId = responseData.article?.id;
    if (!articleId) {
      console.error("No article ID in response:", responseData);
      throw new Error("Failed to get article ID from response");
    }

    // Log article details including image
    const publishedArticle = responseData.article;
    console.log(`Article created successfully. Article ID: ${articleId}`);
    console.log(`Article image field set: ${!!publishedArticle.image}`);
    if (publishedArticle.image) {
      console.log(`  Image src: ${publishedArticle.image.src}`);
      console.log(`  Image alt: ${publishedArticle.image.alt || 'N/A'}`);
    }

    return articleId;
  }

  /**
   * Update an existing article
   */
  async updateArticle(
    blogId: string,
    articleId: string,
    article: Partial<ShopifyArticleInput>
  ): Promise<string> {
    const restUrl = `${this.baseUrl}/blogs/${blogId}/articles/${articleId}.json`;

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
    this.validateCredentials();

    const blogIdEnv = process.env.BLOG_ID;
    if (blogIdEnv) {
      return blogIdEnv;
    }

    // Fetch blog ID from Shopify if not in env
    const restUrl = `${this.baseUrl}/blogs.json`;

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
      formData.append("file", new Blob([uint8Array], { type: mimeType }), filename);

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
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

        for (let i = 0; i < 30; i++) {
          await new Promise((resolve) => setTimeout(resolve, 2000));

          const pollQuery = `
            query getFile($id: ID!) {
              node(id: $id) {
                ... on MediaImage {
                  id
                  fileStatus
                  preview { image { url } status }
                  image {
                    url
                  }
                }
                ... on GenericFile {
                  id
                  fileStatus
                  preview { image { url } status }
                  url
                }
              }
            }
          `;

          const pollResponse = await this.graphql(pollQuery, { id: fileId });

          if (pollResponse.errors) {
            console.error("Poll error:", pollResponse.errors);
            continue;
          }

          const node = pollResponse.data?.node;

          if (!node) {
            console.log(`Poll attempt ${i + 1}: Node not found, retrying...`);
            continue;
          }

          const status = node.fileStatus || node.preview?.status;
          const previewUrl = node.preview?.image?.url;
          const imageUrlDirect = node.image?.url;
          const genericUrl = node.url;
          const url = previewUrl || imageUrlDirect || genericUrl;

          console.log(`Poll attempt ${i + 1}: Status ${status}, previewUrl: ${!!previewUrl}, imageUrl: ${!!imageUrlDirect}, genericUrl: ${!!genericUrl}`);

          if (url) {
            imageUrl = url;
            console.log("Poll successful, obtained image URL:", imageUrl);
            break;
          }

          if (status === 'READY') {
            console.log(`File status is READY but no URL found yet, continuing to poll...`);
            continue;
          }

          console.log(`Poll attempt ${i + 1}: File status is ${status}, waiting...`);
        }
      }

      if (!imageUrl) {
        // If we still don't have a URL after polling, throw an error
        // The staging resourceUrl won't be accessible to Shopify when rendering the article
        throw new Error(
          "Image processing timeout: Shopify took too long to process the image. " +
          "Please try uploading again. If the problem persists, check that your image file is valid."
        );
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
   * Fetch products from Shopify
   */
  async getProducts(limit: number = 250): Promise<Array<{ id: string; title: string; handle: string; image?: string }>> {
    this.validateCredentials();

    const restUrl = `${this.baseUrl}/products.json?limit=${Math.min(limit, 250)}&fields=id,title,handle,image`;

    try {
      const response = await fetch(restUrl, {
        headers: {
          "X-Shopify-Access-Token": this.accessToken,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Shopify API error (${response.status}):`, errorText);
        throw new Error(`Failed to fetch products from Shopify: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        const errorText = await response.text();
        console.error("Invalid content type. Expected JSON but got:", contentType);
        console.error("Response body:", errorText);
        throw new Error(`Invalid response format from Shopify. Expected JSON but got ${contentType}`);
      }

      const data = await response.json() as { products: Array<{ id: string; title: string; handle: string; image?: { src: string } }> };

      if (!data.products) {
        console.warn("No products found in Shopify response");
        return [];
      }

      return data.products.map((product) => ({
        id: product.id,
        title: product.title,
        handle: product.handle,
        image: product.image?.src,
      }));
    } catch (error) {
      console.error("Error in getProducts:", error);
      throw error;
    }
  }

  /**
   * Update article metafield
   */
  async updateArticleMetafield(
    blogId: string,
    articleId: string,
    namespace: string,
    key: string,
    value: string,
    valueType: "string" | "json" = "json"
  ): Promise<boolean> {
    this.validateCredentials();

    const graphqlQuery = `
      mutation updateMetafield($input: MetafieldsSetInput!) {
        metafieldsSet(input: $input) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const articleGid = `gid://shopify/Article/${articleId.split('/').pop()}`;

    const variables = {
      input: {
        ownerId: articleGid,
        metafields: [
          {
            namespace,
            key,
            value,
            type: valueType,
          },
        ],
      },
    };

    const response = await this.graphql(graphqlQuery, variables);

    if (response.errors) {
      console.error("Update metafield error:", response.errors);
      throw new Error(`Failed to update metafield: ${response.errors.map((e: any) => e.message).join('; ')}`);
    }

    const metafieldData = response.data?.metafieldsSet;
    if (metafieldData?.userErrors?.length > 0) {
      console.error("Metafield user errors:", metafieldData.userErrors);
      throw new Error(`Metafield error: ${metafieldData.userErrors.map((e: any) => e.message).join('; ')}`);
    }

    return true;
  }

  /**
   * Validate Shopify connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      this.validateCredentials();

      const restUrl = `${this.baseUrl}/shop.json`;
      console.log(`Validating Shopify connection. URL: ${restUrl}`);
      console.log(`Shop name: ${this.shopName}`);
      console.log(`API version: ${this.apiVersion}`);

      const response = await fetch(restUrl, {
        headers: {
          "X-Shopify-Access-Token": this.accessToken,
        },
      });

      console.log(`Shopify shop.json response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Shopify API error (${response.status}): ${errorText}`);

        if (response.status === 401) {
          throw new Error("Authentication failed - Invalid or expired access token. Please regenerate your Shopify API access token.");
        } else if (response.status === 404) {
          throw new Error("Shop not found - Please check that SHOPIFY_SHOP is correctly formatted (e.g., myshop.myshopify.com).");
        } else if (response.status >= 400 && response.status < 500) {
          throw new Error(`Client error: ${response.statusText}. Please verify your Shopify credentials.`);
        } else {
          throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log(`Successfully connected to Shopify shop: ${data.shop?.name}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Shopify connection validation error:", errorMessage);
      throw new Error(errorMessage);
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
