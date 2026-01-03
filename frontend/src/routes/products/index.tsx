import { component$, useSignal, useComputed$ } from "@builder.io/qwik";
import { type DocumentHead, useLocation } from "@builder.io/qwik-city";
import { ProductCard } from "~/components/product/product-card";

// Dummy products data
const dummyProducts = [
  {
    productId: "1",
    productName: "Wireless Bluetooth Headphones with Noise Cancellation",
    slug: "wireless-headphones",
    productAsset: { 
      id: "1", 
      preview: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      source: ""
    },
    priceWithTax: { __typename: "SinglePrice" as const, value: 7999 },
    currencyCode: "USD"
  },
  {
    productId: "2",
    productName: "Smart Watch Fitness Tracker with Heart Rate Monitor",
    slug: "smart-watch",
    productAsset: { 
      id: "2", 
      preview: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
      source: ""
    },
    priceWithTax: { __typename: "SinglePrice" as const, value: 12999 },
    currencyCode: "USD"
  },
  {
    productId: "3",
    productName: "4K Ultra HD Smart TV 55 inch with HDR",
    slug: "smart-tv",
    productAsset: { 
      id: "3", 
      preview: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&h=400&fit=crop",
      source: ""
    },
    priceWithTax: { __typename: "SinglePrice" as const, value: 54999 },
    currencyCode: "USD"
  },
  {
    productId: "4",
    productName: "Professional DSLR Camera with 18-55mm Lens",
    slug: "dslr-camera",
    productAsset: { 
      id: "4", 
      preview: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop",
      source: ""
    },
    priceWithTax: { __typename: "SinglePrice" as const, value: 89999 },
    currencyCode: "USD"
  },
  {
    productId: "5",
    productName: "Gaming Laptop 15.6 inch Intel i7 RTX 3060",
    slug: "gaming-laptop",
    productAsset: { 
      id: "5", 
      preview: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=400&fit=crop",
      source: ""
    },
    priceWithTax: { __typename: "SinglePrice" as const, value: 129999 },
    currencyCode: "USD"
  },
  {
    productId: "6",
    productName: "Wireless Mechanical Gaming Keyboard RGB",
    slug: "gaming-keyboard",
    productAsset: { 
      id: "6", 
      preview: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop",
      source: ""
    },
    priceWithTax: { __typename: "SinglePrice" as const, value: 8999 },
    currencyCode: "USD"
  },
  {
    productId: "7",
    productName: "Premium Leather Wallet with RFID Protection",
    slug: "leather-wallet",
    productAsset: { 
      id: "7", 
      preview: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop",
      source: ""
    },
    priceWithTax: { __typename: "SinglePrice" as const, value: 3999 },
    currencyCode: "USD"
  },
  {
    productId: "8",
    productName: "Stainless Steel Water Bottle 32oz Insulated",
    slug: "water-bottle",
    productAsset: { 
      id: "8", 
      preview: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop",
      source: ""
    },
    priceWithTax: { __typename: "SinglePrice" as const, value: 2499 },
    currencyCode: "USD"
  },
  {
    productId: "9",
    productName: "Yoga Mat Non-Slip Extra Thick with Carrying Strap",
    slug: "yoga-mat",
    productAsset: { 
      id: "9", 
      preview: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop",
      source: ""
    },
    priceWithTax: { __typename: "SinglePrice" as const, value: 2999 },
    currencyCode: "USD"
  },
  {
    productId: "10",
    productName: "Instant Pot 8 Quart Pressure Cooker 10-in-1",
    slug: "instant-pot",
    productAsset: { 
      id: "10", 
      preview: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop",
      source: ""
    },
    priceWithTax: { __typename: "SinglePrice" as const, value: 9999 },
    currencyCode: "USD"
  },
  {
    productId: "11",
    productName: "Coffee Maker Programmable 12-Cup with Auto Brew",
    slug: "coffee-maker",
    productAsset: { 
      id: "11", 
      preview: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400&h=400&fit=crop",
      source: ""
    },
    priceWithTax: { __typename: "SinglePrice" as const, value: 4999 },
    currencyCode: "USD"
  },
  {
    productId: "12",
    productName: "Portable Bluetooth Speaker Waterproof IPX7",
    slug: "bluetooth-speaker",
    productAsset: { 
      id: "12", 
      preview: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop",
      source: ""
    },
    priceWithTax: { __typename: "SinglePrice" as const, value: 5999 },
    currencyCode: "USD"
  }
];

export default component$(() => {
  const loc = useLocation();
  const searchTerm = useSignal(loc.url.searchParams.get("q") || "");

  const filteredProducts = useComputed$(() => {
    if (!searchTerm.value) return dummyProducts;
    
    const term = searchTerm.value.toLowerCase();
    return dummyProducts.filter(p => 
      p.productName.toLowerCase().includes(term)
    );
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

      <p class="results-count">{filteredProducts.value.length} products found</p>
      
      {filteredProducts.value.length === 0 ? (
        <div class="empty-state">
          <p>No products found matching your search.</p>
        </div>
      ) : (
        <div class="grid grid-4">
          {filteredProducts.value.map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </div>
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
        .results-count {
          color: var(--text-muted);
          margin-bottom: 1.5rem;
        }
        .empty-state {
          text-align: center;
          padding: 3rem;
          color: var(--text-muted);
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
