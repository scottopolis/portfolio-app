import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createUser, getUsers } from '@/data/investments'

export interface User {
  id: number
  name: string
  email: string
  created_at?: string
  updated_at?: string
}

interface UserState {
  currentUser: User | null
  users: User[]
  setCurrentUser: (user: User | null) => void
  initializeUsers: () => Promise<void>
  createNewUser: (name: string, email: string) => Promise<User>
  refreshUsers: () => Promise<void>
  isInitialized: boolean
}

// Get initial user from env var if available
const getInitialUser = (): User | null => {
  const envUserId = import.meta.env.VITE_DEV_USER_ID
  if (envUserId) {
    const userId = parseInt(envUserId, 10)
    return {
      id: userId,
      name: `Dev User ${userId}`,
      email: `user${userId}@dev.local`,
    }
  }
  return null
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: getInitialUser(),
      users: [],
      isInitialized: !!import.meta.env.VITE_DEV_USER_ID, // Start as true if env var is set

      setCurrentUser: (user: User | null) => {
        set({ currentUser: user })
      },

      initializeUsers: async () => {
        const { isInitialized } = get()
        if (isInitialized) return

        try {
          // Fetch users from database
          const dbUsers = await getUsers()
          const users = dbUsers.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at,
          }))

          // Check if VITE_DEV_USER_ID env var is set
          const envUserId = import.meta.env.VITE_DEV_USER_ID
          let defaultUser = users[0] || null
          
          if (envUserId) {
            const userId = parseInt(envUserId, 10)
            const envUser = users.find(u => u.id === userId)
            if (envUser) {
              defaultUser = envUser
              console.log(`🔑 Client: Using user ${userId} from VITE_DEV_USER_ID`)
            } else {
              // Keep the initial user from env even if not in DB yet
              defaultUser = get().currentUser
            }
          } else {
            // No env var, use current user or first from DB
            defaultUser = get().currentUser || users[0] || null
          }

          set({
            users,
            isInitialized: true,
            currentUser: defaultUser,
          })
        } catch (error) {
          console.error('Failed to initialize users:', error)
          set({
            users: [],
            isInitialized: true,
            currentUser: null,
          })
        }
      },

      createNewUser: async (name: string, email: string) => {
        try {
          const newUser = await createUser({ data: { name, email } })

          const user: User = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            created_at: newUser.created_at,
            updated_at: newUser.updated_at,
          }

          // Add the new user to the existing list immediately
          set((state) => ({
            users: [...state.users, user],
          }))

          return user
        } catch (error) {
          console.error('Failed to create user:', error)
          throw error
        }
      },

      refreshUsers: async () => {
        try {
          const dbUsers = await getUsers()
          const users = dbUsers.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at,
          }))

          set({ users })
        } catch (error) {
          console.error('Failed to refresh users:', error)
          throw error
        }
      },
    }),
    {
      name: 'user-store', // localStorage key
      partialize: (state) => ({
        currentUser: state.currentUser,
        isInitialized: state.isInitialized,
      }),
    },
  ),
)

// Convenience hooks
export const useCurrentUser = () => useUserStore((state) => state.currentUser)
export const useUsers = () => useUserStore((state) => state.users)
export const useSetCurrentUser = () =>
  useUserStore((state) => state.setCurrentUser)
export const useInitializeUsers = () =>
  useUserStore((state) => state.initializeUsers)
export const useCreateNewUser = () =>
  useUserStore((state) => state.createNewUser)
export const useRefreshUsers = () => useUserStore((state) => state.refreshUsers)
