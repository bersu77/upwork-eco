import { component$, Slot } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { AuthProvider } from "~/services/auth/auth-context";
import { useAuthState } from "~/services/auth/auth-hooks";

export default component$(() => {
  return (
    <AuthProvider>
      <div class="app-layout">
        <Header />
        <main class="main-content">
          <Slot />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
});

const Header = component$(() => {
  const authState = useAuthState();

  return (
    <header class="amazon-header">
      {/* Top header bar */}
      <div class="header-top">
        <div class="container header-container">
          <Link href="/" class="logo">
            <span class="logo-icon">🛒</span>
            <span class="logo-text">Shop</span>
          </Link>

          <div class="deliver-to">
            <span class="deliver-label">Deliver to</span>
            <span class="deliver-location">📍 Your Location</span>
          </div>

          <div class="search-bar">
            <select class="search-category">
              <option>All</option>
              <option>Electronics</option>
              <option>Fashion</option>
              <option>Home</option>
            </select>
            <input type="text" class="search-input" placeholder="Search products" />
            <button class="search-btn">🔍</button>
          </div>

          <div class="header-actions">
            {authState.isAuthenticated ? (
              <>
                <div class="header-item">
                  <span class="header-greeting">Hello, {authState.user?.firstName || "User"}</span>
                  <span class="header-label">Account & Lists</span>
                </div>
                <Link href="/auth/logout" class="header-item">
                  <span class="header-greeting">Sign Out</span>
                </Link>
              </>
            ) : (
              <Link href="/auth/login" class="header-item">
                <span class="header-label">Sign In</span>
              </Link>
            )}
            
            <Link href="/cart" class="header-item">
              <span class="cart-icon">🛒</span>
              <span class="cart-count">0</span>
              <span class="header-label">Cart</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <div class="header-nav">
        <div class="container">
          <nav class="nav-links">
            <Link href="/products">All Products</Link>
            <Link href="/products?category=electronics">Electronics</Link>
            <Link href="/products?category=fashion">Fashion</Link>
            <Link href="/products?category=home">Home & Kitchen</Link>
            {authState.isAuthenticated && <Link href="/chat">Chat</Link>}
          </nav>
        </div>
      </div>

      <style>
        {`
        .amazon-header {
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .header-top {
          background: var(--secondary);
          color: white;
          padding: 0.75rem 0;
        }
        
        .header-container {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: white;
          text-decoration: none;
          font-size: 1.5rem;
          margin-right: 1rem;
        }
        
        .logo-icon {
          font-size: 2rem;
        }
        
        .logo-text {
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        
        .deliver-to {
          display: flex;
          flex-direction: column;
          font-size: 0.85rem;
          line-height: 1.2;
          cursor: pointer;
          margin-right: 0.5rem;
        }
        
        .deliver-label {
          font-size: 0.75rem;
          color: #ccc;
        }
        
        .deliver-location {
          font-weight: 700;
        }
        
        .search-bar {
          flex: 1;
          display: flex;
          max-width: 800px;
        }
        
        .search-category {
          background: #f3f3f3;
          border: none;
          padding: 0.5rem;
          border-radius: 4px 0 0 4px;
          font-size: 0.85rem;
          color: var(--text);
          cursor: pointer;
          border-right: 1px solid var(--border);
        }
        
        .search-input {
          flex: 1;
          border: none;
          padding: 0.5rem 0.75rem;
          font-size: 0.95rem;
        }
        
        .search-input:focus {
          outline: 3px solid var(--primary);
        }
        
        .search-btn {
          background: var(--primary);
          border: none;
          padding: 0 1.25rem;
          border-radius: 0 4px 4px 0;
          cursor: pointer;
          font-size: 1.25rem;
          transition: background 0.2s;
        }
        
        .search-btn:hover {
          background: var(--primary-hover);
        }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        
        .header-item {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
          color: white;
          text-decoration: none;
          cursor: pointer;
          position: relative;
          padding: 0.5rem;
          border: 1px solid transparent;
          border-radius: 2px;
          transition: border-color 0.2s;
        }
        
        .header-item:hover {
          border-color: white;
        }
        
        .header-greeting {
          font-size: 0.75rem;
        }
        
        .header-label {
          font-size: 0.9rem;
          font-weight: 700;
        }
        
        .cart-icon {
          font-size: 2rem;
          position: relative;
        }
        
        .cart-count {
          position: absolute;
          top: -5px;
          left: 50%;
          background: var(--primary);
          color: var(--text);
          font-weight: 700;
          font-size: 0.85rem;
          padding: 0 0.35rem;
          border-radius: 10px;
          min-width: 20px;
          text-align: center;
        }
        
        .header-nav {
          background: var(--secondary-light);
          padding: 0.5rem 0;
        }
        
        .nav-links {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }
        
        .nav-links a {
          color: white;
          text-decoration: none;
          font-size: 0.9rem;
          padding: 0.25rem 0.5rem;
          border: 1px solid transparent;
          border-radius: 2px;
          transition: border-color 0.2s;
        }
        
        .nav-links a:hover {
          border-color: white;
        }
        
        @media (max-width: 1024px) {
          .deliver-to {
            display: none;
          }
          
          .search-bar {
            max-width: 400px;
          }
        }
        
        @media (max-width: 768px) {
          .header-container {
            flex-wrap: wrap;
          }
          
          .search-bar {
            order: 3;
            flex-basis: 100%;
            margin-top: 0.5rem;
          }
          
          .header-actions {
            gap: 0.5rem;
          }
          
          .header-greeting {
            display: none;
          }
          
          .nav-links {
            overflow-x: auto;
            white-space: nowrap;
          }
        }
        `}
      </style>
    </header>
  );
});

const Footer = component$(() => {
  return (
    <footer class="footer">
      <div class="container">
        <p>&copy; {new Date().getFullYear()} Shop PWA. Built with Qwik.</p>
      </div>

      <style>
        {`
        .footer {
          margin-top: auto;
          padding: 2rem 0;
          text-align: center;
          border-top: 1px solid var(--border);
          color: var(--text-muted);
        }
        .main-content {
          min-height: calc(100vh - 64px - 80px);
          padding: 2rem 0;
        }
        .app-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        `}
      </style>
    </footer>
  );
});
