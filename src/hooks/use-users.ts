import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUsers, createUser } from '@/data/investments'

// Query keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
}

// Get all users
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: () => getUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Create user mutation
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; email: string }) => createUser({ data }),
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}
