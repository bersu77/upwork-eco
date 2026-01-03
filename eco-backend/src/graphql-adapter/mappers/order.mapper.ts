import { mapAsset } from './product.mapper'

export function mapOrder(cartOrOrder: any): any {
  if (!cartOrOrder) return null

  // Determine if this is an order (has 'amount' field) or cart (needs calculation)
  const isOrder = cartOrOrder.amount !== undefined && cartOrOrder.amount !== null
  
  const subTotal = calculateSubTotal(cartOrOrder)
  
  // Calculate shipping:
  // 1. If shippingMethod is populated with price, use it
  // 2. If it's an order and we have amount, calculate shipping = amount - subtotal
  // 3. Otherwise default to 0
  let shipping = 0
  if (cartOrOrder.shippingMethod?.price) {
    // Convert shipping price from dollars to cents to match other prices
    shipping = Math.round(cartOrOrder.shippingMethod.price * 100)
  } else if (isOrder && cartOrOrder.amount && subTotal > 0) {
    // For orders, calculate shipping from amount - subtotal
    // This handles cases where shippingMethod wasn't saved to the order
    shipping = Math.max(0, cartOrOrder.amount - subTotal)
  }
  
  // For orders, use the amount from database (already in cents from Stripe)
  // For carts, calculate total from subtotal + shipping
  const total = isOrder ? cartOrOrder.amount : (subTotal + shipping)
  
  // Always calculate totalQuantity from items
  const totalQuantity = cartOrOrder.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0

  return {
    id: cartOrOrder.id,
    code: cartOrOrder.id,
    state: cartOrOrder.status || 'AddingItems',
    active: cartOrOrder.status !== 'completed',
    lines: cartOrOrder.items?.map((item: any) => mapOrderLine(item)) || [],
    totalQuantity,
    subTotal,
    subTotalWithTax: subTotal,
    shipping,
    shippingWithTax: shipping,
    total,
    totalWithTax: total,
    taxSummary: [], // TODO: implemented later with tax calculation logic
    shippingLines: shipping > 0 ? [{
      id: `shipping-${cartOrOrder.id}`,
      shippingMethod: cartOrOrder.shippingMethod 
        ? mapShippingMethod(cartOrOrder.shippingMethod)
        : {
            id: 'calculated',
            code: 'calculated',
            name: 'Shipping',
            description: 'Shipping cost',
            price: shipping,
            priceWithTax: shipping,
          },
      price: shipping,
      priceWithTax: shipping,
    }] : [],
    currencyCode: 'USD',
    customer: cartOrOrder.customer ? mapCustomerSummary(cartOrOrder.customer) : null,
    shippingAddress: cartOrOrder.shippingAddress ? mapOrderAddress(cartOrOrder.shippingAddress) : null,
    billingAddress: cartOrOrder.billingAddress ? mapOrderAddress(cartOrOrder.billingAddress) : null,
    shippingMethod: cartOrOrder.shippingMethod ? mapShippingMethod(cartOrOrder.shippingMethod) : null,
    payments: cartOrOrder.payments?.map((p: any) => mapPayment(p)) || [],
    discounts: [],
    couponCodes: cartOrOrder.couponCodes?.map((item: any) => item.code) || [],
    createdAt: cartOrOrder.createdAt,
    updatedAt: cartOrOrder.updatedAt,
  }
}

function mapOrderLine(item: any): any {
  const product = item.product || item.products
  const variant = item.variant || item.variants
  
  const unitPrice = variant?.priceInUSD || product?.priceInUSD || 0
  const quantity = item.quantity || 1
  const linePrice = unitPrice * quantity

  // Format variant ID consistently: productId-variantId or productId-default
  const variantId = variant?.id 
    ? `${product?.id}-${variant.id}` 
    : `${product?.id}-default`

  return {
    id: item.id,
    productVariant: {
      id: variantId,
      name: variant?.title || product?.title,
      sku: variant?.sku || `PROD-${product?.id}`,
      price: unitPrice,
      priceWithTax: unitPrice,
      currencyCode: 'USD',
      stockLevel: 'IN_STOCK',
      featuredAsset: product?.gallery?.[0]?.image ? mapAsset(product.gallery[0].image) : null,
      product: {
        id: product?.id,
        name: product?.title,
        slug: product?.slug,
        description: product?.description,
        featuredAsset: product?.gallery?.[0]?.image ? mapAsset(product.gallery[0].image) : null,
      },
    },
    featuredAsset: product?.gallery?.[0]?.image ? mapAsset(product.gallery[0].image) : null,
    quantity,
    linePrice,
    linePriceWithTax: linePrice,
    unitPrice,
    unitPriceWithTax: unitPrice,
    discounts: [],
  }
}

function calculateSubTotal(cart: any): number {
  if (!cart.items || cart.items.length === 0) return 0

  return cart.items.reduce((sum: number, item: any) => {
    const product = item.product || item.products
    const variant = item.variant || item.variants
    const price = variant?.priceInUSD || product?.priceInUSD || 0
    const quantity = item.quantity || 1
    return sum + (price * quantity)
  }, 0)
}

function mapOrderAddress(address: any): any {
  if (!address) return null

  return {
    fullName: address.fullName,
    company: address.company,
    streetLine1: address.streetLine1,
    streetLine2: address.streetLine2,
    city: address.city,
    province: address.province,
    postalCode: address.postalCode,
    country: address.country,
    countryCode: address.country,
    phoneNumber: address.phoneNumber,
  }
}

function mapShippingMethod(method: any): any {
  if (!method) return null

  const methodData = typeof method === 'object' ? method : method
  // Shipping prices are stored in dollars in DB, convert to cents
  const priceInCents = methodData.price ? Math.round(methodData.price * 100) : 0

  return {
    id: methodData.id,
    code: methodData.code,
    name: methodData.name,
    description: methodData.description,
    price: priceInCents,
    priceWithTax: priceInCents,
  }
}

function mapPayment(payment: any): any {
  return {
    id: payment.id,
    method: payment.method || 'stripe',
    amount: payment.amount || 0,
    state: payment.state || 'Pending',
    transactionId: payment.transactionId,
    metadata: payment.metadata,
  }
}

function mapCustomerSummary(customer: any): any {
  if (!customer) return null

  const custData = typeof customer === 'object' ? customer : customer

  return {
    id: custData.id,
    firstName: custData.firstName || custData.name?.split(' ')[0] || '',
    lastName: custData.lastName || custData.name?.split(' ').slice(1).join(' ') || '',
    emailAddress: custData.email,
    phoneNumber: custData.phoneNumber,
  }
}

