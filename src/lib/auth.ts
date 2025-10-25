import { createServerFn } from '@tanstack/react-start'
import { getClient, setSessionUser } from '@/db'

/**
 * Get current user ID from session (Clerk) or dev mode override
 * In development: reads from VITE_DEV_USER_ID env var or defaults to 1
 * In production: gets from Clerk session
 */
export async function getCurrentUserId(): Promise<number> {
  if (process.env.NODE_ENV === 'development') {
    const devUserId = import.meta.env.VITE_DEV_USER_ID
    if (devUserId) {
      return parseInt(devUserId, 10)
    }
    return 1
  }

  throw new Error('Clerk authentication not yet implemented')
}

/**
 * Wrapper for server functions that require authentication
 */
export function createAuthServerFn<TInput = void, TOutput = any>(config: {
  method: 'GET' | 'POST'
  handler: (ctx: {
    client: any
    userId: number
    data: TInput
  }) => Promise<TOutput>
}) {
  return createServerFn({ method: config.method })
    .inputValidator((data: TInput) => {
      console.log('🔧 Auth wrapper inputValidator called with:', data)
      return data
    })
    .handler(async ({ data }) => {
      console.log('🔧 Auth wrapper handler called with data:', data)
      
      let userId: number
      try {
        userId = await getCurrentUserId()
        console.log('🔧 Auth wrapper got userId:', userId)
      } catch (error) {
        console.error('🚨 Auth wrapper - getCurrentUserId failed:', error)
        throw error
      }

      let client: any
      try {
        client = await getClient()
        console.log('🔧 Auth wrapper got client:', !!client)
      } catch (error) {
        console.error('🚨 Auth wrapper - getClient failed:', error)
        throw error
      }

      if (!client) {
        console.error('🚨 Auth wrapper - client is null/undefined')
        throw new Error('Database connection failed')
      }

      try {
        await setSessionUser(userId)
        console.log('🔧 Auth wrapper setSessionUser success for userId:', userId)
      } catch (error) {
        console.error('🚨 Auth wrapper - setSessionUser failed:', error)
        throw error
      }

      console.log('🔧 Auth wrapper calling handler with userId:', userId, 'data:', data)

      try {
        const result = await config.handler({ client, userId, data: data as TInput })
        console.log('🔧 Auth wrapper handler returned result type:', typeof result)
        console.log('🔧 Auth wrapper handler returned result:', result)
        console.log('🔧 Auth wrapper handler result stringified:', JSON.stringify(result))
        return result
      } catch (error) {
        console.error('🚨 Auth wrapper - handler failed:', error)
        throw error
      }
    })
}
