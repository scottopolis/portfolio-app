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
export function usePortfolios(userId: number) {
  console.log(
    '🚀 usePortfolios called with userId:',
    userId,
    'enabled:',
    !!userId,
  )

  return useQuery({
    queryKey: ['portfolios', userId],
    queryFn: async () => {
      console.log('🚀 getPortfolios queryFn executing for userId:', userId)
      try {
        const result = await getPortfolios({ data: userId })
        console.log('🚀 getPortfolios queryFn result:', result)
        return result
      } catch (error) {
        console.error('🚨 getPortfolios queryFn error:', error)
        throw error
      }
    },
    enabled: !!userId,
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache
  })
}

// Get single portfolio with investments
export function usePortfolioById(userId: number, portfolioId: number) {
  return useQuery({
    queryKey: ['portfolio', userId, portfolioId],
    queryFn: () => getPortfolioWithInvestments({ data: { userId, portfolioId } }),
    enabled: !!userId && !!portfolioId,
  })
}

// Create portfolio mutation
export function useCreatePortfolio(userId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (portfolio: CreatePortfolioData) =>
      createPortfolio({ data: { userId, portfolio } }),
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
      updatePortfolio({ data: { userId, portfolioId, portfolio } }),
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
      deletePortfolio({ data: { userId, portfolioId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios', userId] })
    },
  })
}
