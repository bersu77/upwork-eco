import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { type DocumentHead, useLocation } from "@builder.io/qwik-city";
import { ProductCard } from "~/components/product/product-card";
import { productService } from "~/services/graphql";
import type { SearchResult } from "~/services/graphql/types";

export default component$(() => {
  const loc = useLocation();
  const searchTerm = useSignal(loc.url.searchParams.get("q") || "");
  const products = useSignal<SearchResult[]>([]);
  const isLoading = useSignal(true);
  const error = useSignal<string | null>(null);

  // Fetch products from API
  useVisibleTask$(async ({ track }) => {
    track(() => searchTerm.value);
    
    try {
      isLoading.value = true;
      error.value = null;

      const searchInput: any = {
        groupByProduct: true,
        take: 50,
        skip: 0,
      };

      if (searchTerm.value) {
        searchInput.term = searchTerm.value;
      }

      const result = await productService.searchProducts(searchInput);
      products.value = result.items || [];
    } catch (err) {
      console.error("Error fetching products:", err);
      error.value = err instanceof Error ? err.message : "Failed to load products";
      products.value = [];
    } finally {
      isLoading.value = false;
    }
  });

  return (
    <div class="container">
      <div class="products-header">
        <h1>Products</h1>
        
        <div class="search-box">
          <input
            type="text"
            class="input"
            placeholder="Search products..."
            value={searchTerm.value}
            onInput$={(e) => {
              searchTerm.value = (e.target as HTMLInputElement).value;
            }}
          />
        </div>
      </div>

      {isLoading.value ? (
        <div class="loading-state">
          <div class="spinner" />
          <p>Loading products...</p>
        </div>
      ) : error.value ? (
        <div class="error-state">
          <p>Error: {error.value}</p>
          <p class="error-hint">Make sure the backend is running at http://localhost:3000</p>
        </div>
      ) : (
        <>
          <p class="results-count">{products.value.length} products found</p>
          
          {products.value.length === 0 ? (
            <div class="empty-state">
              <p>No products found matching your search.</p>
            </div>
          ) : (
            <div class="grid grid-4">
              {products.value.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
          )}
        </>
      )}

      <style>
        {`
        .products-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .products-header h1 {
          font-size: 2rem;
        }
        .search-box {
          width: 300px;
        }
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border);
          border-radius: 4px;
          font-size: 1rem;
        }
        .input:focus {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }
        .results-count {
          color: var(--text-muted);
          margin-bottom: 1.5rem;
        }
        .loading-state,
        .error-state,
        .empty-state {
          text-align: center;
          padding: 3rem;
          color: var(--text-muted);
        }
        .error-state {
          color: #dc2626;
        }
        .error-hint {
          font-size: 0.875rem;
          margin-top: 0.5rem;
          color: var(--text-muted);
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1rem;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 640px) {
          .search-box {
            width: 100%;
          }
        }
        `}
      </style>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Products - Shop PWA",
  meta: [{ name: "description", content: "Browse our product catalog" }],
};
