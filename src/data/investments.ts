import { createServerFn } from '@tanstack/react-start'
import { getClient, setSessionUser } from '@/db'
import { getStockQuote } from '@/data/stocks'
import { getCurrentUserId } from '@/lib/auth'
import type {
  Investment,
  Portfolio,
  Distribution,
  Category,
  Tag,
  InvestmentType,
  InvestmentWithDetails,
  CreateInvestmentData,
  CreatePortfolioData,
  CreateDistributionData,
  CreateCategoryData,
  CreateTagData,
  CreateInvestmentTypeData,
  UpdateInvestmentData,
  UpdatePortfolioData,
  UpdateUserData,
} from '@/lib/types/investments'

// Track if schema has been initialized to prevent multiple initializations
// Set to false to force re-initialization and run migrations
let schemaInitialized = false // Set to false to run stock columns migration

// Initialize database schema with migration support
const initializeSchema = createServerFn({
  method: 'POST',
}).handler(async () => {
  // Only allow schema initialization in development
  if (process.env.NODE_ENV === 'production') {
    console.warn('Schema initialization skipped in production')
    return { success: true }
  }

  if (schemaInitialized) {
    return { success: true }
  }

  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }

  try {
    await createFreshSchema(client)

    schemaInitialized = true
    return { success: true }
  } catch (error) {
    console.error('Schema initialization error:', error)
    throw error
  }
})

// Create fresh schema for new installations
async function createFreshSchema(client: any) {
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
    CREATE TABLE IF NOT EXISTS portfolios (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, name)
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
        portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        date_started DATE,
        amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
        investment_type VARCHAR(100) NOT NULL,
        has_distributions BOOLEAN NOT NULL DEFAULT true,
        stock_symbol VARCHAR(20),
        stock_quantity DECIMAL(18, 8),
        current_stock_price DECIMAL(18, 8),
        stock_price_updated_at TIMESTAMP,
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

  // Create indexes
  await client.query(
    `CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id)`,
  )
  await client.query(
    `CREATE INDEX IF NOT EXISTS idx_investments_portfolio_id ON investments(portfolio_id)`,
  )
  await client.query(
    `CREATE INDEX IF NOT EXISTS idx_distributions_investment_id ON distributions(investment_id)`,
  )
  await client.query(
    `CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id)`,
  )
  await client.query(
    `CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id)`,
  )
  await client.query(
    `CREATE INDEX IF NOT EXISTS idx_investment_types_user_id ON investment_types(user_id)`,
  )
  await client.query(
    `CREATE INDEX IF NOT EXISTS idx_distributions_date ON distributions(date)`,
  )
  await client.query(
    `CREATE INDEX IF NOT EXISTS idx_investments_stock_symbol ON investments(stock_symbol)`,
  )

  // Create triggers
  await client.query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql'
  `)

  await client.query(
    `CREATE OR REPLACE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()`,
  )
  await client.query(
    `CREATE OR REPLACE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()`,
  )
  await client.query(
    `CREATE OR REPLACE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()`,
  )
}

// Get all investments for a user
export const getInvestments = createServerFn({
  method: 'GET',
}).handler(async () => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

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

  return result as InvestmentWithDetails[]
})

// Get single investment with full details by portfolio
export const getInvestmentByPortfolio = createServerFn({
  method: 'GET',
}).handler(async ({ data: { portfolioId, investmentId } }) => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  const investment = await client.query(
    `
      SELECT
        i.*,
        COALESCE(SUM(d.amount), 0) as total_distributions,
        COALESCE(SUM(d.amount), 0) - i.amount as current_return
      FROM investments i
      LEFT JOIN distributions d ON i.id = d.investment_id
      WHERE i.id = $1 AND i.portfolio_id = $2
      GROUP BY i.id
    `,
    [investmentId, portfolioId],
  )

  if (investment.length === 0) {
    throw new Error('Investment not found')
  }

  const categories = await client.query(
    `
      SELECT c.* FROM categories c
      JOIN investment_categories ic ON c.id = ic.category_id
      WHERE ic.investment_id = $1
    `,
    [investmentId],
  )

  const tags = await client.query(
    `
      SELECT t.* FROM tags t
      JOIN investment_tags it ON t.id = it.tag_id
      WHERE it.investment_id = $1
    `,
    [investmentId],
  )

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

// Get single investment with full details (legacy - by user_id)
export const getInvestmentWithDetails = createServerFn({
  method: 'GET',
}).handler(async ({ data: { investmentId } }) => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  const investment = await client.query(
    `
      SELECT
        i.*,
        COALESCE(SUM(d.amount), 0) as total_distributions,
        COALESCE(SUM(d.amount), 0) - i.amount as current_return
      FROM investments i
      JOIN portfolios p ON i.portfolio_id = p.id
      LEFT JOIN distributions d ON i.id = d.investment_id
      WHERE i.id = $1 AND p.user_id = $2
      GROUP BY i.id
    `,
    [investmentId, userId],
  )

  if (investment.length === 0) {
    throw new Error('Investment not found')
  }

  const categories = await client.query(
    `
      SELECT c.* FROM categories c
      JOIN investment_categories ic ON c.id = ic.category_id
      WHERE ic.investment_id = $1
    `,
    [investmentId],
  )

  const tags = await client.query(
    `
      SELECT t.* FROM tags t
      JOIN investment_tags it ON t.id = it.tag_id
      WHERE it.investment_id = $1
    `,
    [investmentId],
  )

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
}).handler(async ({ data: investmentData }) => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  await initializeSchema()

  try {
    await client.query('BEGIN')

    const result = await client.query(
      `
        INSERT INTO investments (
          portfolio_id,
          name,
          description,
          date_started,
          amount,
          investment_type,
          has_distributions,
          stock_symbol,
          stock_quantity,
          current_stock_price,
          stock_price_updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `,
      [
        investmentData.portfolio_id,
        investmentData.name,
        investmentData.description || null,
        investmentData.date_started || null,
        investmentData.amount,
        investmentData.investment_type,
        investmentData.has_distributions,
        investmentData.stock_symbol || null,
        investmentData.stock_quantity || null,
        investmentData.current_stock_price || null,
        investmentData.current_stock_price ? new Date() : null,
      ],
    )

    if (result.length === 0) {
      throw new Error('Failed to create investment')
    }

    const investmentId = result[0].id

    if (investmentData.category_ids?.length) {
      for (const categoryId of investmentData.category_ids) {
        await client.query(
          'INSERT INTO investment_categories (investment_id, category_id) VALUES ($1, $2)',
          [investmentId, categoryId],
        )
      }
    }

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

// Update investment by ID (legacy - uses user_id)
export const updateInvestment = createServerFn({
  method: 'POST',
}).handler(async ({ data: { investmentId, investmentData } }) => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  try {
    await client.query('BEGIN')

    const updateFields = []
    const values = []
    let paramCount = 3

    if (investmentData.name !== undefined) {
      updateFields.push(`name = $${paramCount}`)
      values.push(investmentData.name)
      paramCount++
    }

    if (investmentData.description !== undefined) {
      updateFields.push(`description = $${paramCount}`)
      values.push(investmentData.description || null)
      paramCount++
    }

    if (investmentData.date_started !== undefined) {
      updateFields.push(`date_started = $${paramCount}`)
      values.push(investmentData.date_started || null)
      paramCount++
    }

    if (investmentData.stock_symbol !== undefined) {
      updateFields.push(`stock_symbol = $${paramCount}`)
      values.push(investmentData.stock_symbol || null)
      paramCount++
    }

    if (investmentData.stock_quantity !== undefined) {
      updateFields.push(`stock_quantity = $${paramCount}`)
      values.push(investmentData.stock_quantity || null)
      paramCount++
    }

    updateFields.push(`amount = $${paramCount}`)
    values.push(investmentData.amount)
    paramCount++

    updateFields.push(`investment_type = $${paramCount}`)
    values.push(investmentData.investment_type)
    paramCount++

    updateFields.push(`has_distributions = $${paramCount}`)
    values.push(investmentData.has_distributions)
    paramCount++

    if (investmentData.portfolio_id !== undefined) {
      updateFields.push(`portfolio_id = $${paramCount}`)
      values.push(investmentData.portfolio_id)
      paramCount++
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP')

    const result = await client.query(
      `UPDATE investments i
         SET ${updateFields.join(', ')}
         FROM portfolios p
         WHERE i.id = $2 AND i.portfolio_id = p.id AND p.user_id = $1
         RETURNING i.*`,
      [userId, investmentId, ...values],
    )

    if (result.length === 0) {
      throw new Error(
        'Investment not found or you do not have permission to update it',
      )
    }

    await client.query(
      'DELETE FROM investment_categories WHERE investment_id = $1',
      [investmentId],
    )

    await client.query('DELETE FROM investment_tags WHERE investment_id = $1', [
      investmentId,
    ])

    if (investmentData.category_ids?.length) {
      for (const categoryId of investmentData.category_ids) {
        await client.query(
          'INSERT INTO investment_categories (investment_id, category_id) VALUES ($1, $2)',
          [investmentId, categoryId],
        )
      }
    }

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

// Update investment by portfolio_id
export const updateInvestmentByPortfolio = createServerFn({
  method: 'POST',
}).handler(async ({ data: { portfolioId, investmentId, investmentData } }) => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  try {
    await client.query('BEGIN')

    const updateFields = []
    const values = []
    let paramCount = 3

    if (investmentData.name !== undefined) {
      updateFields.push(`name = $${paramCount}`)
      values.push(investmentData.name)
      paramCount++
    }

    if (investmentData.description !== undefined) {
      updateFields.push(`description = $${paramCount}`)
      values.push(investmentData.description || null)
      paramCount++
    }

    if (investmentData.date_started !== undefined) {
      updateFields.push(`date_started = $${paramCount}`)
      values.push(investmentData.date_started || null)
      paramCount++
    }

    if (investmentData.stock_symbol !== undefined) {
      updateFields.push(`stock_symbol = $${paramCount}`)
      values.push(investmentData.stock_symbol || null)
      paramCount++
    }

    if (investmentData.stock_quantity !== undefined) {
      updateFields.push(`stock_quantity = $${paramCount}`)
      values.push(investmentData.stock_quantity || null)
      paramCount++
    }

    if (investmentData.amount !== undefined) {
      updateFields.push(`amount = $${paramCount}`)
      values.push(investmentData.amount)
      paramCount++
    }

    if (investmentData.investment_type !== undefined) {
      updateFields.push(`investment_type = $${paramCount}`)
      values.push(investmentData.investment_type)
      paramCount++
    }

    if (investmentData.has_distributions !== undefined) {
      updateFields.push(`has_distributions = $${paramCount}`)
      values.push(investmentData.has_distributions)
      paramCount++
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update')
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP')

    const result = await client.query(
      `UPDATE investments
         SET ${updateFields.join(', ')}
         WHERE id = $1 AND portfolio_id = $2
         RETURNING *`,
      [investmentId, portfolioId, ...values],
    )

    if (result.length === 0) {
      throw new Error('Investment not found')
    }

    await client.query(
      'DELETE FROM investment_categories WHERE investment_id = $1',
      [investmentId],
    )

    await client.query('DELETE FROM investment_tags WHERE investment_id = $1', [
      investmentId,
    ])

    if (investmentData.category_ids?.length) {
      for (const categoryId of investmentData.category_ids) {
        await client.query(
          'INSERT INTO investment_categories (investment_id, category_id) VALUES ($1, $2)',
          [investmentId, categoryId],
        )
      }
    }

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

// Delete investment
export const deleteInvestment = createServerFn({
  method: 'POST',
}).handler(async ({ data: { investmentId } }) => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  try {
    await client.query('BEGIN')

    // Delete related records first (due to foreign key constraints)
    await client.query(
      'DELETE FROM investment_categories WHERE investment_id = $1',
      [investmentId],
    )

    await client.query('DELETE FROM investment_tags WHERE investment_id = $1', [
      investmentId,
    ])

    await client.query('DELETE FROM distributions WHERE investment_id = $1', [
      investmentId,
    ])

    await client.query(
      'DELETE FROM investment_value_history WHERE investment_id = $1',
      [investmentId],
    )

    // Delete the investment itself
    const result = await client.query(
      `DELETE FROM investments i
       USING portfolios p
       WHERE i.id = $2 AND i.portfolio_id = p.id AND p.user_id = $1
       RETURNING i.id`,
      [userId, investmentId],
    )

    if (result.length === 0) {
      throw new Error(
        'Investment not found or you do not have permission to delete it',
      )
    }

    await client.query('COMMIT')

    return { success: true, id: result[0].id }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
})

// Create distribution
export const createDistribution = createServerFn({
  method: 'POST',
}).handler(async ({ data: distributionData }) => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  const result = await client.query(
    `
      INSERT INTO distributions (investment_id, date, amount, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [
      distributionData.investment_id,
      distributionData.date,
      distributionData.amount,
      distributionData.description || null,
    ],
  )

  if (result.length === 0) {
    throw new Error('Failed to create distribution')
  }

  return result[0] as Distribution
})

// Get all categories for a user
export const getCategories = createServerFn({
  method: 'GET',
}).handler(async () => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  const result = await client.query(
    'SELECT * FROM categories WHERE user_id = $1 ORDER BY name',
    [userId],
  )

  return result as Category[]
})

// Create category
export const createCategory = createServerFn({
  method: 'POST',
}).handler(async ({ data: categoryData }) => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  const result = await client.query(
    'INSERT INTO categories (user_id, name) VALUES ($1, $2) RETURNING *',
    [userId, categoryData.name],
  )

  if (result.length === 0) {
    throw new Error('Failed to create category')
  }

  return result[0] as Category
})

// Get all tags for a user
export const getTags = createServerFn({
  method: 'GET',
}).handler(async () => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  const result = await client.query(
    'SELECT * FROM tags WHERE user_id = $1 ORDER BY name',
    [userId],
  )

  return result as Tag[]
})

// Create tag
export const createTag = createServerFn({
  method: 'POST',
}).handler(async ({ data: tagData }) => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  const result = await client.query(
    'INSERT INTO tags (user_id, name) VALUES ($1, $2) RETURNING *',
    [userId, tagData.name],
  )

  if (result.length === 0) {
    throw new Error('Failed to create tag')
  }

  return result[0] as Tag
})

// Get all investment types for a user
export const getInvestmentTypes = createServerFn({
  method: 'GET',
}).handler(async () => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  const result = await client.query(
    'SELECT * FROM investment_types WHERE user_id = $1 ORDER BY name',
    [userId],
  )

  return result as InvestmentType[]
})

// Create investment type
export const createInvestmentType = createServerFn({
  method: 'POST',
}).handler(async ({ data: investmentTypeData }) => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  const result = await client.query(
    'INSERT INTO investment_types (user_id, name) VALUES ($1, $2) RETURNING *',
    [userId, investmentTypeData.name],
  )

  if (result.length === 0) {
    throw new Error('Failed to create investment type')
  }

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

    const result = await client.query(
      `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, 'temp_password_hash')
      RETURNING *
    `,
      [data.name, data.email],
    )

    if (result.length === 0) {
      throw new Error('Failed to create user')
    }

    const userId = result[0].id

    await client.query(
      `
      INSERT INTO portfolios (user_id, name, description)
      VALUES ($1, 'My Portfolio', 'Default portfolio')
    `,
      [userId],
    )

    return result[0] as {
      id: number
      name: string
      email: string
      created_at: string
      updated_at: string
    }
  })

// Get all users (dev/admin function)
export const getUsers = createServerFn({
  method: 'GET',
}).handler(async () => {
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }

  await initializeSchema()

  const result = await client.query(
    'SELECT id, name, email, created_at FROM users ORDER BY id',
  )

  return result as { id: number; name: string; email: string }[]
})

// Update user
export const updateUser = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userData: UpdateUserData }) => data)
  .handler(async ({ data }) => {
    const userId = await getCurrentUserId()
    const client = await getClient()
    if (!client) {
      throw new Error('Database connection failed')
    }
    await setSessionUser(userId)

    const result = await client.query(
      `UPDATE users
       SET name = $2, email = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, name, email, created_at, updated_at`,
      [userId, data.userData.name, data.userData.email],
    )

    if (result.length === 0) {
      throw new Error('User not found')
    }

    return result[0] as {
      id: number
      name: string
      email: string
      created_at: string
      updated_at: string
    }
  })

// Portfolio functions

// Get all portfolios for a user
export const getPortfolios = createServerFn({
  method: 'GET',
}).handler(async () => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  try {
    await initializeSchema()
  } catch (error) {
    console.error('🚨 getPortfolios - initializeSchema failed:', error)
    throw error
  }

  let result: any
  try {
    result = await client.query(
      `
      SELECT p.*,
        COUNT(i.id) as investment_count,
        COALESCE(SUM(
          CASE
            WHEN i.investment_type = 'stock' AND i.current_stock_price IS NOT NULL AND i.stock_quantity IS NOT NULL
            THEN i.stock_quantity * i.current_stock_price
            ELSE i.amount
          END
        ), 0) as total_invested,
        COALESCE(SUM(COALESCE(d.total_distributions, 0)), 0) as total_distributions
      FROM portfolios p
      LEFT JOIN investments i ON p.id = i.portfolio_id
      LEFT JOIN (
        SELECT investment_id, SUM(amount) as total_distributions
        FROM distributions
        GROUP BY investment_id
      ) d ON i.id = d.investment_id
      WHERE p.user_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `,
      [userId],
    )
  } catch (error) {
    console.error('🚨 getPortfolios - query failed:', error)
    throw error
  }

  const portfolios = result.map((p: any) => {
    const mapped = {
      id: Number(p.id),
      user_id: Number(p.user_id),
      name: p.name,
      description: p.description,
      created_at: p.created_at,
      updated_at: p.updated_at,
      investment_count: Number(p.investment_count),
      total_invested: Number(p.total_invested),
      total_distributions: Number(p.total_distributions),
    }
    return mapped
  }) as (Portfolio & {
    investment_count: number
    total_invested: number
    total_distributions: number
  })[]

  return portfolios
})

// Get single portfolio with investments
export const getPortfolioWithInvestments = createServerFn({
  method: 'GET',
}).handler(async ({ data: { portfolioId } }) => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  await initializeSchema()

  const portfolio = await client.query(
    `
      SELECT * FROM portfolios
      WHERE user_id = $1 AND id = $2
    `,
    [userId, portfolioId],
  )

  if (portfolio.length === 0) {
    throw new Error('Portfolio not found')
  }

  const investments = await client.query(
    `
      SELECT
        i.*,
        COALESCE(SUM(d.amount), 0) as total_distributions,
        COALESCE(SUM(d.amount), 0) - (
          CASE
            WHEN i.investment_type = 'stock' AND i.current_stock_price IS NOT NULL AND i.stock_quantity IS NOT NULL
            THEN i.stock_quantity * i.current_stock_price
            ELSE i.amount
          END
        ) as current_return
      FROM investments i
      LEFT JOIN distributions d ON i.id = d.investment_id
      WHERE i.portfolio_id = $1
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `,
    [portfolioId],
  )

  return {
    ...portfolio[0],
    investments: investments,
  } as Portfolio & {
    investments: InvestmentWithDetails[]
  }
})

// Create portfolio
export const createPortfolio = createServerFn({
  method: 'POST',
}).handler(async ({ data: { portfolio } }) => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  await initializeSchema()

  const result = await client.query(
    `
      INSERT INTO portfolios (user_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [userId, portfolio.name, portfolio.description || null],
  )

  if (result.length === 0) {
    throw new Error('Failed to create portfolio')
  }

  return result[0] as Portfolio
})

// Update portfolio
export const updatePortfolio = createServerFn({
  method: 'POST',
}).handler(async ({ data: { portfolioId, portfolio } }) => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  const result = await client.query(
    `
      UPDATE portfolios
      SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND user_id = $4
      RETURNING *
    `,
    [portfolio.name, portfolio.description || null, portfolioId, userId],
  )

  if (result.length === 0) {
    throw new Error('Portfolio not found or update failed')
  }

  return result[0] as Portfolio
})

// Delete portfolio
export const deletePortfolio = createServerFn({
  method: 'POST',
}).handler(async ({ data: { portfolioId } }) => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  // Check if portfolio has investments
  const investmentCount = await client.query(
    'SELECT COUNT(*) as count FROM investments WHERE portfolio_id = $1',
    [portfolioId],
  )

  if (investmentCount[0]?.count > 0) {
    throw new Error('Cannot delete portfolio with existing investments')
  }

  const result = await client.query(
    'DELETE FROM portfolios WHERE id = $1 AND user_id = $2 RETURNING *',
    [portfolioId, userId],
  )

  if (result.length === 0) {
    throw new Error('Portfolio not found')
  }

  return { success: true }
})

// Update stock prices for a user (once per day)
export const updateUserStockPrices = createServerFn({
  method: 'POST',
}).handler(async () => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  console.log(`🔄 Updating stock prices for user ${userId}`)

  await initializeSchema()

  try {
    const stockInvestments = await client.query(
      `SELECT i.id, i.stock_symbol, i.stock_quantity, i.current_stock_price, i.stock_price_updated_at
         FROM investments i
         JOIN portfolios p ON i.portfolio_id = p.id
         WHERE p.user_id = $1
           AND i.investment_type = 'stock'
           AND i.stock_symbol IS NOT NULL
           AND (
             i.stock_price_updated_at IS NULL
             OR i.stock_price_updated_at < NOW() - INTERVAL '24 hours'
           )`,
      [userId],
    )

    if (stockInvestments.length === 0) {
      console.log(`✅ No stock prices need updating for user ${userId}`)
      return { updated: 0, errors: [] }
    }

    console.log(
      `📊 Found ${stockInvestments.length} stocks to update for user ${userId}`,
    )

    let updatedCount = 0
    const errors: string[] = []

    // Update each stock price with delays between API calls
    for (const investment of stockInvestments) {
      try {
        // Call the API to get the latest stock quote
        const quote = await getStockQuote({
          data: { symbol: investment.stock_symbol },
        })

        // Update the investment with the new price
        await client.query(
          `UPDATE investments
             SET current_stock_price = $1,
                 stock_price_updated_at = NOW()
             WHERE id = $2`,
          [quote.price, investment.id],
        )

        updatedCount++
        console.log(`✅ Updated ${investment.stock_symbol}: $${quote.price}`)

        // Add a delay between API calls to respect rate limits
        // 25 requests per day means we can be generous with delays
        if (stockInvestments.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      } catch (error) {
        // Log error but continue with other stocks
        const errorMessage = `Failed to update ${investment.stock_symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(`❌ ${errorMessage}`)
        errors.push(errorMessage)

        // If we hit the API limit, stop trying to update more stocks
        if (
          error instanceof Error &&
          (error.message.includes('API') ||
            error.message.includes('rate limit') ||
            error.message.includes('Note'))
        ) {
          console.log('⚠️ API limit likely reached, stopping updates')
          break
        }
      }
    }

    return { updated: updatedCount, errors }
  } catch (error) {
    console.error('Error updating stock prices:', error)
    // Don't throw - just return empty result
    return {
      updated: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }
  }
})

// Snapshot functions

// Get portfolio snapshots for historical chart
export const getPortfolioSnapshots = createServerFn({
  method: 'GET',
}).handler(async ({ data: { portfolioId, days = 30 } }) => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  const result = await client.query(
    `
      SELECT * FROM portfolio_daily_snapshots
      WHERE portfolio_id = $1
      ORDER BY snapshot_date DESC
      LIMIT $2
    `,
    [portfolioId, days],
  )

  return result as {
    portfolio_id: number
    snapshot_date: string
    total_value: number
    total_invested: number
    total_distributions: number
    investment_count: number
    created_at: string
  }[]
})

// Get user aggregate snapshots
export const getUserSnapshots = createServerFn({
  method: 'GET',
}).handler(async ({ data: { days = 30 } }) => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  const result = await client.query(
    `
      SELECT * FROM user_daily_snapshots
      WHERE user_id = $1
      ORDER BY snapshot_date DESC
      LIMIT $2
    `,
    [userId, days],
  )

  return result as {
    user_id: number
    snapshot_date: string
    total_value: number
    total_invested: number
    total_distributions: number
    portfolio_count: number
    investment_count: number
    created_at: string
  }[]
})

// Save snapshot for a specific portfolio
export const savePortfolioSnapshot = createServerFn({
  method: 'POST',
}).handler(async ({ data: { portfolioId, date } }) => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  const snapshotDate = date || new Date().toISOString().split('T')[0]

  await client.query('SELECT save_portfolio_snapshot($1, $2)', [
    portfolioId,
    snapshotDate,
  ])

  return { success: true }
})

// Save snapshot for a specific user
export const saveUserSnapshot = createServerFn({
  method: 'POST',
}).handler(async ({ data: { date } }) => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)

  const snapshotDate = date || new Date().toISOString().split('T')[0]

  await client.query('SELECT save_user_snapshot($1, $2)', [
    userId,
    snapshotDate,
  ])

  return { success: true }
})

// Save all snapshots (admin/cron function)
export const saveAllSnapshots = createServerFn({
  method: 'POST',
})
  .inputValidator((date?: string) => date)
  .handler(async ({ data: date }) => {
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
      throw new Error('saveAllSnapshots is not available in production')
    }

    const client = await getClient()
    if (!client) {
      throw new Error('Database connection failed')
    }

    const snapshotDate = date || new Date().toISOString().split('T')[0]

    // Get all users (without RLS since this is an admin function)
    const users = await client.query('SELECT id FROM users ORDER BY id')

    let usersSaved = 0

    // Iterate over each user and save their snapshot
    for (const user of users) {
      try {
        // Set session user for RLS
        await setSessionUser(user.id)

        // Call the database function to save user snapshot
        await client.query('SELECT save_user_snapshot($1, $2)', [
          user.id,
          snapshotDate,
        ])

        usersSaved++
      } catch (error) {
        console.error(`Failed to save snapshot for user ${user.id}:`, error)
      }
    }

    return {
      users_saved: usersSaved,
    }
  })
