import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import type { SearchResult } from "~/services/graphql/types";
import { formatPrice, getPriceDisplay } from "~/utils/format";

interface ProductCardProps {
  product: SearchResult;
}

export const ProductCard = component$<ProductCardProps>(({ product }) => {
  const priceDisplay = getPriceDisplay(product.priceWithTax, product.currencyCode);

  return (
    <Link href={`/products/${product.slug}`} class="amazon-product-card">
      <div class="product-image-container">
        {product.productAsset ? (
          <img
            src={product.productAsset.preview}
            alt={product.productName}
            loading="lazy"
            class="product-image"
          />
        ) : (
          <div class="no-image">No Image Available</div>
        )}
      </div>

      <div class="product-info">
        <h3 class="product-title">{product.productName}</h3>
        
        <div class="product-rating">
          <span class="stars">★★★★☆</span>
          <span class="rating-count">4.5 (245)</span>
        </div>

        <div class="product-price-section">
          <span class="currency-symbol">$</span>
          <span class="product-price">{priceDisplay.replace('$', '')}</span>
        </div>

        <div class="product-delivery">
          <span class="prime-badge">Prime</span>
          <span class="delivery-text">FREE delivery</span>
        </div>
      </div>

      <style>
        {`
        .amazon-product-card {
          display: flex;
          flex-direction: column;
          background: var(--surface);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
          height: 100%;
        }
        
        .amazon-product-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }
        
        .product-image-container {
          aspect-ratio: 1;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 1rem;
          border-bottom: 1px solid var(--border-light);
        }
        
        .product-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.3s;
        }
        
        .amazon-product-card:hover .product-image {
          transform: scale(1.05);
        }
        
        .no-image {
          color: var(--text-muted);
          font-size: 0.85rem;
          text-align: center;
        }
        
        .product-info {
          padding: 0.75rem 1rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }
        
        .product-title {
          font-size: 14px;
          font-weight: 400;
          margin: 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          color: var(--text);
          min-height: 2.8em;
        }
        
        .amazon-product-card:hover .product-title {
          color: var(--primary-dark);
        }
        
        .product-rating {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 12px;
        }
        
        .stars {
          color: var(--rating);
          font-size: 16px;
          letter-spacing: -1px;
        }
        
        .rating-count {
          color: var(--text-secondary);
        }
        
        .product-price-section {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
          margin: 0.25rem 0;
        }
        
        .currency-symbol {
          font-size: 12px;
          vertical-align: top;
          line-height: 1.5;
        }
        
        .product-price {
          font-size: 24px;
          font-weight: 500;
          color: var(--text);
          line-height: 1;
        }
        
        .product-delivery {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 12px;
          color: var(--text-secondary);
        }
        
        .prime-badge {
          background: #00a8e1;
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-weight: 700;
          font-size: 11px;
        }
        
        .delivery-text {
          color: var(--text);
        }
        `}
      </style>
    </Link>
  );
});

