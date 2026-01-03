/**
 * GraphQL Types matching the Payload CMS schema
 */

export interface Asset {
  id: string;
  preview: string;
  source: string;
  width?: number;
  height?: number;
}

export interface Facet {
  id: string;
  name: string;
  code: string;
}

export interface FacetValue {
  id: string;
  name: string;
  code: string;
  facet: Facet;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  featuredAsset?: Asset;
  parent?: Collection;
  children?: Collection[];
  breadcrumbs?: CollectionBreadcrumb[];
}

export interface CollectionBreadcrumb {
  id: string;
  name: string;
  slug: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  priceWithTax: number;
  currencyCode: string;
  stockLevel: string;
  featuredAsset?: Asset;
  product?: Product;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  featuredAsset?: Asset;
  assets: Asset[];
  variants: ProductVariant[];
  facetValues: FacetValue[];
  collections: Collection[];
}

export interface SinglePrice {
  __typename: "SinglePrice";
  value: number;
}

export interface PriceRange {
  __typename: "PriceRange";
  min: number;
  max: number;
}

export type PriceSearchResult = SinglePrice | PriceRange;

export interface SearchResult {
  productId: string;
  productName: string;
  slug: string;
  productAsset?: Asset;
  priceWithTax: PriceSearchResult;
  currencyCode: string;
}

export interface FacetValueResult {
  count: number;
  facetValue: FacetValue;
}

export interface SearchResponse {
  items: SearchResult[];
  totalItems: number;
  facetValues: FacetValueResult[];
}

export interface SearchInput {
  term?: string;
  groupByProduct?: boolean;
  collectionSlug?: string;
  facetValueFilters?: FacetValueFilterInput[];
  skip?: number;
  take?: number;
}

export interface FacetValueFilterInput {
  and?: string[];
  or?: string[];
}

export interface OrderLine {
  id: string;
  productVariant: ProductVariant;
  featuredAsset?: Asset;
  quantity: number;
  linePrice: number;
  linePriceWithTax: number;
  unitPrice: number;
  unitPriceWithTax: number;
}

export interface Order {
  id: string;
  code: string;
  state: string;
  active: boolean;
  lines: OrderLine[];
  totalQuantity: number;
  subTotal: number;
  subTotalWithTax: number;
  shipping: number;
  shippingWithTax: number;
  total: number;
  totalWithTax: number;
  currencyCode: string;
}

export interface CollectionList {
  items: Collection[];
  totalItems: number;
}

// Query response types
export interface SearchProductsResponse {
  search: SearchResponse;
}

export interface GetProductResponse {
  product: Product | null;
}

export interface GetCollectionsResponse {
  collections: CollectionList;
}

export interface GetCollectionResponse {
  collection: Collection | null;
}

export interface GetActiveOrderResponse {
  activeOrder: Order | null;
}


