import { component$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";
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

  return (
    <>
      {/* Hero Banner */}
      <div class="hero-banner">
        <div class="container">
          <div class="hero-content">
            <h1>Welcome to your one-stop shop</h1>
            <p>Find everything you need from electronics to fashion</p>
            <Link href="/products" class="btn btn-primary hero-cta">
              Shop Now
            </Link>
          </div>
        </div>
      </div>

      <div class="container main-content">
        {/* Category Cards */}
        <div class="category-grid">
          <div class="category-card">
            <h3>Electronics</h3>
            <img src="/placeholder-electronics.jpg" alt="Electronics" />
            <Link href="/products?category=electronics">Shop now</Link>
          </div>
          <div class="category-card">
            <h3>Fashion</h3>
            <img src="/placeholder-fashion.jpg" alt="Fashion" />
            <Link href="/products?category=fashion">Shop now</Link>
          </div>
          <div class="category-card">
            <h3>Home & Kitchen</h3>
            <img src="/placeholder-home.jpg" alt="Home" />
            <Link href="/products?category=home">Shop now</Link>
          </div>
          <div class="category-card">
            <h3>Books</h3>
            <img src="/placeholder-books.jpg" alt="Books" />
            <Link href="/products?category=books">Shop now</Link>
          </div>
        </div>

        {/* Deals Section */}
        <section class="deals-section">
          <div class="section-header">
            <h2>Today's Deals</h2>
            <Link href="/products" class="see-more">See all deals</Link>
          </div>

          <div class="products-grid">
            {dummyProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </div>
        </section>

        {/* More Products */}
        <section class="deals-section">
          <div class="section-header">
            <h2>Popular Products</h2>
            <Link href="/products" class="see-more">See more</Link>
          </div>

          <div class="products-grid">
            {dummyProducts.slice(8).map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </div>
        </section>

        {/* Promotional Banner */}
        <div class="promo-banner">
          <div class="promo-content">
            <h2>Sign up and get 20% off your first order</h2>
            <p>Plus, get free shipping on orders over $35</p>
            <Link href="/auth/signup" class="btn btn-primary">
              Sign Up Now
            </Link>
          </div>
        </div>
      </div>

      <style>
        {`
        .hero-banner {
          background: linear-gradient(to bottom, #f0f2f2, #e7e9ec);
          padding: 3rem 0;
          margin-bottom: 2rem;
        }
        
        .hero-content {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .hero-content h1 {
          font-size: 2.5rem;
          font-weight: 500;
          margin-bottom: 1rem;
          color: var(--text);
        }
        
        .hero-content p {
          font-size: 1.125rem;
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }
        
        .hero-cta {
          padding: 0.75rem 2.5rem;
          font-size: 1rem;
        }
        
        .main-content {
          padding: 1rem 0 3rem;
        }
        
        .category-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        
        .category-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(15, 17, 17, 0.08);
          text-align: center;
        }
        
        .category-card h3 {
          font-size: 1.25rem;
          font-weight: 500;
          margin-bottom: 1rem;
          color: var(--text);
        }
        
        .category-card img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          margin-bottom: 1rem;
          border-radius: 4px;
          background: var(--background);
        }
        
        .category-card a {
          color: var(--text-secondary);
          font-size: 0.9rem;
          text-decoration: none;
        }
        
        .category-card a:hover {
          color: var(--primary-dark);
          text-decoration: underline;
        }
        
        .deals-section {
          margin-bottom: 2.5rem;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-light);
        }
        
        .section-header h2 {
          font-size: 1.75rem;
          font-weight: 500;
          color: var(--text);
        }
        
        .see-more {
          color: var(--text-secondary);
          font-size: 0.9rem;
          text-decoration: none;
        }
        
        .see-more:hover {
          color: var(--primary-dark);
        }
        
        .products-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
        
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4rem 2rem;
          gap: 1rem;
        }
        
        .spinner-large {
          width: 48px;
          height: 48px;
          border: 4px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .error-state {
          text-align: center;
          padding: 3rem 2rem;
        }
        
        .error-state p {
          color: var(--error);
          margin-bottom: 1.5rem;
          font-size: 1rem;
        }
        
        .promo-banner {
          background: linear-gradient(135deg, var(--secondary) 0%, var(--secondary-light) 100%);
          padding: 3rem 2rem;
          border-radius: 8px;
          margin: 2rem 0;
        }
        
        .promo-content {
          text-align: center;
          color: white;
        }
        
        .promo-content h2 {
          font-size: 2rem;
          font-weight: 500;
          margin-bottom: 0.75rem;
        }
        
        .promo-content p {
          font-size: 1.125rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }
        
        @media (max-width: 1200px) {
          .category-grid,
          .products-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        @media (max-width: 768px) {
          .hero-content h1 {
            font-size: 1.75rem;
          }
          
          .category-grid,
          .products-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }
          
          .promo-content h2 {
            font-size: 1.5rem;
          }
        }
        
        @media (max-width: 480px) {
          .category-grid {
            grid-template-columns: 1fr;
          }
        }
        `}
      </style>
    </>
  );
});

export const head: DocumentHead = {
  title: "Shop - Your One-Stop Shopping Destination",
  meta: [
    {
      name: "description",
      content: "Shop for electronics, fashion, home goods and more at great prices!",
    },
  ],
};
