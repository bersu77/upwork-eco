/**
 * GraphQL Queries for Products and Variants
 */

// Product queries
export const SEARCH_PRODUCTS = `
  query SearchProducts($input: SearchInput!) {
    search(input: $input) {
      items {
        productId
        productName
        slug
        productAsset {
          id
          preview
          source
        }
        priceWithTax {
          ... on SinglePrice {
            value
          }
          ... on PriceRange {
            min
            max
          }
        }
        currencyCode
      }
      totalItems
      facetValues {
        count
        facetValue {
          id
          name
          code
          facet {
            id
            name
            code
          }
        }
      }
    }
  }
`;

export const GET_PRODUCT = `
  query GetProduct($slug: String, $id: ID) {
    product(slug: $slug, id: $id) {
      id
      name
      slug
      description
      featuredAsset {
        id
        preview
        source
        width
        height
      }
      assets {
        id
        preview
        source
        width
        height
      }
      variants {
        id
        name
        sku
        price
        priceWithTax
        currencyCode
        stockLevel
        featuredAsset {
          id
          preview
          source
        }
      }
      facetValues {
        id
        name
        code
        facet {
          id
          name
          code
        }
      }
      collections {
        id
        name
        slug
      }
    }
  }
`;

// Collection queries
export const GET_COLLECTIONS = `
  query GetCollections {
    collections {
      items {
        id
        name
        slug
        description
        featuredAsset {
          id
          preview
          source
        }
        parent {
          id
          name
          slug
        }
        children {
          id
          name
          slug
        }
      }
      totalItems
    }
  }
`;

export const GET_COLLECTION = `
  query GetCollection($slug: String, $id: ID) {
    collection(slug: $slug, id: $id) {
      id
      name
      slug
      description
      featuredAsset {
        id
        preview
        source
      }
      breadcrumbs {
        id
        name
        slug
      }
      children {
        id
        name
        slug
      }
    }
  }
`;

// Cart/Order queries
export const GET_ACTIVE_ORDER = `
  query GetActiveOrder {
    activeOrder {
      id
      code
      state
      active
      lines {
        id
        productVariant {
          id
          name
          sku
          price
          priceWithTax
        }
        featuredAsset {
          preview
        }
        quantity
        linePrice
        linePriceWithTax
      }
      totalQuantity
      subTotal
      subTotalWithTax
      shipping
      shippingWithTax
      total
      totalWithTax
      currencyCode
    }
  }
`;

// Cart mutations
export const ADD_ITEM_TO_ORDER = `
  mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
      ... on Order {
        id
        code
        totalQuantity
        total
        totalWithTax
        lines {
          id
          productVariant {
            id
            name
          }
          quantity
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const ADJUST_ORDER_LINE = `
  mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
    adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
      ... on Order {
        id
        totalQuantity
        total
        totalWithTax
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const REMOVE_ORDER_LINE = `
  mutation RemoveOrderLine($orderLineId: ID!) {
    removeOrderLine(orderLineId: $orderLineId) {
      ... on Order {
        id
        totalQuantity
        total
        totalWithTax
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;


