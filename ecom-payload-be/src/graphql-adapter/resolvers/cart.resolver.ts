import { GraphQLContext } from '../context'
import { mapOrder } from '../mappers/order.mapper'

export const cartResolvers = {
  Query: {
    async activeOrder(_: any, __: any, context: GraphQLContext) {
      const { payload, user, cartSecret } = context

      try {
        let cart

        if (user) {
          // Authenticated user: find cart by customer
          const result = await payload.find({
            collection: 'carts',
            where: {
              customer: { equals: user.id },
              status: { not_equals: 'completed' },
            },
            limit: 1,
            depth: 3,
          })
          cart = result.docs[0]
        } else if (cartSecret) {
          // Guest user with cart secret: find cart by secret
          console.log('[CART DEBUG] activeOrder: Looking for guest cart by secret')
          const result = await payload.find({
            collection: 'carts',
            where: {
              secret: { equals: cartSecret },
              customer: { exists: false },
              status: { not_equals: 'completed' },
            },
            limit: 1,
            depth: 3,
          })
          cart = result.docs[0]
          if (cart) {
            console.log('[CART DEBUG] activeOrder: Found guest cart:', cart.id)
          }
        }

        if (!cart) {
          return {
            id: 'temp',
            code: 'temp',
            state: 'AddingItems',
            active: true,
            lines: [],
            totalQuantity: 0,
            subTotal: 0,
            subTotalWithTax: 0,
            shipping: 0,
            shippingWithTax: 0,
            total: 0,
            totalWithTax: 0,
            taxSummary: [],
            shippingLines: [],
            currencyCode: 'USD',
            customer: null,
            shippingAddress: null,
            billingAddress: null,
            shippingMethod: null,
            payments: [],
            discounts: [],
            couponCodes: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        }

        return mapOrder(cart)
      } catch (error) {
        console.error('Error fetching active order:', error)
        return null
      }
    },

    async orderByCode(_: any, args: { code: string }, context: GraphQLContext) {
      const { payload, user } = context
      
      console.log('[Order By Code] Fetching order:', {
        code: args.code,
        userId: user?.id,
      })

      try {
        const order = await payload.findByID({
          collection: 'orders',
          id: args.code,
          depth: 3,
        })
        
        // If shippingMethod is not populated, try to get it from payment metadata
        if (order && !(order as any).shippingMethod && (order as any).transactions?.length > 0) {
          const transaction = (order as any).transactions[0]
          if (transaction?.metadata?.shippingRateId || transaction?.metadata?.shippingRateName) {
            // Try to find shipping method from metadata
            const shippingMethodsResult = await payload.find({
              collection: 'shippingMethods',
              where: {
                enabled: { equals: true },
              },
              limit: 100,
            })
            
            // Try to match by name from metadata
            const shippingRateName = transaction.metadata?.shippingRateName
            if (shippingRateName) {
              const matchingMethod = shippingMethodsResult.docs.find(
                (method: any) => method.name?.toLowerCase() === shippingRateName?.toLowerCase()
              )
              if (matchingMethod) {
                (order as any).shippingMethod = matchingMethod
              }
            }
          }
        }
        
        console.log('[Order By Code] Order found:', {
          orderId: order?.id,
          orderStatus: order?.status,
          orderAmount: order?.amount,
          hasItems: !!order?.items?.length,
          itemCount: order?.items?.length || 0,
          hasShippingMethod: !!(order as any)?.shippingMethod,
          shippingMethodPopulated: typeof (order as any)?.shippingMethod === 'object',
        })

        const mappedOrder = order ? mapOrder(order) : null
        
        console.log('[Order By Code] Mapped order:', {
          id: mappedOrder?.id,
          total: mappedOrder?.total,
          lineCount: mappedOrder?.lines?.length || 0,
        })
        
        return mappedOrder
      } catch (error) {
        console.error('[Order By Code] Error fetching order:', {
          code: args.code,
          error: error instanceof Error ? error.message : String(error),
        })
        return null
      }
    },
  },

  Mutation: {
    async addItemToOrder(
      _: any,
      args: { productVariantId: string; quantity: number },
      context: GraphQLContext,
    ) {
      const { payload, user } = context

      try {
        // Debug logging: Log incoming request
        console.log('[CART DEBUG] addItemToOrder called:', {
          productVariantId: args.productVariantId,
          quantity: args.quantity,
          userId: user?.id || 'no user',
          userEmail: user?.email || 'no email',
        })

        // Validate input
        if (!args.productVariantId || args.productVariantId.trim() === '') {
          const errorMsg = 'Product variant ID is required'
          console.error('[CART ERROR]', errorMsg)
          throw new Error(errorMsg)
        }

        if (!args.quantity || args.quantity <= 0) {
          const errorMsg = 'Quantity must be greater than 0'
          console.error('[CART ERROR]', errorMsg)
          throw new Error(errorMsg)
        }

        // Parse variant ID
        const parsed = parseVariantId(args.productVariantId)
        console.log('[CART DEBUG] Parsed variant ID:', {
          original: args.productVariantId,
          productId: parsed.productId,
          variantId: parsed.variantId,
        })

        const { productId, variantId } = parsed

        // Validate parsed IDs
        if (!productId || productId.trim() === '') {
          const errorMsg = `Invalid product variant ID format: ${args.productVariantId}`
          console.error('[CART ERROR]', errorMsg)
          throw new Error(errorMsg)
        }

        // Get or create cart
        let cart
        try {
          cart = await getOrCreateCart(payload, user, context.cartSecret, context)
          console.log('[CART DEBUG] Cart retrieved/created:', {
            cartId: cart?.id,
            itemCount: cart?.items?.length || 0,
          })
        } catch (cartError: any) {
          const errorMsg = cartError.message || 'Failed to get or create cart'
          console.error('[CART ERROR] Cart creation failed:', {
            error: errorMsg,
            userId: user?.id || 'no user',
            stack: cartError.stack,
          })
          throw new Error(`Authentication required. Please log in to add items to cart.`)
        }

        // Convert to numbers for comparison (database stores as integers)
        const productIdNum = parseInt(productId, 10)
        if (isNaN(productIdNum)) {
          const errorMsg = `Invalid product ID: ${productId} (not a number)`
          console.error('[CART ERROR]', errorMsg)
          throw new Error(errorMsg)
        }

        const variantIdNum = variantId && variantId !== 'default' ? parseInt(variantId, 10) : null
        if (variantId && variantId !== 'default' && isNaN(variantIdNum!)) {
          const errorMsg = `Invalid variant ID: ${variantId} (not a number)`
          console.error('[CART ERROR]', errorMsg)
          throw new Error(errorMsg)
        }

        // Verify product exists before adding to cart
        let productExists
        try {
          const product = await payload.findByID({
            collection: 'products',
            id: productIdNum,
            depth: 0,
          })
          productExists = !!product
          console.log('[CART DEBUG] Product verification:', {
            productId: productIdNum,
            exists: productExists,
          })
        } catch (error: any) {
          console.error('[CART ERROR] Failed to verify product:', {
            productId: productIdNum,
            error: error.message,
          })
          productExists = false
        }

        if (!productExists) {
          const errorMsg = `Product with ID ${productIdNum} not found`
          console.error('[CART ERROR]', errorMsg)
          throw new Error(errorMsg)
        }

        // Verify variant exists if provided
        if (variantIdNum !== null) {
          let variantExists
          try {
            const variant = await payload.findByID({
              collection: 'variants',
              id: variantIdNum,
              depth: 0,
            })
            variantExists = !!variant
            console.log('[CART DEBUG] Variant verification:', {
              variantId: variantIdNum,
              exists: variantExists,
            })
          } catch (error: any) {
            console.error('[CART ERROR] Failed to verify variant:', {
              variantId: variantIdNum,
              error: error.message,
            })
            variantExists = false
          }

          if (!variantExists) {
            const errorMsg = `Variant with ID ${variantIdNum} not found`
            console.error('[CART ERROR]', errorMsg)
            throw new Error(errorMsg)
          }
        }

        console.log('[CART DEBUG] Processing item:', {
          productIdNum,
          variantIdNum,
          quantity: args.quantity,
        })

        // Find existing item with improved comparison logic
        const existingItemIndex = cart.items?.findIndex((item: any) => {
          // Extract product ID from item (handle both populated and unpopulated relations)
          let itemProductId: number | null = null
          if (item.product) {
            if (typeof item.product === 'number') {
              itemProductId = item.product
            } else if (typeof item.product === 'object' && item.product.id) {
              itemProductId = typeof item.product.id === 'number' 
                ? item.product.id 
                : parseInt(String(item.product.id), 10)
            } else if (typeof item.product === 'string') {
              itemProductId = parseInt(item.product, 10)
            }
          }

          // Extract variant ID from item (handle both populated and unpopulated relations)
          let itemVariantId: number | null = null
          if (item.variant) {
            if (typeof item.variant === 'number') {
              itemVariantId = item.variant
            } else if (typeof item.variant === 'object' && item.variant.id) {
              itemVariantId = typeof item.variant.id === 'number'
                ? item.variant.id
                : parseInt(String(item.variant.id), 10)
            } else if (typeof item.variant === 'string') {
              itemVariantId = parseInt(item.variant, 10)
            }
          }

          // Normalize to numbers for comparison
          const normalizedItemProductId = itemProductId !== null && !isNaN(itemProductId) ? itemProductId : null
          const normalizedItemVariantId = itemVariantId !== null && !isNaN(itemVariantId) ? itemVariantId : null

          // Must have the same product
          if (normalizedItemProductId !== productIdNum) {
            return false
          }

          // If new item has a variant, existing item must have the same variant
          if (variantIdNum !== null) {
            return normalizedItemVariantId === variantIdNum
          }

          // If new item has no variant, existing item must also have no variant
          return normalizedItemVariantId === null
        })

        console.log('[CART DEBUG] Existing item search:', {
          existingItemIndex,
          totalItems: cart.items?.length || 0,
        })

        // Update existing item or add new one
        if (existingItemIndex !== undefined && existingItemIndex >= 0) {
          const oldQuantity = cart.items[existingItemIndex].quantity
          cart.items[existingItemIndex].quantity += args.quantity
          console.log('[CART DEBUG] Updated existing item:', {
            index: existingItemIndex,
            oldQuantity,
            newQuantity: cart.items[existingItemIndex].quantity,
          })
        } else {
          const newItem: any = {
            product: productIdNum,
            quantity: args.quantity,
          }

          if (variantIdNum !== null) {
            newItem.variant = variantIdNum
          }

          cart.items = [...(cart.items || []), newItem]
          console.log('[CART DEBUG] Added new item:', {
            productId: productIdNum,
            variantId: variantIdNum,
            quantity: args.quantity,
            totalItems: cart.items.length,
          })
        }

        // Clean up any items with null product references before updating
        // This prevents the plugin's beforeChange hook from failing
        const validItems = (cart.items || []).filter((item: any) => {
          // Check if product exists (either as ID or object)
          const hasProduct = item.product !== null && item.product !== undefined
          if (!hasProduct) {
            console.warn('[CART DEBUG] Removing item with null product:', item)
            return false
          }
          return true
        })

        console.log('[CART DEBUG] Cart items before cleanup:', cart.items?.length || 0)
        console.log('[CART DEBUG] Valid items after cleanup:', validItems.length)

        // Update cart in database
        console.log('[CART DEBUG] Updating cart in database...')
        cart = await payload.update({
          collection: 'carts',
          id: cart.id,
          data: {
            items: validItems,
          },
          depth: 3,
        })

        console.log('[CART DEBUG] Cart updated successfully:', {
          cartId: cart.id,
          itemCount: cart.items?.length || 0,
        })

        return mapOrder(cart)
      } catch (error: any) {
        // Enhanced error logging
        const errorDetails = {
          message: error.message,
          productVariantId: args.productVariantId,
          quantity: args.quantity,
          userId: user?.id || 'no user',
          stack: error.stack,
        }
        console.error('[CART ERROR] Error adding item to order:', errorDetails)
        
        // Return more specific error message
        if (error.message.includes('Authentication required') || error.message.includes('logged in')) {
          throw error
        }
        if (error.message.includes('Invalid') || error.message.includes('required')) {
          throw error
        }
        throw new Error(`Failed to add item to cart: ${error.message || 'Unknown error'}`)
      }
    },

    async adjustOrderLine(
      _: any,
      args: { orderLineId: string; quantity: number },
      context: GraphQLContext,
    ) {
      const { payload, user } = context

      try {
        let cart = await getOrCreateCart(payload, user, context.cartSecret, context)

        if (!cart.items) {
          throw new Error('Cart is empty')
        }

        const itemIndex = cart.items.findIndex((item: any) => item.id === args.orderLineId)

        if (itemIndex === -1) {
          throw new Error('Order line not found')
        }

        if (args.quantity <= 0) {
          cart.items = cart.items.filter((_: any, i: number) => i !== itemIndex)
        } else {
          cart.items[itemIndex].quantity = args.quantity
        }

        cart = await payload.update({
          collection: 'carts',
          id: cart.id,
          data: {
            items: cart.items,
          },
          depth: 3,
        })

        return mapOrder(cart)
      } catch (error) {
        console.error('Error adjusting order line:', error)
        throw new Error('Failed to adjust order line')
      }
    },

    async removeOrderLine(_: any, args: { orderLineId: string }, context: GraphQLContext) {
      const { payload, user } = context

      try {
        let cart = await getOrCreateCart(payload, user, context.cartSecret, context)

        if (!cart.items) {
          throw new Error('Cart is empty')
        }

        cart.items = cart.items.filter((item: any) => item.id !== args.orderLineId)

        cart = await payload.update({
          collection: 'carts',
          id: cart.id,
          data: {
            items: cart.items,
          },
          depth: 3,
        })

        return mapOrder(cart)
      } catch (error) {
        console.error('Error removing order line:', error)
        throw new Error('Failed to remove order line')
      }
    },

    async removeAllOrderLines(_: any, __: any, context: GraphQLContext) {
      const { payload, user } = context

      try {
        let cart = await getOrCreateCart(payload, user, context.cartSecret, context)

        cart = await payload.update({
          collection: 'carts',
          id: cart.id,
          data: {
            items: [],
          },
          depth: 3,
        })

        return mapOrder(cart)
      } catch (error) {
        console.error('Error removing all order lines:', error)
        throw new Error('Failed to clear cart')
      }
    },

    async applyCouponCode(_: any, args: { couponCode: string }, context: GraphQLContext) {
      const { payload, user } = context

      try {
        let cart = await getOrCreateCart(payload, user, context.cartSecret, context)

        const existingCoupons = cart.couponCodes || []
        
        const alreadyApplied = existingCoupons.some(
          (item: any) => item.code === args.couponCode
        )
        
        if (alreadyApplied) {
          return mapOrder(cart)
        }

        const updatedCoupons = [...existingCoupons, { code: args.couponCode }]

        cart = await payload.update({
          collection: 'carts',
          id: cart.id,
          data: {
            couponCodes: updatedCoupons,
          },
          depth: 3,
        })

        return mapOrder(cart)
      } catch (error) {
        console.error('Error applying coupon code:', error)
        throw new Error('Failed to apply coupon code')
      }
    },

    async removeCouponCode(_: any, args: { couponCode: string }, context: GraphQLContext) {
      const { payload, user } = context

      try {
        let cart = await getOrCreateCart(payload, user, context.cartSecret, context)

        const existingCoupons = cart.couponCodes || []
        const updatedCoupons = existingCoupons.filter(
          (item: any) => item.code !== args.couponCode
        )

        cart = await payload.update({
          collection: 'carts',
          id: cart.id,
          data: {
            couponCodes: updatedCoupons,
          },
          depth: 3,
        })

        return mapOrder(cart)
      } catch (error) {
        console.error('Error removing coupon code:', error)
        throw new Error('Failed to remove coupon code')
      }
    },
  },
}

async function getOrCreateCart(payload: any, user: any, cartSecret?: string | null, context?: GraphQLContext): Promise<any> {
  console.log('[CART DEBUG] getOrCreateCart called:', {
    userId: user?.id || 'guest',
    userEmail: user?.email || 'no email',
    isGuest: !user || !user.id,
    hasCartSecret: !!cartSecret,
  })

  try {
    // Handle authenticated users
    if (user && user.id) {
      // Find existing active cart for authenticated user
      const result = await payload.find({
        collection: 'carts',
        where: {
          customer: { equals: user.id },
          status: { not_equals: 'completed' },
        },
        limit: 1,
        depth: 3,
      })

      let cart = result.docs[0]

      if (!cart) {
        // Create new cart for authenticated user
        console.log('[CART DEBUG] Creating new cart for user:', user.id)
        cart = await payload.create({
          collection: 'carts',
          data: {
            customer: user.id,
            items: [],
            status: 'active',
          },
          depth: 3,
        })
        console.log('[CART DEBUG] New cart created:', cart.id)
      } else {
        console.log('[CART DEBUG] Existing cart found:', {
          cartId: cart.id,
          itemCount: cart.items?.length || 0,
        })
      }

      return cart
    }

    // Handle guest users with cart secret
    if (cartSecret) {
      // Try to find existing cart by secret
      console.log('[CART DEBUG] Looking for guest cart by secret')
      const result = await payload.find({
        collection: 'carts',
        where: {
          secret: { equals: cartSecret },
          customer: { exists: false },
          status: { not_equals: 'completed' },
        },
        limit: 1,
        depth: 3,
      })

      const existingCart = result.docs[0]
      if (existingCart) {
        console.log('[CART DEBUG] Found existing guest cart:', {
          cartId: existingCart.id,
          itemCount: existingCart.items?.length || 0,
        })
        return existingCart
      }
      console.log('[CART DEBUG] No cart found for provided secret, will create new one')
    }

    // Create new guest cart (plugin will auto-generate secret when allowGuestCarts is enabled)
    console.log('[CART DEBUG] Creating new guest cart')
    const guestCart = await payload.create({
      collection: 'carts',
      data: {
        status: 'active',
        items: [],
      } as any,
      depth: 3,
    })
    console.log('[CART DEBUG] New guest cart created:', {
      cartId: guestCart.id,
      secret: guestCart.secret ? 'present' : 'missing',
    })
    
    // Store the secret in context so it can be returned in response header
    if (context && guestCart.secret) {
      context.newCartSecret = guestCart.secret
      console.log('[CART DEBUG] Stored new cart secret in context for response header')
    }
    
    return guestCart
  } catch (error: any) {
    const errorMsg = `Failed to get or create cart: ${error.message || 'Unknown error'}`
    console.error('[CART ERROR] getOrCreateCart failed:', {
      error: errorMsg,
      userId: user?.id || 'guest',
      stack: error.stack,
    })
    throw new Error(errorMsg)
  }
}

function parseVariantId(variantId: string): { productId: string; variantId: string } {
  // Validate input
  if (!variantId || typeof variantId !== 'string') {
    console.error('[CART ERROR] parseVariantId: Invalid input:', variantId)
    throw new Error(`Invalid variant ID: must be a non-empty string`)
  }

  const trimmed = variantId.trim()
  if (trimmed === '') {
    console.error('[CART ERROR] parseVariantId: Empty string provided')
    throw new Error(`Invalid variant ID: cannot be empty`)
  }

  console.log('[CART DEBUG] parseVariantId: Parsing:', trimmed)

  const parts = trimmed.split('-')
  
  // If we have at least 2 parts, treat last part as variant ID, rest as product ID
  if (parts.length >= 2) {
    const varId = parts[parts.length - 1]
    const prodId = parts.slice(0, -1).join('-')
    
    // Validate that we have non-empty IDs
    if (!prodId || prodId.trim() === '') {
      console.error('[CART ERROR] parseVariantId: Empty product ID after parsing')
      throw new Error(`Invalid variant ID format: product ID is empty (${trimmed})`)
    }
    
    if (!varId || varId.trim() === '') {
      console.error('[CART ERROR] parseVariantId: Empty variant ID after parsing')
      throw new Error(`Invalid variant ID format: variant ID is empty (${trimmed})`)
    }

    const result = {
      productId: prodId.trim(),
      variantId: varId.trim(),
    }
    
    console.log('[CART DEBUG] parseVariantId: Parsed result:', result)
    return result
  }

  // Single part - treat as product ID with default variant
  if (parts.length === 1) {
    const result = {
      productId: trimmed,
      variantId: 'default',
    }
    console.log('[CART DEBUG] parseVariantId: Single part, using default variant:', result)
    return result
  }

  // Should not reach here, but handle edge case
  console.error('[CART ERROR] parseVariantId: Unexpected format:', trimmed)
  throw new Error(`Invalid variant ID format: ${trimmed}`)
}

