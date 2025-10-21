export interface User {
  id: number
  email: string
  name: string
  created_at: string
  updated_at: string
}

export interface Investment {
  id: number
  user_id: number
  name: string
  description: string
  date_started: string
  initial_amount: number
  investment_type: string
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

export interface InvestmentWithDetails extends Investment {
  categories: Category[]
  tags: Tag[]
  distributions: Distribution[]
  total_distributions: number
  current_return: number
}

export interface CreateInvestmentData {
  name: string
  description: string
  date_started: string
  initial_amount: number
  investment_type: string
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

export interface UpdateInvestmentData {
  name: string
  description: string
  date_started: string
  initial_amount: number
  investment_type: string
  category_ids?: number[]
  tag_ids?: number[]
}
