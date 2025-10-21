import { createServerFn } from '@tanstack/react-start'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { getClient } from '@/db'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const getTestData = createServerFn({
  method: 'GET',
}).handler(async () => {
  const client = await getClient()
  if (!client) {
    return undefined
  }

  // First check if test_data table exists, if not create it
  await client.query(`
    CREATE TABLE IF NOT EXISTS test_data (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      value TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  return (await client.query(
    `SELECT * FROM test_data ORDER BY created_at DESC`,
  )) as Array<{
    id: number
    name: string
    value: string
    created_at: string
  }>
})

const upsertTestData = createServerFn({
  method: 'POST',
})
  .inputValidator((d: { name: string; value: string }) => d)
  .handler(async ({ data }) => {
    const client = await getClient()
    if (!client) {
      return undefined
    }

    // Upsert: insert or update if name already exists
    await client.query(
      `
      INSERT INTO test_data (name, value) 
      VALUES ($1, $2)
      ON CONFLICT (name) 
      DO UPDATE SET 
        value = EXCLUDED.value,
        created_at = CURRENT_TIMESTAMP
    `,
      [data.name, data.value],
    )
  })

export const Route = createFileRoute('/demo/neon')({
  component: App,
  loader: async () => {
    const testData = await getTestData()
    return { testData }
  },
})

function App() {
  const { testData } = Route.useLoaderData()
  const router = useRouter()
  const [name, setName] = useState('')
  const [value, setValue] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) return

    await upsertTestData({ data: { name: name.trim(), value: value.trim() } })
    setName('')
    setValue('')
    router.invalidate()
  }

  if (!testData) {
    return <DBConnectionError />
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Neon Database Test Interface</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-4 mb-6">
              <Input
                placeholder="Name (key)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                placeholder="Value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              <Button type="submit">Upsert Data</Button>
            </form>

            {testData.length === 0 ? (
              <p className="text-muted-foreground">
                No data yet. Add some test data above.
              </p>
            ) : (
              <div className="space-y-2">
                <h3 className="font-semibold">Current Data:</h3>
                {testData.map((item) => (
                  <div key={item.id} className="border rounded p-3 space-y-1">
                    <div className="flex justify-between items-start">
                      <strong>{item.name}</strong>
                      <span className="text-xs text-muted-foreground">
                        #{item.id}
                      </span>
                    </div>
                    <div className="text-sm">{item.value || '<empty>'}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DBConnectionError() {
  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            Database Connection Issue
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-destructive">
            <svg
              className="w-12 h-12 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p>The Neon database is not connected.</p>
          <div className="text-left space-y-2">
            <p className="font-semibold">Required Steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>
                Set the <code>DATABASE_URL</code> environment variable
              </li>
              <li>Ensure your Neon database is accessible</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
