import { component$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <div class="container">
      <div class="cart-page">
        <h1>Shopping Cart</h1>
        
        <div class="cart-empty">
          <div class="empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything to your cart yet.</p>
          <Link href="/products" class="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>

      <style>
        {`
        .cart-page {
          padding: 2rem 0;
          min-height: 60vh;
        }
        
        .cart-page h1 {
          font-size: 2rem;
          margin-bottom: 2rem;
          color: var(--text);
        }
        
        .cart-empty {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        
        .cart-empty h2 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: var(--text);
        }
        
        .cart-empty p {
          color: var(--text-muted);
          margin-bottom: 2rem;
        }
        
        .btn {
          display: inline-block;
          padding: 0.75rem 2rem;
          border-radius: 4px;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .btn-primary {
          background: var(--primary);
          color: white;
        }
        
        .btn-primary:hover {
          background: var(--primary-hover);
        }
        `}
      </style>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Shopping Cart - Shop PWA",
  meta: [{ name: "description", content: "View your shopping cart" }],
};

