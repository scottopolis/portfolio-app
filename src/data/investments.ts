import { createServerFn } from '@tanstack/react-start'
import { getClient } from '@/db'
import type {
  Investment,
  Distribution,
  Category,
  Tag,
  InvestmentType,
  InvestmentWithDetails,
  CreateInvestmentData,
  CreateDistributionData,
  CreateCategoryData,
  CreateTagData,
  CreateInvestmentTypeData,
  UpdateInvestmentData,
} from '@/lib/types/investments'

// Track if schema has been initialized to prevent multiple initializations
let schemaInitialized = false

// Initialize database schema
const initializeSchema = createServerFn({
  method: 'POST',
}).handler(async () => {
  if (schemaInitialized) {
    return { success: true }
  }

  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }

  try {
    // Check if tables exist first
    const tablesExist = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users'
    `)

    if (tablesExist.length > 0) {
      schemaInitialized = true
      return { success: true }
    }

    // Create tables with IF NOT EXISTS
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, name)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS tags (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, name)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS investment_types (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, name)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS investments (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          date_started DATE,
          amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
          investment_type VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS distributions (
          id SERIAL PRIMARY KEY,
          investment_id INTEGER NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          amount DECIMAL(12, 2) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS investment_categories (
          investment_id INTEGER NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
          category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
          PRIMARY KEY (investment_id, category_id)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS investment_tags (
          investment_id INTEGER NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
          tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
          PRIMARY KEY (investment_id, tag_id)
      )
    `)

    // Create mock users if they don't exist
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
    ]

    for (const user of mockUsers) {
      await client.query(
        `
        INSERT INTO users (id, name, email, password_hash)
        VALUES ($1, $2, $3, 'mock_password_hash')
        ON CONFLICT (email) DO NOTHING
      `,
        [user.id, user.name, user.email],
      )
    }

    // Update the sequence to start from ID 10 to avoid conflicts with mock users
    await client.query(`
      SELECT setval('users_id_seq', 10, false)
    `)

    schemaInitialized = true
    return { success: true }
  } catch (error) {
    console.error('Schema initialization error:', error)
    throw error
  }
})

// Get all investments for a user
export const getInvestments = createServerFn({
  method: 'GET',
})
  .inputValidator((userId: number) => userId)
  .handler(async ({ data: userId }) => {
    const client = await getClient()
    if (!client) {
      throw new Error('Database connection failed')
    }

    await initializeSchema()

    const result = await client.query(
      `
      SELECT
        i.*,
        COALESCE(SUM(d.amount), 0) as total_distributions,
        COALESCE(SUM(d.amount), 0) - i.amount as current_return
      FROM investments i
      LEFT JOIN distributions d ON i.id = d.investment_id
      WHERE i.user_id = $1
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `,
      [userId],
    )

    return (result || []) as InvestmentWithDetails[]
  })

// Get single investment with full details
export const getInvestmentWithDetails = createServerFn({
  method: 'GET',
})
  .inputValidator((data: { userId: number; investmentId: number }) => data)
  .handler(async ({ data: { userId, investmentId } }) => {
    const client = await getClient()
    if (!client) {
      throw new Error('Database connection failed')
    }

    // Get investment
    const investment = await client.query(
      `
      SELECT
        i.*,
        COALESCE(SUM(d.amount), 0) as total_distributions,
        COALESCE(SUM(d.amount), 0) - i.amount as current_return
      FROM investments i
      LEFT JOIN distributions d ON i.id = d.investment_id
      WHERE i.user_id = $1 AND i.id = $2
      GROUP BY i.id
    `,
      [userId, investmentId],
    )

    if (investment.length === 0) {
      throw new Error('Investment not found')
    }

    // Get categories
    const categories = await client.query(
      `
      SELECT c.* FROM categories c
      JOIN investment_categories ic ON c.id = ic.category_id
      WHERE ic.investment_id = $1
    `,
      [investmentId],
    )

    // Get tags
    const tags = await client.query(
      `
      SELECT t.* FROM tags t
      JOIN investment_tags it ON t.id = it.tag_id
      WHERE it.investment_id = $1
    `,
      [investmentId],
    )

    // Get distributions
    const distributions = await client.query(
      `
      SELECT * FROM distributions
      WHERE investment_id = $1
      ORDER BY date DESC
    `,
      [investmentId],
    )

    return {
      ...investment[0],
      categories: categories as Category[],
      tags: tags as Tag[],
      distributions: distributions as Distribution[],
    } as InvestmentWithDetails
  })

// Create investment
export const createInvestment = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number } & CreateInvestmentData) => data)
  .handler(async ({ data }) => {
    const client = await getClient()
    if (!client) {
      throw new Error('Database connection failed')
    }

    await initializeSchema()

    // Insert investment
    const result = await client.query(
      `
      INSERT INTO investments (user_id, name, description, date_started, amount, investment_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      [
        data.userId,
        data.name,
        data.description,
        data.date_started,
        data.amount,
        data.investment_type,
      ],
    )

    const investment = result[0] as Investment

    // Add categories if provided
    if (data.category_ids && data.category_ids.length > 0) {
      for (const categoryId of data.category_ids) {
        await client.query(
          `
          INSERT INTO investment_categories (investment_id, category_id)
          VALUES ($1, $2)
        `,
          [investment.id, categoryId],
        )
      }
    }

    // Add tags if provided
    if (data.tag_ids && data.tag_ids.length > 0) {
      for (const tagId of data.tag_ids) {
        await client.query(
          `
          INSERT INTO investment_tags (investment_id, tag_id)
          VALUES ($1, $2)
        `,
          [investment.id, tagId],
        )
      }
    }

    return investment
  })

// Create distribution
export const createDistribution = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number } & CreateDistributionData) => data)
  .handler(async ({ data }) => {
    const client = await getClient()
    if (!client) {
      throw new Error('Database connection failed')
    }

    // Verify investment belongs to user
    const investmentCheck = await client.query(
      `
      SELECT id FROM investments WHERE id = $1 AND user_id = $2
    `,
      [data.investment_id, data.userId],
    )

    if (investmentCheck.length === 0) {
      throw new Error('Investment not found or access denied')
    }

    const result = await client.query(
      `
      INSERT INTO distributions (investment_id, date, amount, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
      [data.investment_id, data.date, data.amount, data.description],
    )

    return result[0] as Distribution
  })

// Get categories for user
export const getCategories = createServerFn({
  method: 'GET',
})
  .inputValidator((userId: number) => userId)
  .handler(async ({ data: userId }) => {
    const client = await getClient()
    if (!client) {
      throw new Error('Database connection failed')
    }

    await initializeSchema()

    const result = await client.query(
      `
      SELECT * FROM categories WHERE user_id = $1 ORDER BY name
    `,
      [userId],
    )

    return result as Category[]
  })

// Create category
export const createCategory = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number } & CreateCategoryData) => data)
  .handler(async ({ data }) => {
    const client = await getClient()
    if (!client) {
      throw new Error('Database connection failed')
    }

    const result = await client.query(
      `
      INSERT INTO categories (user_id, name)
      VALUES ($1, $2)
      RETURNING *
    `,
      [data.userId, data.name],
    )

    return result[0] as Category
  })

// Get tags for user
export const getTags = createServerFn({
  method: 'GET',
})
  .inputValidator((userId: number) => userId)
  .handler(async ({ data: userId }) => {
    const client = await getClient()
    if (!client) {
      throw new Error('Database connection failed')
    }

    await initializeSchema()

    const result = await client.query(
      `
      SELECT * FROM tags WHERE user_id = $1 ORDER BY name
    `,
      [userId],
    )

    return result as Tag[]
  })

// Create tag
export const createTag = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number } & CreateTagData) => data)
  .handler(async ({ data }) => {
    const client = await getClient()
    if (!client) {
      throw new Error('Database connection failed')
    }

    const result = await client.query(
      `
      INSERT INTO tags (user_id, name)
      VALUES ($1, $2)
      RETURNING *
    `,
      [data.userId, data.name],
    )

    return result[0] as Tag
  })

// Get investment types for user
export const getInvestmentTypes = createServerFn({
  method: 'GET',
})
  .inputValidator((userId: number) => userId)
  .handler(async ({ data: userId }) => {
    const client = await getClient()
    if (!client) {
      throw new Error('Database connection failed')
    }

    await initializeSchema()

    const result = await client.query(
      `
      SELECT * FROM investment_types WHERE user_id = $1 ORDER BY name
    `,
      [userId],
    )

    return result as InvestmentType[]
  })

// Create investment type
export const createInvestmentType = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: number } & CreateInvestmentTypeData) => data)
  .handler(async ({ data }) => {
    const client = await getClient()
    if (!client) {
      throw new Error('Database connection failed')
    }

    const result = await client.query(
      `
      INSERT INTO investment_types (user_id, name)
      VALUES ($1, $2)
      RETURNING *
    `,
      [data.userId, data.name],
    )

    return result[0] as InvestmentType
  })

// Create user
export const createUser = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { name: string; email: string }) => data)
  .handler(async ({ data }) => {
    const client = await getClient()
    if (!client) {
      throw new Error('Database connection failed')
    }

    await initializeSchema()

    const result = await client.query(
      `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, 'mock_password_hash')
      RETURNING id, name, email, created_at
    `,
      [data.name, data.email],
    )

    return result[0] as {
      id: number
      name: string
      email: string
      created_at: string
    }
  })

// Get all users (for development)
export const getUsers = createServerFn({
  method: 'GET',
}).handler(async () => {
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }

  await initializeSchema()

  const result = await client.query(
    `
      SELECT id, name, email, created_at FROM users ORDER BY created_at DESC
    `,
  )

  return result as {
    id: number
    name: string
    email: string
    created_at: string
  }[]
})

// Update investment
export const updateInvestment = createServerFn({
  method: 'POST',
})
  .inputValidator(
    (data: { userId: number; investmentId: number } & UpdateInvestmentData) =>
      data,
  )
  .handler(async ({ data: { userId, investmentId, ...investmentData } }) => {
    const client = await getClient()
    if (!client) {
      throw new Error('Database connection failed')
    }

    // Start transaction
    await client.query('BEGIN')

    try {
      // Update investment
      const result = await client.query(
        `UPDATE investments
         SET name = $3, description = $4, date_started = $5, amount = $6,
             investment_type = $7, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND id = $2
         RETURNING *`,
        [
          userId,
          investmentId,
          investmentData.name,
          investmentData.description,
          investmentData.date_started,
          investmentData.amount,
          investmentData.investment_type,
        ],
      )

      if (result.length === 0) {
        throw new Error(
          'Investment not found or you do not have permission to update it',
        )
      }

      // Clear existing category associations
      await client.query(
        'DELETE FROM investment_categories WHERE investment_id = $1',
        [investmentId],
      )

      // Clear existing tag associations
      await client.query(
        'DELETE FROM investment_tags WHERE investment_id = $1',
        [investmentId],
      )

      // Add new category associations
      if (investmentData.category_ids?.length) {
        for (const categoryId of investmentData.category_ids) {
          await client.query(
            'INSERT INTO investment_categories (investment_id, category_id) VALUES ($1, $2)',
            [investmentId, categoryId],
          )
        }
      }

      // Add new tag associations
      if (investmentData.tag_ids?.length) {
        for (const tagId of investmentData.tag_ids) {
          await client.query(
            'INSERT INTO investment_tags (investment_id, tag_id) VALUES ($1, $2)',
            [investmentId, tagId],
          )
        }
      }

      await client.query('COMMIT')

      return result[0] as Investment
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  })
