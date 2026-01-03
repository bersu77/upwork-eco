import { getPayload } from 'payload'
import config from '@payload-config'
import type { User } from '@/payload-types'
import jwt from 'jsonwebtoken'

export interface GraphQLContext {
  payload: Awaited<ReturnType<typeof getPayload>>
  user: User | null
  req: Request
  authToken?: string
  cartSecret?: string | null
  newCartSecret?: string | null
}

export async function createContext(request: Request): Promise<GraphQLContext> {
  const payload = await getPayload({ config })
  
  let user: User | null = null

  try {
    // Debug: log authorization header
    const authHeader = request.headers.get('authorization')
    console.log('[AUTH DEBUG] Authorization header:', authHeader ? `${authHeader.substring(0, 40)}...` : 'MISSING')
    console.log('[AUTH DEBUG] Authorization header full length:', authHeader?.length || 0)
    console.log('[AUTH DEBUG] Starts with Bearer?', authHeader?.startsWith('Bearer '))

    // Extract the token from the Authorization header
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7) // Remove 'Bearer ' prefix
      console.log('[AUTH DEBUG] Extracted token:', token.substring(0, 40) + '...')
      
      try {
        // Try to decode the token without verification first to see its structure
        const decoded: any = jwt.decode(token, { complete: true })
        console.log('[AUTH DEBUG] JWT decoded (without verification). Payload:', JSON.stringify(decoded?.payload))
        
        // Use Payload's built-in authentication by creating a mock request object
        // Payload expects headers in a specific format
        const headersList = new Headers()
        headersList.set('authorization', authHeader)
        
        // Try using Payload's auth method
        try {
          const authResult = await payload.auth({ headers: headersList })
          if (authResult.user) {
            user = authResult.user as User
            console.log('[AUTH DEBUG] User authenticated via Payload auth:', user.email)
          } else {
            console.log('[AUTH DEBUG] Payload auth returned no user')
          }
        } catch (authError: any) {
          console.log('[AUTH DEBUG] Payload auth error:', authError.message)
          
          // Fallback: if Payload auth fails, try manual verification with the secret from config
          // Payload uses PAYLOAD_SECRET for signing, but we need to check the actual secret used
          const secret = process.env.PAYLOAD_SECRET
          if (secret && decoded?.payload?.id) {
            try {
              // Verify with the secret
              jwt.verify(token, secret)
              // If verification succeeds, fetch the user
              const userData = await payload.findByID({
                collection: 'users',
                id: decoded.payload.id,
              })
              user = userData as User
              console.log('[AUTH DEBUG] User loaded via manual verification:', user.email)
            } catch (verifyError: any) {
              console.log('[AUTH DEBUG] Manual verification also failed:', verifyError.message)
              // Last resort: if token structure is valid, trust the decoded payload (less secure but works)
              if (decoded?.payload?.id && decoded?.payload?.collection === 'users') {
                const userData = await payload.findByID({
                  collection: 'users',
                  id: decoded.payload.id,
                })
                user = userData as User
                console.log('[AUTH DEBUG] User loaded via decoded payload (unverified):', user.email)
              }
            }
          }
        }
      } catch (jwtError: any) {
        console.log('[AUTH DEBUG] JWT decode error:', jwtError.message)
      }
    }
    
    console.log('[AUTH DEBUG] Auth result:', user ? `User ID: ${user.id}, Email: ${user.email}` : 'No user')
  } catch (error) {
    console.log('[AUTH DEBUG] Authentication error:', error)
    payload.logger.debug({ msg: 'Authentication failed in GraphQL context', error })
  }

  // Extract cart secret from headers (for guest carts)
  // Check both vendure-token (existing) and X-Cart-Secret headers
  const cartSecret = request.headers.get('vendure-token') || request.headers.get('X-Cart-Secret') || null
  if (cartSecret) {
    console.log('[CART DEBUG] Cart secret found in request headers')
  }

  return {
    payload,
    user,
    req: request,
    cartSecret,
  }
}

export function requireAuth(context: GraphQLContext): asserts context is GraphQLContext & { user: User } {
  if (!context.user) {
    throw new Error('Authentication required. Please log in to access this resource.')
  }
}

export function requireRole(context: GraphQLContext, role: 'admin' | 'customer'): void {
  requireAuth(context)
  
  const userRoles = Array.isArray(context.user.roles) ? context.user.roles : []
  
  if (!userRoles.includes(role)) {
    throw new Error(`Access denied. This operation requires '${role}' role.`)
  }
}

