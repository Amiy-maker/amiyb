import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

interface DiagnosticData {
  timestamp: string;
  status: "ok" | "error";
  issues: string[];
  environment: {
    [key: string]: string;
  };
  connection: {
    status: string;
    shopName?: string;
    url?: string;
    responseStatus?: number;
    responseStatusText?: string;
    error?: string;
  } | null;
}

export default function ShopifyDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/diagnose-shopify");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setDiagnostics(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch diagnostics"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const downloadDiagnostics = () => {
    if (!diagnostics) return;

    const text = `
SHOPIFY CONFIGURATION DIAGNOSTIC REPORT
======================================

Generated: ${diagnostics.timestamp}
Status: ${diagnostics.status}

ENVIRONMENT VARIABLES
${Object.entries(diagnostics.environment)
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}

CONNECTION TEST
${diagnostics.connection ? `Status: ${diagnostics.connection.status}
${diagnostics.connection.url ? `URL: ${diagnostics.connection.url}` : ""}
${diagnostics.connection.responseStatus ? `Response: ${diagnostics.connection.responseStatus} ${diagnostics.connection.responseStatusText}` : ""}
${diagnostics.connection.shopName ? `Shop Name: ${diagnostics.connection.shopName}` : ""}
${diagnostics.connection.error ? `Error: ${diagnostics.connection.error}` : ""}` : "Not tested"}

ISSUES FOUND
${diagnostics.issues.length > 0 ? diagnostics.issues.map((issue) => `• ${issue}`).join("\n") : "✓ No issues found"}

HOW TO FIX COMMON ISSUES
========================

1. SHOPIFY_SHOP not set:
   • Go to your Shopify admin
   • Copy your shop name (format: myshop.myshopify.com)
   • Add SHOPIFY_SHOP=myshop.myshopify.com to your .env file or environment variables

2. SHOPIFY_ADMIN_ACCESS_TOKEN not set:
   • Go to Shopify Admin → Settings → Apps and integrations → Develop apps
   • Create a new app for development
   • In the app configuration, under "Admin API", check the required scopes include:
     - write_articles, read_articles, write_products, read_products
     - write_files, read_files (for image uploads)
   • Generate an access token
   • Add SHOPIFY_ADMIN_ACCESS_TOKEN=<your-token> to your environment variables

3. Invalid access token (401 error):
   • Regenerate the access token in your Shopify app
   • Ensure all required scopes are enabled
   • Update the SHOPIFY_ADMIN_ACCESS_TOKEN with the new token

4. Shop not found (404 error):
   • Verify the shop name is correct (e.g., myshop.myshopify.com)
   • Check there are no typos in SHOPIFY_SHOP
   • Ensure the shop is active and not in a different region

5. Blog not found:
   • Log into your Shopify store
   • Navigate to Content → Blog posts
   • Ensure there is at least one blog created
   • If using BLOG_ID, verify the ID is correct
`.trim();

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shopify-diagnostics-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">Shopify Connection Diagnostics</CardTitle>
            <CardDescription className="text-blue-100">
              Troubleshoot your Shopify setup and configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600">Loading diagnostics...</p>
                </div>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800">Error</p>
                  <p className="text-red-700">{error}</p>
                  <Button
                    onClick={fetchDiagnostics}
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-2"
                  >
                    <RefreshCw size={16} />
                    Try Again
                  </Button>
                </div>
              </div>
            ) : diagnostics ? (
              <div className="space-y-6">
                {/* Overall Status */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {diagnostics.status === "ok" ? (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        <h2 className="text-lg font-semibold text-green-900">
                          Configuration Status: OK
                        </h2>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                        <h2 className="text-lg font-semibold text-red-900">
                          Configuration Status: Issues Found
                        </h2>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Last checked: {new Date(diagnostics.timestamp).toLocaleString()}
                  </p>
                </div>

                {/* Environment Variables */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Environment Variables
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(diagnostics.environment).map(([key, value]) => (
                      <div
                        key={key}
                        className={`p-3 rounded-lg border ${
                          value.includes("SET")
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {value.includes("SET") ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="font-mono text-sm font-semibold text-gray-900">
                              {key}
                            </p>
                            <p
                              className={
                                value.includes("SET")
                                  ? "text-green-700"
                                  : "text-red-700"
                              }
                            >
                              {value}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connection Status */}
                {diagnostics.connection && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Connection Test
                    </h3>
                    <div
                      className={`p-4 rounded-lg border ${
                        diagnostics.connection.status.includes("Connected")
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {diagnostics.connection.status.includes("Connected") ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span
                            className={
                              diagnostics.connection.status.includes("Connected")
                                ? "text-green-900"
                                : "text-red-900"
                            }
                          >
                            {diagnostics.connection.status}
                          </span>
                        </div>
                        {diagnostics.connection.url && (
                          <p className="text-sm text-gray-600 font-mono">
                            {diagnostics.connection.url}
                          </p>
                        )}
                        {diagnostics.connection.responseStatus && (
                          <p className="text-sm text-gray-600">
                            Response: {diagnostics.connection.responseStatus}{" "}
                            {diagnostics.connection.responseStatusText}
                          </p>
                        )}
                        {diagnostics.connection.shopName && (
                          <p className="text-sm text-green-700">
                            ✓ Shop: {diagnostics.connection.shopName}
                          </p>
                        )}
                        {diagnostics.connection.error && (
                          <p className="text-sm text-red-700">
                            Error: {diagnostics.connection.error}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Issues Found */}
                {diagnostics.issues.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Issues Found
                    </h3>
                    <div className="space-y-2">
                      {diagnostics.issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2"
                        >
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <p className="text-yellow-800">{issue}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={fetchDiagnostics}
                    variant="outline"
                    className="gap-2"
                  >
                    <RefreshCw size={16} />
                    Refresh Diagnostics
                  </Button>
                  <Button
                    onClick={downloadDiagnostics}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    Download Report
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  How to Get Your Shopify Credentials
                </h4>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>
                    Go to your Shopify Admin and navigate to{" "}
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      Settings → Apps and integrations → Develop apps
                    </code>
                  </li>
                  <li>
                    Click "Create an app" or use an existing development app
                  </li>
                  <li>
                    Go to Configuration and enable the Admin API with these
                    scopes:
                    <ul className="list-disc list-inside mt-1 ml-4">
                      <li>write_articles, read_articles</li>
                      <li>write_products, read_products</li>
                      <li>write_files, read_files</li>
                    </ul>
                  </li>
                  <li>Click "Save" then "Generate access token"</li>
                  <li>
                    Copy your <strong>Shop name</strong> and{" "}
                    <strong>Access token</strong>
                  </li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Setting Environment Variables
                </h4>
                <p>
                  Add these to your <code className="bg-gray-100 px-2 py-1 rounded">.env</code> file or deployment
                  environment:
                </p>
                <pre className="bg-gray-100 p-3 rounded mt-2 overflow-x-auto text-xs">
{`SHOPIFY_SHOP=your-shop.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx
SHOPIFY_API_VERSION=2025-01
BLOG_ID=optional-blog-id`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
