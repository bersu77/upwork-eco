import { component$, Resource, useResource$, useSignal, $ } from "@builder.io/qwik";
import { useLocation, Link, type DocumentHead } from "@builder.io/qwik-city";
import { productService } from "~/services/graphql";
import type { ProductVariant, Asset } from "~/services/graphql/types";
import { formatPrice } from "~/utils/format";

export default component$(() => {
  const loc = useLocation();
  const slug = loc.params.slug;

  const selectedVariantId = useSignal<string | null>(null);
  const selectedImageIndex = useSignal(0);
  const quantity = useSignal(1);

  const productResource = useResource$(async () => {
    return await productService.getProductBySlug(slug);
  });

  const handleAddToCart = $(() => {
    // In a real app, this would add to cart via GraphQL mutation
    console.log("Add to cart:", {
      variantId: selectedVariantId.value,
      quantity: quantity.value,
    });
    alert(`Added ${quantity.value} item(s) to cart!`);
  });

  return (
    <div class="container">
      <Resource
        value={productResource}
        onPending={() => (
          <div class="loading">
            <div class="spinner" />
            <span>Loading product...</span>
          </div>
        )}
        onRejected={(error) => (
          <div class="error-state">
            <p>Failed to load product: {error.message}</p>
            <Link href="/products" class="btn btn-secondary" prefetch={false}>
              Back to Products
            </Link>
          </div>
        )}
        onResolved={(product) => {
          if (!product) {
            return (
              <div class="not-found">
                <h1>Product Not Found</h1>
                <p>The product you're looking for doesn't exist.</p>
                <Link href="/products" class="btn btn-primary" prefetch={false}>
                  Browse Products
                </Link>
              </div>
            );
          }

          // Auto-select first variant if none selected
          if (!selectedVariantId.value && product.variants.length > 0) {
            selectedVariantId.value = product.variants[0].id;
          }

          const selectedVariant = product.variants.find(
            (v) => v.id === selectedVariantId.value
          ) || product.variants[0];

          const images: Asset[] = product.featuredAsset
            ? [product.featuredAsset, ...product.assets.filter((a) => a.id !== product.featuredAsset?.id)]
            : product.assets;

          return (
            <div class="product-page">
              {/* Breadcrumb */}
              <nav class="breadcrumb">
                <Link href="/" prefetch={false}>Home</Link>
                <span>/</span>
                <Link href="/products" prefetch={false}>Products</Link>
                <span>/</span>
                <span>{product.name}</span>
              </nav>

              <div class="product-layout">
                {/* Image Gallery */}
                <div class="gallery">
                  <div class="main-image">
                    {images[selectedImageIndex.value] ? (
                      <img
                        src={images[selectedImageIndex.value].preview}
                        alt={product.name}
                        width={images[selectedImageIndex.value].width || 600}
                        height={images[selectedImageIndex.value].height || 600}
                      />
                    ) : (
                      <div class="no-image">No Image</div>
                    )}
                  </div>

                  {images.length > 1 && (
                    <div class="thumbnails">
                      {images.map((image, index) => (
                        <button
                          key={image.id}
                          class={`thumbnail ${selectedImageIndex.value === index ? "active" : ""}`}
                          onClick$={() => (selectedImageIndex.value = index)}
                        >
                          <img src={image.preview} alt={`${product.name} ${index + 1}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div class="product-info">
                  <h1>{product.name}</h1>

                  {/* Price */}
                  <div class="price">
                    {selectedVariant && (
                      <span class="current-price">
                        {formatPrice(selectedVariant.priceWithTax, selectedVariant.currencyCode)}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {product.description && (
                    <div class="description">
                      <p>{product.description}</p>
                    </div>
                  )}

                  {/* Variant Selection */}
                  {product.variants.length > 1 && (
                    <div class="variants-section">
                      <label class="label">Select Variant</label>
                      <div class="variant-options">
                        {product.variants.map((variant: ProductVariant) => (
                          <button
                            key={variant.id}
                            class={`variant-btn ${selectedVariantId.value === variant.id ? "selected" : ""}`}
                            onClick$={() => (selectedVariantId.value = variant.id)}
                          >
                            <span class="variant-name">{variant.name}</span>
                            <span class="variant-price">
                              {formatPrice(variant.priceWithTax, variant.currencyCode)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stock Status */}
                  {selectedVariant && (
                    <div class="stock-status">
                      {selectedVariant.stockLevel === "IN_STOCK" ? (
                        <span class="in-stock">✓ In Stock</span>
                      ) : selectedVariant.stockLevel === "LOW_STOCK" ? (
                        <span class="low-stock">⚠ Low Stock</span>
                      ) : (
                        <span class="out-of-stock">✕ Out of Stock</span>
                      )}
                    </div>
                  )}

                  {/* Quantity & Add to Cart */}
                  <div class="purchase-section">
                    <div class="quantity-selector">
                      <label class="label">Quantity</label>
                      <div class="quantity-input">
                        <button
                          class="qty-btn"
                          onClick$={() => {
                            if (quantity.value > 1) quantity.value--;
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={quantity.value}
                          min="1"
                          max="99"
                          onInput$={(e) => {
                            const val = parseInt((e.target as HTMLInputElement).value);
                            if (val >= 1 && val <= 99) quantity.value = val;
                          }}
                        />
                        <button
                          class="qty-btn"
                          onClick$={() => {
                            if (quantity.value < 99) quantity.value++;
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      class="btn btn-primary add-to-cart"
                      onClick$={handleAddToCart}
                      disabled={selectedVariant?.stockLevel === "OUT_OF_STOCK"}
                    >
                      Add to Cart
                    </button>
                  </div>

                  {/* Facet Values / Attributes */}
                  {product.facetValues.length > 0 && (
                    <div class="attributes">
                      <h3>Product Details</h3>
                      <dl>
                        {product.facetValues.map((fv) => (
                          <div key={fv.id} class="attribute-row">
                            <dt>{fv.facet.name}</dt>
                            <dd>{fv.name}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {/* Collections */}
                  {product.collections.length > 0 && (
                    <div class="collections">
                      <span>Categories: </span>
                      {product.collections.map((col, i) => (
                        <span key={col.id}>
                          <Link href={`/products?collection=${col.slug}`} prefetch={false}>{col.name}</Link>
                          {i < product.collections.length - 1 && ", "}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }}
      />

      <style>
        {`
        .loading, .error-state, .not-found {
          text-align: center;
          padding: 3rem;
        }
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .error-state p, .not-found p {
          margin-bottom: 1rem;
          color: var(--text-muted);
        }
        .breadcrumb {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        .breadcrumb a {
          color: var(--text-muted);
        }
        .breadcrumb a:hover {
          color: var(--primary);
        }
        .product-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
        }
        .gallery {
          position: sticky;
          top: 80px;
        }
        .main-image {
          aspect-ratio: 1;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .main-image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .no-image {
          color: var(--text-muted);
        }
        .thumbnails {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
          overflow-x: auto;
        }
        .thumbnail {
          width: 80px;
          height: 80px;
          border: 2px solid var(--border);
          border-radius: 0.5rem;
          overflow: hidden;
          cursor: pointer;
          background: var(--surface);
          padding: 0;
        }
        .thumbnail.active {
          border-color: var(--primary);
        }
        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .product-info h1 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        .price {
          margin-bottom: 1.5rem;
        }
        .current-price {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--primary);
        }
        .description {
          color: var(--text-muted);
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }
        .variants-section {
          margin-bottom: 1.5rem;
        }
        .variant-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .variant-btn {
          display: flex;
          flex-direction: column;
          padding: 0.75rem 1rem;
          border: 2px solid var(--border);
          border-radius: 0.5rem;
          background: var(--surface);
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }
        .variant-btn:hover {
          border-color: var(--primary);
        }
        .variant-btn.selected {
          border-color: var(--primary);
          background: #eff6ff;
        }
        .variant-name {
          font-weight: 500;
        }
        .variant-price {
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        .stock-status {
          margin-bottom: 1.5rem;
          font-weight: 500;
        }
        .in-stock {
          color: var(--success);
        }
        .low-stock {
          color: var(--warning);
        }
        .out-of-stock {
          color: var(--error);
        }
        .purchase-section {
          display: flex;
          gap: 1rem;
          align-items: flex-end;
          margin-bottom: 2rem;
        }
        .quantity-selector {
          flex-shrink: 0;
        }
        .quantity-input {
          display: flex;
          align-items: center;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .qty-btn {
          width: 40px;
          height: 40px;
          background: var(--surface);
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
        }
        .qty-btn:hover {
          background: var(--background);
        }
        .quantity-input input {
          width: 50px;
          height: 40px;
          text-align: center;
          border: none;
          border-left: 1px solid var(--border);
          border-right: 1px solid var(--border);
          font-size: 1rem;
        }
        .quantity-input input:focus {
          outline: none;
        }
        .add-to-cart {
          flex: 1;
          height: 48px;
          font-size: 1rem;
        }
        .attributes {
          border-top: 1px solid var(--border);
          padding-top: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .attributes h3 {
          margin-bottom: 1rem;
        }
        .attribute-row {
          display: flex;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border);
        }
        .attribute-row dt {
          font-weight: 500;
          width: 120px;
          flex-shrink: 0;
        }
        .attribute-row dd {
          color: var(--text-muted);
        }
        .collections {
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        @media (max-width: 768px) {
          .product-layout {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .gallery {
            position: static;
          }
          .purchase-section {
            flex-direction: column;
            align-items: stretch;
          }
        }
        `}
      </style>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  return {
    title: "Product - Shop PWA",
    meta: [{ name: "description", content: "View product details and variants" }],
  };
};


