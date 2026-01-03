/**
 * Product Service - GraphQL operations for products
 */

import { graphqlClient } from "./client";
import { SEARCH_PRODUCTS, GET_PRODUCT, GET_COLLECTIONS, GET_COLLECTION } from "./queries";
import type {
  SearchProductsResponse,
  GetProductResponse,
  GetCollectionsResponse,
  GetCollectionResponse,
  SearchInput,
  Product,
  Collection,
  SearchResponse,
} from "./types";

class ProductService {
  /**
   * Search products with filters
   */
  async searchProducts(input: SearchInput): Promise<SearchResponse> {
    const response = await graphqlClient.query<SearchProductsResponse>(SEARCH_PRODUCTS, {
      input,
    });
    return response.search;
  }

  /**
   * Get all products (convenience method)
   */
  async getAllProducts(options?: { take?: number; skip?: number }): Promise<SearchResponse> {
    return this.searchProducts({
      groupByProduct: true,
      take: options?.take || 20,
      skip: options?.skip || 0,
    });
  }

  /**
   * Get products by collection
   */
  async getProductsByCollection(
    collectionSlug: string,
    options?: { take?: number; skip?: number }
  ): Promise<SearchResponse> {
    return this.searchProducts({
      collectionSlug,
      groupByProduct: true,
      take: options?.take || 20,
      skip: options?.skip || 0,
    });
  }

  /**
   * Search products by term
   */
  async searchProductsByTerm(
    term: string,
    options?: { take?: number; skip?: number }
  ): Promise<SearchResponse> {
    return this.searchProducts({
      term,
      groupByProduct: true,
      take: options?.take || 20,
      skip: options?.skip || 0,
    });
  }

  /**
   * Get a single product by slug
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    const response = await graphqlClient.query<GetProductResponse>(GET_PRODUCT, {
      slug,
    });
    return response.product;
  }

  /**
   * Get a single product by ID
   */
  async getProductById(id: string): Promise<Product | null> {
    const response = await graphqlClient.query<GetProductResponse>(GET_PRODUCT, {
      id,
    });
    return response.product;
  }

  /**
   * Get all collections
   */
  async getCollections(): Promise<Collection[]> {
    const response = await graphqlClient.query<GetCollectionsResponse>(GET_COLLECTIONS);
    return response.collections.items;
  }

  /**
   * Get a single collection by slug
   */
  async getCollectionBySlug(slug: string): Promise<Collection | null> {
    const response = await graphqlClient.query<GetCollectionResponse>(GET_COLLECTION, {
      slug,
    });
    return response.collection;
  }
}

export const productService = new ProductService();


