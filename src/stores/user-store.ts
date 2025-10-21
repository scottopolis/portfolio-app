import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createUser, getUsers } from '@/data/investments'

export interface User {
  id: number
  name: string
  email: string
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

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      isInitialized: false,

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
          }))

          set({
            users,
            isInitialized: true,
            // Set first user as default if none selected
            currentUser: get().currentUser || users[0] || null,
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
