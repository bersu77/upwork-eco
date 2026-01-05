import { createYoga } from 'graphql-yoga'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { typeDefs } from '@/graphql-adapter/schema'
import { resolvers } from '@/graphql-adapter/resolvers'
import { createContext } from '@/graphql-adapter/context'
import type { GraphQLContext } from '@/graphql-adapter/context'

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

// Get frontend URL from environment or use defaults
const QWIK_FRONTEND_URL = process.env.QWIK_FRONTEND_URL || 'http://localhost:5173'
const FRONTEND_URL = process.env.FRONTEND_URL || QWIK_FRONTEND_URL

// Build CORS origins list - allow common development ports
const corsOrigins = [
  QWIK_FRONTEND_URL,
  FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:8080',
].filter((url, index, self) => self.indexOf(url) === index) // Remove duplicates

// Temporary storage for auth tokens per request
// Key: request URL + timestamp, Value: auth token
const authTokenStore = new Map<string, string>()

// Temporary storage for cart secrets per request
// Key: request URL + timestamp, Value: cart secret
const cartSecretStore = new Map<string, string>()

const yoga = createYoga<GraphQLContext>({
  schema,
  graphqlEndpoint: '/api/shop-api/graphql',
  fetchAPI: { Response },
  context: async ({ request }) => {
    const ctx = await createContext(request)
    // Generate a unique request ID for this request
    ;(ctx as any).__requestId = `${request.url}-${Date.now()}-${Math.random()}`
    return ctx
  },
  cors: {
    origin: corsOrigins,
    credentials: true,
    exposedHeaders: ['vendure-auth-token', 'cart-secret'],
  },
  plugins: [
    {
      onExecute: ({ setResultAndStopExecution, args }:{setResultAndStopExecution:any,args:any}) => {
        return {
          onExecuteDone: () => {
            // Access the context from the execution args
            const context = args.contextValue as GraphQLContext & { __requestId?: string }
            
            // If there's an auth token in the context, store it for later retrieval
            if (context?.authToken && context.__requestId) {
              authTokenStore.set(context.__requestId, context.authToken)
              console.log('[AUTH DEBUG Backend] Auth token stored for request:', context.authToken.substring(0, 20) + '...')
              
              // Clean up after 5 seconds to prevent memory leaks
              setTimeout(() => {
                authTokenStore.delete(context.__requestId!)
              }, 5000)
            }
            
            // If there's a new cart secret in the context, store it for later retrieval
            if (context?.newCartSecret && context.__requestId) {
              cartSecretStore.set(context.__requestId, context.newCartSecret)
              console.log('[CART DEBUG Backend] New cart secret stored for request')
              
              // Clean up after 5 seconds to prevent memory leaks
              setTimeout(() => {
                cartSecretStore.delete(context.__requestId!)
              }, 5000)
            }
          },
        }
      },
    },
  ],
})

// Wrap the handlers to add the auth token header
const addAuthHeaderToResponse = (
  handler: (request: Request, ctx?: any) => Response | Promise<Response>
) => {
  return async (request: Request, ctx?: any) => {
    const response = await Promise.resolve(handler(request, ctx))
    
    // Find the auth token for this request by matching the request URL
    // Since we can't directly access the requestId, we'll try to find it
    // by matching the most recent entry for this URL
    let authToken: string | undefined
    let cartSecret: string | undefined
    const requestKey = Array.from(authTokenStore.keys())
      .filter(key => key.startsWith(request.url))
      .pop() // Get the most recent one
    
    if (requestKey) {
      authToken = authTokenStore.get(requestKey)
      // Clean up immediately after retrieval
      authTokenStore.delete(requestKey)
    }
    
    // Find the cart secret for this request
    const cartSecretKey = Array.from(cartSecretStore.keys())
      .filter(key => key.startsWith(request.url))
      .pop()
    
    if (cartSecretKey) {
      cartSecret = cartSecretStore.get(cartSecretKey)
      // Clean up immediately after retrieval
      cartSecretStore.delete(cartSecretKey)
    }
    
    // If we found an auth token or cart secret, add them to the response headers
    if (authToken || cartSecret) {
      const newHeaders = new Headers(response.headers)
      
      if (authToken) {
        console.log('[AUTH DEBUG Backend] Adding vendure-auth-token header to response')
        newHeaders.set('vendure-auth-token', authToken)
      }
      
      if (cartSecret) {
        console.log('[CART DEBUG Backend] Adding cart-secret header to response')
        newHeaders.set('cart-secret', cartSecret)
      }
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      })
    }
    
    return response
  }
}

export const GET = addAuthHeaderToResponse(yoga.handleRequest)
export const POST = addAuthHeaderToResponse(yoga.handleRequest)
export const OPTIONS = yoga.handleRequest
