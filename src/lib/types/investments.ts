export interface User {
  id: number
  email: string
  name: string
  created_at: string
  updated_at: string
}

export interface Portfolio {
  id: number
  user_id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Investment {
  id: number
  portfolio_id: number
  user_id?: number // Legacy field - will be removed after migration
  name: string
  description: string
  date_started?: string
  amount: number
  investment_type: string
  has_distributions: boolean
  stock_symbol?: string
  stock_quantity?: number
  current_stock_price?: number
  stock_price_updated_at?: string
  created_at: string
  updated_at: string
}

export interface Distribution {
  id: number
  investment_id: number
  date: string
  amount: number
  description?: string
  created_at: string
}

export interface Category {
  id: number
  user_id: number
  name: string
}

export interface Tag {
  id: number
  user_id: number
  name: string
}

export interface InvestmentType {
  id: number
  user_id: number
  name: string
  created_at: string
}

export interface InvestmentWithDetails extends Investment {
  categories: Category[]
  tags: Tag[]
  distributions: Distribution[]
  total_distributions: number
  current_return: number
}

export interface CreatePortfolioData {
  name: string
  description?: string
}

export interface CreateInvestmentData {
  portfolio_id: number
  name: string
  description: string
  date_started?: string
  amount: number
  investment_type: string
  has_distributions: boolean
  stock_symbol?: string
  stock_quantity?: number
  category_ids?: number[]
  tag_ids?: number[]
}

export interface CreateDistributionData {
  investment_id: number
  date: string
  amount: number
  description?: string
}

export interface CreateCategoryData {
  name: string
}

export interface CreateTagData {
  name: string
}

export interface CreateInvestmentTypeData {
  name: string
}

export interface UpdatePortfolioData {
  name: string
  description?: string
}

export interface UpdateInvestmentData {
  portfolio_id?: number
  name: string
  description: string
  date_started?: string
  amount: number
  investment_type: string
  has_distributions: boolean
  stock_symbol?: string
  stock_quantity?: number
  category_ids?: number[]
  tag_ids?: number[]
}
