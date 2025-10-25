import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getPortfolios,
  getPortfolioWithInvestments,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
} from '@/data/investments'
import type {
  CreatePortfolioData,
  UpdatePortfolioData,
} from '@/lib/types/investments'

// Get all portfolios for a user
export function usePortfolios(userId: number, isInitialized = true) {
  const isClient = typeof window !== 'undefined'
  console.log('📦 usePortfolios called with userId:', userId, 'isInitialized:', isInitialized, 'isClient:', isClient)
  return useQuery({
    queryKey: ['portfolios', userId],
    queryFn: async () => {
      console.log('📦 usePortfolios queryFn executing for userId:', userId)
      try {
        const result = await getPortfolios()
        console.log('📦 usePortfolios queryFn result type:', typeof result)
        console.log('📦 usePortfolios queryFn result isArray:', Array.isArray(result))
        console.log('📦 usePortfolios queryFn result:', result)
        console.log('📦 usePortfolios queryFn result length:', result?.length)
        return result
      } catch (error) {
        console.error('🚨 getPortfolios queryFn error:', error)
        throw error
      }
    },
    enabled: !!userId && isInitialized && isClient,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Get single portfolio with investments
export function usePortfolioById(userId: number, portfolioId: number) {
  return useQuery({
    queryKey: ['portfolio', userId, portfolioId],
    queryFn: () =>
      getPortfolioWithInvestments({ data: { portfolioId } }),
    enabled: !!userId && !!portfolioId,
  })
}

// Create portfolio mutation
export function useCreatePortfolio(userId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (portfolio: CreatePortfolioData) =>
      createPortfolio({ data: { portfolio } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios', userId] })
    },
  })
}

// Update portfolio mutation
export function useUpdatePortfolio(userId: number, portfolioId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (portfolio: UpdatePortfolioData) =>
      updatePortfolio({ data: { portfolioId, portfolio } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios', userId] })
      queryClient.invalidateQueries({
        queryKey: ['portfolio', userId, portfolioId],
      })
    },
  })
}

// Delete portfolio mutation
export function useDeletePortfolio(userId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (portfolioId: number) =>
      deletePortfolio({ data: { portfolioId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios', userId] })
    },
  })
}
