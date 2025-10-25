import { neon } from '@neondatabase/serverless'

let client: ReturnType<typeof neon>

export function getClient() {
  // In server functions, check both process.env and import.meta.env
  const dbUrl =
    process.env.VITE_DATABASE_URL || import.meta.env.VITE_DATABASE_URL

  if (!dbUrl) {
    console.error(
      '🚨 No database URL found in process.env.VITE_DATABASE_URL or import.meta.env.VITE_DATABASE_URL',
    )
    return undefined
  }
  if (!client) {
    client = neon(dbUrl)
  }
  return client
}

/**
 * Set the session user for Row-Level Security (RLS)
 * MUST be called before any queries that access user data
 */
export async function setSessionUser(userId: number) {
  const dbClient = getClient()
  if (!dbClient) {
    throw new Error('Database connection failed')
  }

  // Set the app.user_id session variable for RLS policies
  await dbClient.query(`SELECT set_config('app.user_id', $1::text, true)`, [
    userId,
  ])
}
