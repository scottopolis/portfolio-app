import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getInvestments,
  getInvestmentWithDetails,
  getInvestmentByPortfolio,
  createInvestment,
  updateInvestment,
  createDistribution,
  getCategories,
  createCategory,
  getTags,
  createTag,
  getInvestmentTypes,
  createInvestmentType,
} from '@/data/investments'
import { useCurrentUser } from '@/stores/user-store'
import type {
  CreateInvestmentData,
  UpdateInvestmentData,
  CreateDistributionData,
  CreateCategoryData,
  CreateTagData,
  CreateInvestmentTypeData,
} from '@/lib/types/investments'

// Query keys
export const investmentKeys = {
  all: ['investments'] as const,
  lists: () => [...investmentKeys.all, 'list'] as const,
  list: (userId: number) => [...investmentKeys.lists(), userId] as const,
  details: () => [...investmentKeys.all, 'detail'] as const,
  detail: (userId: number, investmentId: number) =>
    [...investmentKeys.details(), userId, investmentId] as const,
}

export const categoryKeys = {
  all: ['categories'] as const,
  list: (userId: number) => [...categoryKeys.all, userId] as const,
}

export const tagKeys = {
  all: ['tags'] as const,
  list: (userId: number) => [...tagKeys.all, userId] as const,
}

export const investmentTypeKeys = {
  all: ['investment-types'] as const,
  list: (userId: number) => [...investmentTypeKeys.all, userId] as const,
}

// Query options for use with ensureQueryData
export const investmentsQueryOptions = (userId: number) => ({
  queryKey: investmentKeys.list(userId),
  queryFn: () => getInvestments({ data: userId }),
  enabled: !!userId && userId > 0,
})

export const investmentDetailsQueryOptions = (
  userId: number,
  investmentId: number,
) => ({
  queryKey: investmentKeys.detail(userId, investmentId),
  queryFn: () => getInvestmentWithDetails({ data: { userId, investmentId } }),
  enabled: !!userId && !!investmentId,
})

export const categoriesQueryOptions = (userId: number) => ({
  queryKey: categoryKeys.list(userId),
  queryFn: () => getCategories({ data: userId }),
  enabled: !!userId,
})

export const tagsQueryOptions = (userId: number) => ({
  queryKey: tagKeys.list(userId),
  queryFn: () => getTags({ data: userId }),
  enabled: !!userId,
})

export const investmentTypesQueryOptions = (userId: number) => ({
  queryKey: investmentTypeKeys.list(userId),
  queryFn: () => getInvestmentTypes({ data: userId }),
  enabled: !!userId,
})

// Investment hooks
export function useInvestments(userId: number) {
  return useQuery({
    queryKey: investmentKeys.list(userId),
    queryFn: () => getInvestments({ data: userId }),
    enabled: !!userId && userId > 0,
  })
}

export function useInvestmentDetails(userId: number, investmentId: number) {
  return useQuery({
    queryKey: investmentKeys.detail(userId, investmentId),
    queryFn: () => getInvestmentWithDetails({ data: { userId, investmentId } }),
    enabled: !!userId && !!investmentId,
  })
}

export function useInvestmentById(investmentId: number) {
  const currentUser = useCurrentUser()
  return useQuery({
    queryKey: investmentKeys.detail(currentUser?.id || 0, investmentId),
    queryFn: () =>
      getInvestmentWithDetails({
        data: { userId: currentUser!.id, investmentId },
      }),
    enabled: !!currentUser?.id && !!investmentId,
  })
}

export function useInvestmentByPortfolio(portfolioId: number, investmentId: number) {
  return useQuery({
    queryKey: ['portfolios', portfolioId, 'investments', investmentId],
    queryFn: () =>
      getInvestmentByPortfolio({
        data: { portfolioId, investmentId },
      }),
    enabled: !!portfolioId && !!investmentId,
  })
}

export function useCreateInvestment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { userId: number } & CreateInvestmentData) =>
      createInvestment({ data }),
    onSuccess: (_, variables) => {
      // Invalidate investments list
      queryClient.invalidateQueries({
        queryKey: investmentKeys.list(variables.userId),
      })

      // Invalidate portfolio-specific investment queries
      queryClient.invalidateQueries({
        queryKey: [
          'portfolios',
          variables.userId,
          variables.portfolio_id,
          'investments',
        ],
      })

      // Invalidate all portfolio queries to update counts/totals
      queryClient.invalidateQueries({
        queryKey: ['portfolios', variables.userId],
      })
    },
  })
}

export function useUpdateInvestment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      data: { userId: number; investmentId: number } & UpdateInvestmentData,
    ) => updateInvestment({ data }),
    onSuccess: (_, variables) => {
      // Invalidate investments list
      queryClient.invalidateQueries({
        queryKey: investmentKeys.list(variables.userId),
      })

      // Invalidate specific investment details
      queryClient.invalidateQueries({
        queryKey: investmentKeys.detail(
          variables.userId,
          variables.investmentId,
        ),
      })
    },
  })
}

export function useCreateDistribution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { userId: number } & CreateDistributionData) =>
      createDistribution({ data }),
    onSuccess: (_, variables) => {
      const { userId, investment_id } = variables

      // Invalidate investments list
      queryClient.invalidateQueries({
        queryKey: investmentKeys.list(userId),
      })

      // Invalidate specific investment details
      queryClient.invalidateQueries({
        queryKey: investmentKeys.detail(userId, investment_id),
      })
    },
  })
}

// Category hooks
export function useCategories(userId: number) {
  return useQuery({
    queryKey: categoryKeys.list(userId),
    queryFn: () => getCategories({ data: userId }),
    enabled: !!userId,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { userId: number } & CreateCategoryData) =>
      createCategory({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: categoryKeys.list(variables.userId),
      })
    },
  })
}

// Tag hooks
export function useTags(userId: number) {
  return useQuery({
    queryKey: tagKeys.list(userId),
    queryFn: () => getTags({ data: userId }),
    enabled: !!userId,
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { userId: number } & CreateTagData) =>
      createTag({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: tagKeys.list(variables.userId),
      })
    },
  })
}

// Investment type hooks
export function useInvestmentTypes(userId: number) {
  return useQuery({
    queryKey: investmentTypeKeys.list(userId),
    queryFn: () => getInvestmentTypes({ data: userId }),
    enabled: !!userId,
  })
}

export function useCreateInvestmentType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { userId: number } & CreateInvestmentTypeData) =>
      createInvestmentType({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: investmentTypeKeys.list(variables.userId),
      })
    },
  })
}

// Hook to get investments for a specific portfolio
export function useInvestmentsByPortfolio(userId: number, portfolioId: number) {
  return useQuery({
    queryKey: ['portfolios', userId, portfolioId, 'investments'],
    queryFn: async () => {
      const { getPortfolioWithInvestments } = await import('@/data/investments')
      const portfolio = await getPortfolioWithInvestments({
        data: { userId, portfolioId },
      })
      return portfolio.investments
    },
    enabled: !!userId && !!portfolioId,
  })
}

// Utility hooks for common operations
export function useInvestmentOperations(userId: number) {
  const createInvestmentMutation = useCreateInvestment()
  const createDistributionMutation = useCreateDistribution()
  const createCategoryMutation = useCreateCategory()
  const createTagMutation = useCreateTag()

  return {
    createInvestment: createInvestmentMutation.mutateAsync,
    createDistribution: createDistributionMutation.mutateAsync,
    createCategory: createCategoryMutation.mutateAsync,
    createTag: createTagMutation.mutateAsync,
    isLoading:
      createInvestmentMutation.isPending ||
      createDistributionMutation.isPending ||
      createCategoryMutation.isPending ||
      createTagMutation.isPending,
  }
}
