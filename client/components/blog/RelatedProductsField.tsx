import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, X, Plus } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  title: string;
  handle: string;
  image?: string;
}

interface RelatedProductsFieldProps {
  selectedProducts: Product[];
  onChange: (products: Product[]) => void;
}

export function RelatedProductsField({
  selectedProducts,
  onChange,
}: RelatedProductsFieldProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch all products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        // Fetch more products to ensure we get all or most products from the store
        const response = await fetch("/api/products?limit=250");

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API error (${response.status}):`, errorText);
          throw new Error(`Failed to fetch products: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          console.error(`Invalid content type: ${contentType}`);
          throw new Error("Server returned invalid response format");
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
        } else if (Array.isArray(data)) {
          setProducts(data);
        } else {
          console.error("Unexpected response format:", data);
          toast.error("Invalid products data received");
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to fetch products: ${errorMsg}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    // Exclude already selected products
    const isSelected = selectedProducts.some((p) => p.id === product.id);
    if (isSelected) return false;

    // Filter by search term (if provided)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      return (
        product.title.toLowerCase().includes(searchLower) ||
        product.handle.toLowerCase().includes(searchLower)
      );
    }

    // If no search term, show all products
    return true;
  });

  const handleAddProduct = (product: Product) => {
    if (selectedProducts.length < 5) {
      onChange([...selectedProducts, product]);
      setSearchTerm("");
      setShowDropdown(false);
      toast.success(`Added "${product.title}" to related products`);
    } else {
      toast.error("Maximum 5 related products allowed");
    }
  };

  const handleRemoveProduct = (productId: string) => {
    onChange(selectedProducts.filter((p) => p.id !== productId));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold mb-2 block">
          Related Products
          <span className="text-sm text-gray-500 font-normal ml-2">
            (Optional - max 5)
          </span>
        </Label>
        <p className="text-sm text-gray-600 mb-4">
          Select products to display as related items in this blog post
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder={isLoading ? "Loading products..." : "Search products or click to browse..."}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => {
                setShowDropdown(true);
              }}
              onBlur={() => {
                // Delay closing dropdown to allow click handling
                setTimeout(() => setShowDropdown(false), 200);
              }}
              disabled={isLoading}
              className="pl-10"
            />
          </div>
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleAddProduct(product)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3 transition-colors"
                >
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {product.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {product.handle}
                    </p>
                  </div>
                  <Plus className="w-4 h-4 text-blue-500 flex-shrink-0" />
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No products found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Products */}
      {selectedProducts.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Selected Products ({selectedProducts.length}/5)
          </p>
          <div className="space-y-2">
            {selectedProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {product.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {product.handle}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveProduct(product.id)}
                  className="p-1 hover:bg-blue-100 rounded transition-colors flex-shrink-0"
                  title="Remove product"
                >
                  <X className="w-4 h-4 text-blue-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedProducts.length === 0 && !showDropdown && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <p className="text-sm text-gray-600">
            No related products selected yet
          </p>
        </div>
      )}
    </div>
  );
}
