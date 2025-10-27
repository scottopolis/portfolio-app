import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateUser } from '@/data/investments'
import type { UpdateUserData } from '@/lib/types/investments'
import { useUserStore } from '@/stores/user-store'

export function useUpdateUser() {
  const queryClient = useQueryClient()
  const { setCurrentUser } = useUserStore()

  return useMutation({
    mutationFn: async (userData: UpdateUserData) => {
      const result = await updateUser({ data: { userData } })
      return result
    },
    onSuccess: (updatedUser) => {
      setCurrentUser({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
      })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
