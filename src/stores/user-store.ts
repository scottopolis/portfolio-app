import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createUser, getUsers } from '@/data/investments'

export interface MockUser {
  id: number
  name: string
  email: string
}

interface UserState {
  currentUser: MockUser | null
  mockUsers: MockUser[]
  setCurrentUser: (user: MockUser | null) => void
  initializeMockUsers: () => Promise<void>
  createNewUser: (name: string, email: string) => Promise<MockUser>
  refreshUsers: () => Promise<void>
  isInitialized: boolean
}

// Mock users for development
const DEFAULT_MOCK_USERS: MockUser[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
]

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      mockUsers: DEFAULT_MOCK_USERS,
      isInitialized: false,

      setCurrentUser: (user: MockUser | null) => {
        set({ currentUser: user })
      },

      initializeMockUsers: async () => {
        const { isInitialized } = get()
        if (isInitialized) return

        try {
          // Fetch users from database
          const users = await getUsers()
          const mockUsers = users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
          }))

          set({
            mockUsers,
            isInitialized: true,
            // Set first user as default if none selected
            currentUser: get().currentUser || mockUsers[0] || null,
          })
        } catch (error) {
          console.error('Failed to initialize users:', error)
          // Fallback to default mock users
          set({
            mockUsers: DEFAULT_MOCK_USERS,
            isInitialized: true,
            currentUser: get().currentUser || DEFAULT_MOCK_USERS[0],
          })
        }
      },

      createNewUser: async (name: string, email: string) => {
        try {
          const newUser = await createUser({ data: { name, email } })
          const mockUser: MockUser = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
          }

          set((state) => ({
            mockUsers: [...state.mockUsers, mockUser],
          }))

          return mockUser
        } catch (error) {
          console.error('Failed to create user:', error)
          throw error
        }
      },

      refreshUsers: async () => {
        try {
          const users = await getUsers()
          const mockUsers = users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
          }))

          set({ mockUsers })
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
export const useMockUsers = () => useUserStore((state) => state.mockUsers)
export const useSetCurrentUser = () =>
  useUserStore((state) => state.setCurrentUser)
export const useInitializeMockUsers = () =>
  useUserStore((state) => state.initializeMockUsers)
export const useCreateNewUser = () =>
  useUserStore((state) => state.createNewUser)
export const useRefreshUsers = () => useUserStore((state) => state.refreshUsers)
