import { GraphQLContext } from '../context'
import { mapOrder } from '../mappers/order.mapper'
import Stripe from 'stripe'
import type { Order, Transaction, Address, Cart, User } from '../../payload-types'
import { countryOptions } from '../../blocks/Form/Country/options'

// Countries that are actually supported by the Address collection schema
const SUPPORTED_COUNTRY_CODES = [
  'US', 'GB', 'CA', 'AU', 'AT', 'BE', 'BR', 'BG', 'CY', 'CZ',
  'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HK', 'HU', 'IN', 'IE',
  'IT', 'JP', 'LV', 'LT', 'LU', 'MY', 'MT', 'MX', 'NL', 'NZ',
  'NO', 'PL', 'PT', 'RO', 'SG', 'SK', 'SI', 'ES', 'SE', 'CH'
] as const

export const checkoutResolvers = {
  Query: {
    async availableCountries(_: any, __: any, context: GraphQLContext) {
      // Filter to only return countries that are supported by the Address collection
      return countryOptions
        .filter((country) => SUPPORTED_COUNTRY_CODES.includes(country.value as any))
        .map((country) => ({
          id: country.value,
          code: country.value,
          name: country.label,
          enabled: true,
        }))
    },

    async eligibleShippingMethods(_: any, __: any, context: GraphQLContext) {
      const { payload } = context

      try {
        const result = await payload.find({
          collection: 'shippingMethods',
          where: {
            enabled: { equals: true },
          },
          limit: 100,
        })

        return result.docs.map((method: any) => ({
          id: method.id,
          code: method.code || `shipping-${method.id}`,
          name: method.name,
          description: method.description,
          price: Math.round(method.price * 100), // Convert dollars to cents
          priceWithTax: Math.round(method.price * 100), // Convert dollars to cents
          metadata: null,
        }))
      } catch (error) {
        console.error('Error fetching shipping methods:', error)
        return []
      }
    },

    async eligiblePaymentMethods(_: any, __: any, context: GraphQLContext) {
      return [
        {
          id: 'stripe',
          code: 'stripe',
          name: 'Credit Card',
          description: 'Pay with credit or debit card',
          enabled: true,
          isEligible: true,
          eligibilityMessage: null,
        },
      ]
    },
  },

  Mutation: {
    async setOrderShippingAddress(
      _: any,
      args: { input: any },
      context: GraphQLContext,
    ) {
      const { payload, user, cartSecret } = context

      try {
        let cart = await getCartForUserOrGuest(payload, user, cartSecret)

        if (!cart) {
          throw new Error('No active cart found')
        }

        const addressData = {
          customer: user?.id || null,
          fullName: args.input.fullName,
          company: args.input.company,
          streetLine1: args.input.streetLine1,
          streetLine2: args.input.streetLine2,
          city: args.input.city,
          province: args.input.province,
          postalCode: args.input.postalCode,
          country: args.input.countryCode,
          phoneNumber: args.input.phoneNumber,
          defaultShippingAddress: args.input.defaultShippingAddress || false,
        }

        const address = await payload.create({
          collection: 'addresses',
          data: addressData,
        })

        cart = await payload.update({
          collection: 'carts',
          id: cart.id,
          data: {
            shippingAddress: address.id,
          } as any,
          depth: 3,
        })

        return mapOrder(cart)
      } catch (error) {
        console.error('Error setting shipping address:', error)
        throw new Error('Failed to set shipping address')
      }
    },


    async setOrderBillingAddress(
      _: any,
      args: { input: any },
      context: GraphQLContext,
    ) {
      const { payload, user, cartSecret } = context

      try {
        let cart = await getCartForUserOrGuest(payload, user, cartSecret)

        if (!cart) {
          throw new Error('No active cart found')
        }

        const addressData = {
          customer: user?.id || null,
          fullName: args.input.fullName,
          company: args.input.company,
          streetLine1: args.input.streetLine1,
          streetLine2: args.input.streetLine2,
          city: args.input.city,
          province: args.input.province,
          postalCode: args.input.postalCode,
          country: args.input.countryCode,
          phoneNumber: args.input.phoneNumber,
          defaultBillingAddress: args.input.defaultBillingAddress || false,
        }

        const address = await payload.create({
          collection: 'addresses',
          data: addressData,
        })

        cart = await payload.update({
          collection: 'carts',
          id: cart.id,
          data: {
            billingAddress: address.id,
          } as any,
          depth: 3,
        })

        return mapOrder(cart)
      } catch (error) {
        console.error('Error setting billing address:', error)
        throw new Error('Failed to set billing address')
      }
    },

    async setOrderShippingMethod(
      _: any,
      args: { shippingMethodId: string[] },
      context: GraphQLContext,
    ) {
      const { payload, user, cartSecret } = context

      try {
        let cart = await getCartForUserOrGuest(payload, user, cartSecret)

        if (!cart) {
          throw new Error('No active cart found')
        }

        const shippingMethodId = args.shippingMethodId[0]

        const shippingMethod = await payload.findByID({
          collection: 'shippingMethods',
          id: shippingMethodId,
        })

        if (!shippingMethod) {
          throw new Error('Shipping method not found')
        }

        cart = await payload.update({
          collection: 'carts',
          id: cart.id,
          data: {
            shippingMethod: shippingMethod.id,
          } as any,
          depth: 3,
        })

        return mapOrder(cart)
      } catch (error) {
        console.error('Error setting shipping method:', error)
        throw new Error('Failed to set shipping method')
      }
    },


    async addPaymentToOrder(
      _: any,
      args: { input: any },
      context: GraphQLContext,
    ) {
      const { payload, user, cartSecret } = context

      try {
        let cart = await getCartForUserOrGuest(payload, user, cartSecret)

        if (!cart) {
          throw new Error('No active cart found')
        }

        const total = calculateCartTotal(cart)

        const payment = {
          method: args.input.method,
          amount: total,
          state: 'Authorized',
          metadata: args.input.metadata,
        }

        const existingPayments = cart.payments || []

        cart = await payload.update({
          collection: 'carts',
          id: cart.id,
          data: {
            payments: [...existingPayments, payment],
            status: 'purchased',
          } as any,
          depth: 3,
        })

        // Determine customer email from available sources (priority: user.email > cart.customer.email > args.input.email)
        const customerEmail = 
          user?.email || 
          (cart.customer && typeof cart.customer === 'object' ? cart.customer.email : null) ||
          args.input?.email ||
          null
        
        console.log('[Add Payment] Customer email determined:', {
          fromUser: user?.email || null,
          fromCart: (cart.customer && typeof cart.customer === 'object' ? cart.customer.email : null) || null,
          finalEmail: customerEmail || null,
        })

        const order = await createOrderFromCart(cart, payload, customerEmail || undefined)

        // Create Transaction record for payment tracking
        try {
          await createTransactionFromPayment(
            cart,
            order,
            payment,
            customerEmail,
            payload
          )
          console.log('[Add Payment] Transaction created successfully')
        } catch (transactionError) {
          // Log error but don't fail the order creation
          console.error('[Add Payment] Error creating transaction:', transactionError)
        }

        return mapOrder(order)
      } catch (error) {
        console.error('Error adding payment:', error)
        throw new Error('Failed to add payment to order')
      }
    },

    async transitionOrderToState(
      _: any,
      args: { state: string },
      context: GraphQLContext,
    ) {
      const { payload, user, cartSecret } = context

      try {
        let cart = await getCartForUserOrGuest(payload, user, cartSecret)

        if (!cart) {
          throw new Error('No active cart found')
        }

        const validStatuses = ['active', 'purchased', 'abandoned'] as const
        const status = validStatuses.includes(args.state.toLowerCase() as any) 
          ? args.state.toLowerCase() 
          : 'active'

        cart = await payload.update({
          collection: 'carts',
          id: cart.id,
          data: {
            status,
          } as any,
          depth: 3,
        })

        return mapOrder(cart)
      } catch (error) {
        console.error('Error transitioning order state:', error)
        throw new Error('Failed to transition order state')
      }
    },

    async setCustomerForOrder(
      _: any,
      args: { input: any },
      context: GraphQLContext,
    ) {
      const { payload, user } = context

      try {
        let cart
        if (user) {
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
        }

        if (!cart) {
          cart = await payload.create({
            collection: 'carts',
            data: {
              status: 'active',
              items: [],
            } as any,
            depth: 3,
          })
        }

        return mapOrder(cart)
      } catch (error) {
        console.error('Error setting customer for order:', error)
        throw new Error('Failed to set customer for order')
      }
    },

    async createStripeCheckoutSession(
      _: any,
      __: any,
      context: GraphQLContext,
    ) {
      const { payload, user, cartSecret } = context

      try {
        if (!process.env.STRIPE_SECRET_KEY) {
          throw new Error('Stripe secret key is not configured')
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2025-08-27.basil',
        })

        // Get active cart (for authenticated or guest users)
        const cart = await getCartForUserOrGuest(payload, user, cartSecret)

        if (!cart) {
          throw new Error('No active cart found')
        }

        if (!cart.items || cart.items.length === 0) {
          throw new Error('Cart is empty')
        }

        // Validate cart items structure
        const validItems = cart.items.filter((item: any) => {
          const product = item.product
          const variant = item.variant
          return product || variant
        })

        if (validItems.length === 0) {
          throw new Error('Cart contains no valid items with product or variant data')
        }

        // Calculate total
        const total = calculateCartTotal(cart)
        if (total <= 0) {
          throw new Error('Cart total must be greater than zero')
        }

        // Build line items for Stripe with validation
        const lineItems: any[] = []
        
        for (const item of validItems) {
          try {
            const product = typeof item.product === 'object' && item.product !== null ? item.product : null
            const variant = typeof item.variant === 'object' && item.variant !== null ? item.variant : null
            const price = (variant && 'priceInUSD' in variant ? variant.priceInUSD : null) || 
                         (product && 'priceInUSD' in product ? product.priceInUSD : null) || 0
            const quantity = item.quantity || 1

            if (price <= 0) {
              const productTitle = (product && 'title' in product ? product.title : null) || 
                                   (variant && 'title' in variant ? variant.title : null) || 
                                   'Unknown'
              console.warn(`Skipping item with invalid price: ${productTitle}`)
              continue
            }

            if (quantity <= 0) {
              const productTitle = (product && 'title' in product ? product.title : null) || 
                                   (variant && 'title' in variant ? variant.title : null) || 
                                   'Unknown'
              console.warn(`Skipping item with invalid quantity: ${productTitle}`)
              continue
            }

            // Build product_data conditionally - only include description if it has a value
            const productName = (product && 'title' in product ? product.title : null) || 
                               (variant && 'title' in variant ? variant.title : null) || 
                               'Product'
            const productDescription = (product && 'description' in product ? product.description : null) || 
                                      (variant && 'description' in variant ? variant.description : null) || 
                                      null
            
            const productData: any = {
              name: productName,
            }
            
            // Only include description if it exists and is not empty
            if (productDescription && typeof productDescription === 'string' && productDescription.trim() !== '') {
              productData.description = productDescription
            }
            
            // Prices are stored in cents (e.g., 4900 = $49.00, 2499 = $24.99)
            // Stripe's unit_amount expects cents, so use price directly without multiplication
            const unitAmount = Math.round(price)
            
            // Log price conversion for debugging
            console.log(`[Stripe Checkout] Product: ${productName}, Price (cents): ${price}, Unit Amount: ${unitAmount}, Display: $${(unitAmount / 100).toFixed(2)}`)
            
            lineItems.push({
              price_data: {
                currency: 'usd',
                product_data: productData,
                unit_amount: unitAmount,
              },
              quantity: quantity,
            })
          } catch (itemError) {
            console.error('Error processing cart item:', itemError)
            // Continue with other items
          }
        }

        // Validate line items array
        if (lineItems.length === 0) {
          throw new Error('No valid line items could be created from cart items')
        }

        // Add shipping as a line item if cart already has a shipping method selected
        // We don't use Stripe's shipping_options to avoid asking user for address twice
        if (cart.shippingMethod) {
          const selectedMethod = typeof cart.shippingMethod === 'object' 
            ? cart.shippingMethod 
            : await payload.findByID({
                collection: 'shippingMethods',
                id: cart.shippingMethod,
              })
          
          if (selectedMethod && selectedMethod.price && selectedMethod.price > 0) {
            // Shipping prices are stored in dollars in the database
            // Stripe expects amount in cents, so multiply by 100
            const shippingAmount = Math.round(selectedMethod.price * 100)
            
            const shippingProductData: any = {
              name: `Shipping: ${selectedMethod.name}`,
            }
            
            // Only include description if it exists and is not empty
            if (selectedMethod.description && selectedMethod.description.trim() !== '') {
              shippingProductData.description = selectedMethod.description
            }
            
            lineItems.push({
              price_data: {
                currency: 'usd',
                product_data: shippingProductData,
                unit_amount: shippingAmount,
              },
              quantity: 1,
            })
          }
        }

        // Get frontend URL from environment or use default
        const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:8080'

        // Prepare session creation parameters
        const sessionParams: any = {
          payment_method_types: ['card'],
          line_items: lineItems,
          mode: 'payment',
          success_url: `${frontendUrl}/checkout/confirmation/{CHECKOUT_SESSION_ID}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${frontendUrl}/checkout`,
          metadata: {
            cartId: cart.id,
            userId: user?.id || null,
            cartSecret: cart.secret || null,
          },
        }

        // We don't add shipping_options or shipping_address_collection
        // because the user already entered their shipping address and selected
        // their shipping method in the frontend checkout form

        // Determine customer email from available sources (priority: user.email > cart.customer.email)
        const customerEmail = 
          user?.email || 
          (cart.customer && typeof cart.customer === 'object' ? cart.customer.email : null)
        
        // Only include customer_email if email exists
        if (customerEmail) {
          sessionParams.customer_email = customerEmail
        }

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create(sessionParams)

        if (!session.url) {
          throw new Error('Stripe session was created but no URL was returned')
        }

        return session.url
      } catch (error: unknown) {
        console.error('Error creating Stripe checkout session:', error)
        
        // Provide more detailed error messages
        if (error instanceof Error) {
          // If it's already a user-friendly error, re-throw it
          if (error.message.includes('Must be logged in') || 
              error.message.includes('not configured') ||
              error.message.includes('No active cart') ||
              error.message.includes('Cart is empty') ||
              error.message.includes('no valid items') ||
              error.message.includes('No valid line items') ||
              error.message.includes('must be greater than zero')) {
            throw error
          }
          
          // Generic error with more context
          throw new Error(`Failed to create checkout session: ${error.message}`)
        }
        
        throw new Error('Failed to create checkout session: Unexpected error occurred')
      }
    },

    async confirmStripeCheckout(
      _: any,
      args: { sessionId: string },
      context: GraphQLContext,
    ) {
      const { payload, user, cartSecret } = context

      try {
        if (!process.env.STRIPE_SECRET_KEY) {
          throw new Error('Stripe secret key is not configured')
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2025-08-27.basil',
        })

        // Retrieve the checkout session
        console.log('[Confirm Checkout] Retrieving Stripe session:', args.sessionId)
        const session = await stripe.checkout.sessions.retrieve(args.sessionId)
        console.log('[Confirm Checkout] Session retrieved:', {
          id: session.id,
          payment_status: session.payment_status,
          amount_total: session.amount_total,
          customer_email: session.customer_details?.email,
        })

        // Verify payment status
        if (session.payment_status !== 'paid') {
          console.error('[Confirm Checkout] Payment not completed:', session.payment_status)
          throw new Error('Payment not completed')
        }

        // Get cart from metadata
        const cartId = session.metadata?.cartId
        if (!cartId) {
          console.error('[Confirm Checkout] Cart ID not found in session metadata')
          throw new Error('Cart ID not found in session metadata')
        }

        console.log('[Confirm Checkout] Fetching cart:', cartId)
        let cartResult = await payload.findByID({
          collection: 'carts',
          id: cartId,
          depth: 3,
        })

        if (!cartResult) {
          console.error('[Confirm Checkout] Cart not found:', cartId)
          throw new Error('Cart not found')
        }

        console.log('[Confirm Checkout] Cart found:', {
          cartId: cartResult.id,
          status: cartResult.status,
          itemCount: cartResult.items?.length,
          customer: typeof cartResult.customer === 'object' && cartResult.customer !== null 
            ? cartResult.customer.id 
            : cartResult.customer,
          hasSecret: !!cartResult.secret,
        })

        // Verify cart belongs to user or is a guest cart with matching secret (security check)
        if (user && user.id) {
          // Authenticated user: verify cart belongs to user
          const customerId = typeof cartResult.customer === 'object' && cartResult.customer !== null && 'id' in cartResult.customer
            ? cartResult.customer.id 
            : cartResult.customer

          if (!customerId || customerId !== user.id) {
            throw new Error('Cart does not belong to user')
          }
        } else if (cartSecret) {
          // Guest user: verify cart secret matches
          if (cartResult.secret !== cartSecret) {
            throw new Error('Cart secret does not match')
          }
        } else {
          // No user and no secret - this shouldn't happen but fail securely
          throw new Error('Authentication or cart secret required')
        }

        // Check if cart is already completed (prevents duplicate orders)
        if (cartResult.status === 'completed' || cartResult.status === 'purchased') {
          // Cart already processed, find the existing order
          // For guest carts, search by cart metadata or transaction ID
          const orderWhere: any = user && user.id
            ? { customer: { equals: user.id } }
            : { 'transactions.transactionId': { equals: args.sessionId } }
          
          const existingOrders = await payload.find({
            collection: 'orders',
            where: orderWhere,
            sort: '-createdAt',
            limit: 10,
            depth: 3,
          })
          
          // Find order matching this cart's items and total
          const matchingOrder = existingOrders.docs.find((order: any) => {
            return order.items?.length === cartResult.items?.length &&
                   order.total === (session.amount_total || calculateCartTotal(cartResult))
          })
          
          if (matchingOrder) {
            return mapOrder(matchingOrder)
          }
        }

        // Handle selected shipping method from Stripe
        if (session.shipping_cost && session.shipping_cost.shipping_rate) {
          const shippingRate = session.shipping_cost.shipping_rate
          const shippingRateName = typeof shippingRate === 'object' && shippingRate !== null && 'display_name' in shippingRate
            ? shippingRate.display_name
            : typeof shippingRate === 'string' ? shippingRate : null
          const shippingAmount = session.shipping_cost.amount_total // Amount in cents
          
          if (shippingRateName) {
            console.log(`[Stripe Checkout] Selected shipping: ${shippingRateName}, Amount: ${shippingAmount} cents`)
          }
          
          // Find matching shipping method in our database by name or amount
          const shippingMethodsResult = await payload.find({
            collection: 'shippingMethods',
            where: {
              enabled: { equals: true },
            },
            limit: 100,
          })
          
          // Try to find matching shipping method by name or price
          let matchingShippingMethod = null
          for (const method of shippingMethodsResult.docs) {
            // Match by name (case insensitive) or by price (within 1 cent tolerance)
            // Note: Database stores dollars, Stripe returns cents, so convert for comparison
            const methodPriceInCents = Math.round((method.price || 0) * 100)
            if (
              (shippingRateName && method.name?.toLowerCase() === shippingRateName.toLowerCase()) ||
              Math.abs(methodPriceInCents - shippingAmount) <= 1
            ) {
              matchingShippingMethod = method
              break
            }
          }
          
          // If we found a matching shipping method, update the cart
          if (matchingShippingMethod) {
            cartResult = await payload.update({
              collection: 'carts',
              id: cartId,
              data: {
                shippingMethod: matchingShippingMethod.id,
              } as any,
              depth: 3,
            })
            console.log(`[Stripe Checkout] Updated cart with shipping method: ${matchingShippingMethod.name}`)
          } else if (shippingRateName) {
            console.warn(`[Stripe Checkout] Could not find matching shipping method for: ${shippingRateName}`)
          }
        }

        // Calculate total - use Stripe session total which includes shipping
        // Stripe returns amount_total in cents, our system stores amounts in cents
        const stripeTotal = session.amount_total || 0 // Amount in cents from Stripe
        const total = stripeTotal // Keep in cents to match our system format

        // Create payment record
        const payment = {
          method: 'stripe',
          amount: total, // Store in cents to match our system format
          state: 'Settled',
          transactionId: args.sessionId,
          metadata: {
            paymentIntentId: session.payment_intent,
            sessionId: args.sessionId,
            shippingRateId: (session.shipping_cost?.shipping_rate && typeof session.shipping_cost.shipping_rate === 'object' && 'id' in session.shipping_cost.shipping_rate)
              ? session.shipping_cost.shipping_rate.id
              : null,
            shippingRateName: (session.shipping_cost?.shipping_rate && typeof session.shipping_cost.shipping_rate === 'object' && 'display_name' in session.shipping_cost.shipping_rate)
              ? session.shipping_cost.shipping_rate.display_name
              : null,
          },
        }

        const existingPayments = cartResult.payments || []

        console.log('[Confirm Checkout] Updating cart with payment:', {
          cartId,
          paymentAmount: total,
          paymentMethod: 'stripe',
        })

        // Update cart with payment
        const updatedCart = await payload.update({
          collection: 'carts',
          id: cartId,
          data: {
            payments: [...existingPayments, payment],
            status: 'purchased',
          } as any,
          depth: 3,
        })

        console.log('[Confirm Checkout] Cart updated, creating order...')
        
        // Determine customer email from available sources (priority: Stripe session > user.email > cart.customer.email)
        const customerEmail = 
          session.customer_details?.email || 
          user?.email || 
          (updatedCart.customer && typeof updatedCart.customer === 'object' ? updatedCart.customer.email : null)
        
        console.log('[Confirm Checkout] Customer email determined:', {
          fromStripe: session.customer_details?.email || null,
          fromUser: user?.email || null,
          fromCart: (updatedCart.customer && typeof updatedCart.customer === 'object' ? updatedCart.customer.email : null) || null,
          finalEmail: customerEmail || null,
        })
        
        // Create order - use Stripe total which includes shipping
        const order = await createOrderFromCartWithTotal(updatedCart, payload, total, customerEmail || undefined)
        
        console.log('[Confirm Checkout] Order created successfully:', {
          orderId: order.id,
          orderAmount: order.amount, // Using 'amount' field (Payload ecommerce schema)
          orderStatus: order.status,
          customerPopulated: typeof order.customer === 'object',
          customerId: typeof order.customer === 'object' ? order.customer?.id : order.customer,
        })

        // Create Transaction record for payment tracking
        try {
          // Extract Stripe customer ID from session if available
          const stripeCustomerID = session.customer || session.customer_details?.email || null
          const stripePaymentIntentID = session.payment_intent || null
          
          // Enhance payment metadata with Stripe session details
          const enhancedPayment = {
            ...payment,
            metadata: {
              ...payment.metadata,
              customerID: stripeCustomerID,
              paymentIntentID: stripePaymentIntentID,
            },
          }
          
          await createTransactionFromPayment(
            updatedCart,
            order,
            enhancedPayment,
            customerEmail,
            payload
          )
          console.log('[Confirm Checkout] Transaction created successfully')
        } catch (transactionError) {
          // Log error but don't fail the order creation
          console.error('[Confirm Checkout] Error creating transaction:', transactionError)
        }

        // Create new empty cart for authenticated user after successful order
        if (user && user.id) {
          console.log('[Confirm Checkout] Creating new empty cart for user:', user.id)
          await payload.create({
            collection: 'carts',
            data: {
              customer: user.id,
              items: [],
              status: 'active',
            },
          })
          console.log('[Confirm Checkout] New cart created successfully')
        }

        const mappedOrder = mapOrder(order)
        console.log('[Confirm Checkout] Returning mapped order:', {
          id: mappedOrder.id,
          code: mappedOrder.code,
          total: mappedOrder.total,
          state: mappedOrder.state,
        })

        return mappedOrder
      } catch (error) {
        console.error('Error confirming Stripe checkout:', error)
        throw new Error('Failed to confirm checkout')
      }
    },
  },
}

/**
 * Helper function to get cart for authenticated or guest users
 * For authenticated users: finds cart by customer ID
 * For guest users: finds cart by secret
 */
async function getCartForUserOrGuest(payload: any, user: any, cartSecret?: string | null): Promise<Cart | null> {
  if (user && user.id) {
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
    return result.docs[0] || null
  } else if (cartSecret) {
    // Guest user: find cart by secret
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
    return result.docs[0] || null
  }
  return null
}

/**
 * Extracts and maps address from Cart (relationship) to Order schema format (embedded object)
 * Handles both ID references and populated address objects
 */
function extractAddressForOrder(address: any): Order['shippingAddress'] | null {
  if (!address) return null

  // If address is just an ID, we can't extract fields (should be populated with depth: 3)
  if (typeof address === 'number' || typeof address === 'string') {
    console.warn('[Extract Address] Address is an ID reference, not populated. Cannot extract fields.')
    return null
  }

  // Address is populated object, extract and map fields
  return {
    title: address.title || null,
    firstName: address.firstName || null,
    lastName: address.lastName || null,
    company: address.company || null,
    addressLine1: address.streetLine1 || null,
    addressLine2: address.streetLine2 || null,
    city: address.city || null,
    state: address.province || null, // Map province to state
    postalCode: address.postalCode || null,
    country: address.country || null,
    phone: address.phoneNumber || null, // Map phoneNumber to phone
  }
}

/**
 * Maps payment state to transaction status
 */
function mapPaymentStateToTransactionStatus(paymentState: string): Transaction['status'] {
  switch (paymentState) {
    case 'Settled':
      return 'succeeded'
    case 'Authorized':
      return 'pending'
    case 'Failed':
      return 'failed'
    case 'Pending':
      return 'pending'
    default:
      return 'pending'
  }
}

/**
 * Creates a Transaction record from payment data
 */
async function createTransactionFromPayment(
  cart: Cart | any,
  order: Order,
  payment: any,
  customerEmail: string | null | undefined,
  payload: any
): Promise<Transaction> {
  // Extract billing address from cart
  const billingAddress = extractAddressForOrder(cart.billingAddress)
  
  // Extract Stripe details from payment metadata
  const paymentMetadata = payment.metadata || {}
  const stripeCustomerID = paymentMetadata.customerID || paymentMetadata.paymentIntentId || null
  const stripePaymentIntentID = paymentMetadata.paymentIntentID || paymentMetadata.paymentIntentId || null
  
  // Map payment state to transaction status
  const transactionStatus = mapPaymentStateToTransactionStatus(payment.state || 'Pending')
  
  // Get customer ID (handle both object and ID reference)
  const customerId = typeof cart.customer === 'object' ? cart.customer?.id : cart.customer
  
  // Prepare transaction data
  const transactionData: any = {
    items: cart.items || order.items || [],
    paymentMethod: payment.method === 'stripe' ? 'stripe' : null,
    stripe: stripeCustomerID || stripePaymentIntentID ? {
      customerID: stripeCustomerID,
      paymentIntentID: stripePaymentIntentID,
    } : undefined,
    billingAddress: billingAddress || undefined,
    status: transactionStatus,
    customer: customerId || null,
    customerEmail: customerEmail || null,
    order: order.id,
    cart: cart.id || null,
    amount: payment.amount || order.amount || null,
    currency: 'USD',
  }
  
  console.log('[Create Transaction] Transaction data:', {
    orderId: order.id,
    cartId: cart.id,
    paymentMethod: transactionData.paymentMethod,
    status: transactionData.status,
    amount: transactionData.amount,
    hasBillingAddress: !!transactionData.billingAddress,
    hasStripeData: !!transactionData.stripe,
  })
  
  const transaction = await payload.create({
    collection: 'transactions',
    data: transactionData,
    depth: 3,
  })
  
  console.log('[Create Transaction] Transaction created:', {
    transactionId: transaction.id,
    orderId: order.id,
    status: transaction.status,
  })
  
  return transaction
}

function calculateCartTotal(cart: Cart | any): number {
  let total = 0

  if (cart.items) {
    for (const item of cart.items) {
      const product = item.product || item.products
      const variant = item.variant || item.variants
      const price = variant?.priceInUSD || product?.priceInUSD || 0
      const quantity = item.quantity || 1
      total += price * quantity
    }
  }

  if (cart.shippingMethod) {
    const method = typeof cart.shippingMethod === 'object' ? cart.shippingMethod : null
    total += method?.price || 0
  }

  return total
}

async function createOrderFromCart(cart: Cart | any, payload: any, customerEmail?: string): Promise<Order> {
  return createOrderFromCartWithTotal(cart, payload, calculateCartTotal(cart), customerEmail)
}

async function createOrderFromCartWithTotal(cart: Cart | any, payload: any, total: number, customerEmail?: string): Promise<Order> {
  console.log('[Create Order] Cart data before order creation:', {
    cartId: cart.id,
    hasShippingMethod: !!cart.shippingMethod,
    shippingMethodValue: cart.shippingMethod,
    shippingMethodType: typeof cart.shippingMethod,
    shippingMethodId: typeof cart.shippingMethod === 'object' ? cart.shippingMethod?.id : cart.shippingMethod,
    customerEmail: customerEmail || null,
    hasShippingAddress: !!cart.shippingAddress,
    hasBillingAddress: !!cart.billingAddress,
  })
  
  // Extract and map addresses from cart relationships to embedded order format
  const shippingAddress = extractAddressForOrder(cart.shippingAddress)
  const billingAddress = extractAddressForOrder(cart.billingAddress)
  
  console.log('[Create Order] Address extraction:', {
    shippingAddressExtracted: !!shippingAddress,
    billingAddressExtracted: !!billingAddress,
    shippingAddressFields: shippingAddress ? Object.keys(shippingAddress).filter(k => shippingAddress[k as keyof typeof shippingAddress] !== null) : [],
    billingAddressFields: billingAddress ? Object.keys(billingAddress).filter(k => billingAddress[k as keyof typeof billingAddress] !== null) : [],
  })
  
  const orderData = {
    customer: cart.customer,
    customerEmail: customerEmail || null,
    items: cart.items,
    amount: total, // Use 'amount' field (Payload ecommerce plugin schema)
    currency: 'USD',
    status: 'completed',
    shippingAddress: shippingAddress,
    billingAddress: billingAddress,
    shippingMethod: cart.shippingMethod,
    // Note: totalQuantity and payments are not in default orders schema
    // totalQuantity will be calculated in mapper
  }
  
  console.log('[Create Order] Order data being saved:', {
    shippingMethod: orderData.shippingMethod,
    shippingMethodType: typeof orderData.shippingMethod,
    customerEmail: orderData.customerEmail,
    hasShippingAddress: !!orderData.shippingAddress,
    hasBillingAddress: !!orderData.billingAddress,
  })

  const order = await payload.create({
    collection: 'orders',
    data: orderData,
    depth: 3,
  })
  
  console.log('[Create Order] Order created:', {
    orderId: order.id,
    hasShippingMethod: !!(order as any).shippingMethod,
    shippingMethodValue: (order as any).shippingMethod,
    shippingMethodType: typeof (order as any).shippingMethod,
    customerEmail: (order as any).customerEmail,
  })

  await payload.update({
    collection: 'carts',
    id: cart.id,
    data: {
      status: 'completed',
    },
  })

  return order
}

