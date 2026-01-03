export const typeDefs = `#graphql
  scalar DateTime
  scalar JSON
  scalar Money

  # Error handling types
  interface ErrorResult {
    errorCode: String!
    message: String!
  }

  type GenericError implements ErrorResult {
    errorCode: String!
    message: String!
  }

  type InvalidCredentialsError implements ErrorResult {
    errorCode: String!
    message: String!
  }

  type NotFoundError implements ErrorResult {
    errorCode: String!
    message: String!
  }

  # Union types for mutations
  union LoginResult = CurrentUser | InvalidCredentialsError
  union RegisterResult = Success | GenericError
  union VerifyResult = CurrentUser | Success | GenericError
  union ResetPasswordResult = CurrentUser | Success | GenericError
  union RequestPasswordResetResult = Success | GenericError
  union UpdateCustomerResult = Customer | GenericError
  union UpdatePasswordResult = Success | GenericError
  union UpdateEmailResult = Success | GenericError
  union OrderResult = Order | NotFoundError | GenericError
  union AddressResult = Address | GenericError
  union DeleteResult = Success | GenericError

  type Query {
    # Product queries
    product(slug: String, id: ID): Product
    search(input: SearchInput!): SearchResponse!
    
    # Collection queries
    collection(slug: String, id: ID): Collection
    collections: CollectionList!
    
    # Customer queries
    activeCustomer: Customer
    activeOrder: Order
    
    # Order queries
    orderByCode(code: String!): Order
    
    # Checkout queries
    availableCountries: [Country!]!
    eligibleShippingMethods: [ShippingMethod!]!
    eligiblePaymentMethods: [PaymentMethod!]!
  }

  type Mutation {
    # Auth mutations
    login(username: String!, password: String!, rememberMe: Boolean): LoginResult!
    logout: Success!
    registerCustomerAccount(input: RegisterCustomerInput!): RegisterResult!
    verifyCustomerAccount(token: String!, password: String): VerifyResult!
    requestPasswordReset(emailAddress: String!): RequestPasswordResetResult!
    resetPassword(token: String!, password: String!): ResetPasswordResult!
    requestUpdateCustomerEmailAddress(password: String!, newEmailAddress: String!): UpdateEmailResult!
    updateCustomerEmailAddress(token: String!): UpdateEmailResult!
    updateCustomerPassword(currentPassword: String!, newPassword: String!): UpdatePasswordResult!
    
    # Cart mutations
    addItemToOrder(productVariantId: ID!, quantity: Int!): OrderResult!
    adjustOrderLine(orderLineId: ID!, quantity: Int!): OrderResult!
    removeOrderLine(orderLineId: ID!): OrderResult!
    removeAllOrderLines: OrderResult!
    applyCouponCode(couponCode: String!): OrderResult!
    removeCouponCode(couponCode: String!): OrderResult!
    
    # Checkout mutations
    setOrderShippingAddress(input: CreateAddressInput!): OrderResult!
    setOrderBillingAddress(input: CreateAddressInput!): OrderResult!
    setOrderShippingMethod(shippingMethodId: [ID!]!): OrderResult!
    addPaymentToOrder(input: PaymentInput!): OrderResult!
    transitionOrderToState(state: String!): OrderResult!
    setCustomerForOrder(input: CreateCustomerInput!): OrderResult!
    createStripeCheckoutSession: String!
    confirmStripeCheckout(sessionId: String!): OrderResult!
    
    # Customer mutations
    updateCustomer(input: UpdateCustomerInput!): UpdateCustomerResult!
    createCustomerAddress(input: CreateAddressInput!): AddressResult!
    updateCustomerAddress(input: UpdateAddressInput!): AddressResult!
    deleteCustomerAddress(id: ID!): Success!
  }

  # Product Types
  type Product {
    id: ID!
    name: String!
    slug: String!
    description: String
    featuredAsset: Asset
    assets: [Asset!]!
    variants: [ProductVariant!]!
    facetValues: [FacetValue!]!
    collections: [Collection!]!
  }

  type ProductVariant {
    id: ID!
    name: String!
    sku: String!
    price: Money!
    priceWithTax: Money!
    currencyCode: String!
    stockLevel: String!
    featuredAsset: Asset
    product: Product!
  }

  type Asset {
    id: ID!
    preview: String!
    source: String!
    width: Int
    height: Int
  }

  # Search Types
  input SearchInput {
    term: String
    groupByProduct: Boolean
    collectionSlug: String
    facetValueFilters: [FacetValueFilterInput!]
    skip: Int
    take: Int
  }

  input FacetValueFilterInput {
    and: [ID!]
    or: [ID!]
  }

  type SearchResponse {
    items: [SearchResult!]!
    totalItems: Int!
    facetValues: [FacetValueResult!]!
  }

  type SearchResult {
    productId: ID!
    productName: String!
    slug: String!
    productAsset: Asset
    priceWithTax: PriceSearchResult!
    currencyCode: String!
  }

  union PriceSearchResult = SinglePrice | PriceRange

  type SinglePrice {
    value: Money!
  }

  type PriceRange {
    min: Money!
    max: Money!
  }

  type FacetValueResult {
    count: Int!
    facetValue: FacetValue!
  }

  # Collection Types
  type Collection {
    id: ID!
    name: String!
    slug: String!
    description: String
    featuredAsset: Asset
    parent: Collection
    breadcrumbs: [CollectionBreadcrumb!]!
    children: [Collection!]
  }

  type CollectionBreadcrumb {
    id: ID!
    name: String!
    slug: String!
  }

  type CollectionList {
    items: [Collection!]!
    totalItems: Int!
  }

  # Facet Types
  type Facet {
    id: ID!
    name: String!
    code: String!
  }

  type FacetValue {
    id: ID!
    name: String!
    code: String!
    facet: Facet!
  }

  # Customer Types
  type Customer {
    id: ID!
    title: String
    firstName: String!
    lastName: String
    emailAddress: String!
    phoneNumber: String
    addresses: [Address!]
    orders(options: OrderListOptions): OrderList
  }

  type CurrentUser {
    id: ID!
    identifier: String!
    channels: [String!]!
  }

  input RegisterCustomerInput {
    emailAddress: String!
    password: String!
    firstName: String!
    lastName: String
    phoneNumber: String
  }

  input CreateCustomerInput {
    emailAddress: String!
    firstName: String!
    lastName: String
    phoneNumber: String
  }

  input UpdateCustomerInput {
    firstName: String
    lastName: String
    phoneNumber: String
    title: String
  }

  # Address Types
  type Address {
    id: ID!
    fullName: String
    company: String
    streetLine1: String!
    streetLine2: String
    city: String
    province: String
    postalCode: String
    country: Country!
    phoneNumber: String
    defaultShippingAddress: Boolean
    defaultBillingAddress: Boolean
  }

  type Country {
    id: ID!
    code: String!
    name: String!
  }

  input CreateAddressInput {
    fullName: String
    company: String
    streetLine1: String!
    streetLine2: String
    city: String
    province: String
    postalCode: String
    countryCode: String!
    phoneNumber: String
    defaultShippingAddress: Boolean
    defaultBillingAddress: Boolean
  }

  input UpdateAddressInput {
    id: ID!
    fullName: String
    company: String
    streetLine1: String
    streetLine2: String
    city: String
    province: String
    postalCode: String
    countryCode: String
    phoneNumber: String
    defaultShippingAddress: Boolean
    defaultBillingAddress: Boolean
  }

  # Order Types
  type Order {
    id: ID!
    code: String!
    state: String!
    active: Boolean!
    lines: [OrderLine!]!
    totalQuantity: Int!
    subTotal: Money!
    subTotalWithTax: Money!
    shipping: Money!
    shippingWithTax: Money!
    total: Money!
    totalWithTax: Money!
    taxSummary: [OrderTaxSummary!]!
    shippingLines: [ShippingLine!]!
    currencyCode: String!
    customer: Customer
    shippingAddress: OrderAddress
    billingAddress: OrderAddress
    shippingMethod: ShippingMethod
    payments: [Payment!]
    discounts: [Discount!]!
    couponCodes: [String!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type OrderLine {
    id: ID!
    productVariant: ProductVariant!
    featuredAsset: Asset
    quantity: Int!
    linePrice: Money!
    linePriceWithTax: Money!
    unitPrice: Money!
    unitPriceWithTax: Money!
    discounts: [Discount!]!
  }

  type OrderTaxSummary {
    description: String!
    taxRate: Float!
    taxBase: Money!
    taxTotal: Money!
  }

  type ShippingLine {
    id: ID!
    shippingMethod: ShippingMethod!
    price: Money!
    priceWithTax: Money!
  }

  type OrderAddress {
    fullName: String
    company: String
    streetLine1: String
    streetLine2: String
    city: String
    province: String
    postalCode: String
    country: String
    countryCode: String
    phoneNumber: String
  }

  input OrderListOptions {
    skip: Int
    take: Int
    sort: OrderSortParameter
    filter: OrderFilterParameter
  }

  input OrderSortParameter {
    createdAt: SortOrder
    updatedAt: SortOrder
    code: SortOrder
    total: SortOrder
  }

  input OrderFilterParameter {
    active: BooleanOperators
  }

  input BooleanOperators {
    eq: Boolean
  }

  enum SortOrder {
    ASC
    DESC
  }

  type OrderList {
    items: [Order!]!
    totalItems: Int!
  }

  # Shipping Types
  type ShippingMethod {
    id: ID!
    code: String!
    name: String!
    description: String
    price: Money!
    priceWithTax: Money!
    metadata: JSON
  }

  type Country {
    id: ID!
    code: String!
    name: String!
    enabled: Boolean!
  }

  type PaymentMethod {
    id: ID!
    code: String!
    name: String!
    description: String
    enabled: Boolean!
    isEligible: Boolean!
    eligibilityMessage: String
  }

  # Payment Types
  type Payment {
    id: ID!
    method: String!
    amount: Money!
    state: String!
    transactionId: String
    metadata: JSON
  }

  input PaymentInput {
    method: String!
    metadata: JSON
  }

  type Discount {
    adjustmentSource: String!
    amount: Money!
    amountWithTax: Money!
    description: String!
    type: String!
  }

  # Common Types
  type Success {
    success: Boolean!
  }
`

