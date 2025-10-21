import { useEffect, useState } from 'react'
import { IconUser, IconUsers, IconPlus } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useCurrentUser,
  useMockUsers,
  useSetCurrentUser,
  useInitializeMockUsers,
  useCreateNewUser
  
} from '@/stores/user-store'
import type {MockUser} from '@/stores/user-store';

interface UserSelectorProps {
  className?: string
  compact?: boolean
}

export function UserSelector({
  className,
  compact = false,
}: UserSelectorProps) {
  const currentUser = useCurrentUser()
  const mockUsers = useMockUsers()
  const setCurrentUser = useSetCurrentUser()
  const initializeMockUsers = useInitializeMockUsers()
  const createNewUser = useCreateNewUser()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    initializeMockUsers()
  }, [initializeMockUsers])

  const handleUserChange = (userId: string) => {
    const user = mockUsers.find((u) => u.id.toString() === userId)
    setCurrentUser(user || null)
  }

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return

    setIsCreating(true)
    try {
      const newUser = await createNewUser(
        newUserName.trim(),
        newUserEmail.trim(),
      )
      setCurrentUser(newUser)
      setIsCreateDialogOpen(false)
      setNewUserName('')
      setNewUserEmail('')
    } catch (error) {
      console.error('Failed to create user:', error)
      // You could add toast notification here
    } finally {
      setIsCreating(false)
    }
  }

  if (compact) {
    return (
      <div className={className}>
        <div className="space-y-2">
          <Select
            value={currentUser?.id.toString() || ''}
            onValueChange={handleUserChange}
          >
            <SelectTrigger className="w-full">
              <div className="flex items-center gap-2">
                <SelectValue placeholder="Select user" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {mockUsers.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  <div className="flex items-center gap-2">
                    <IconUser className="size-4" />
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <IconPlus className="size-4 mr-1" />
                New User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system. This is for development purposes
                  only.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="compact-name">Name</Label>
                  <Input
                    id="compact-name"
                    placeholder="Enter user's full name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compact-email">Email</Label>
                  <Input
                    id="compact-email"
                    type="email"
                    placeholder="Enter user's email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    disabled={isCreating}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateUser}
                  disabled={
                    !newUserName.trim() || !newUserEmail.trim() || isCreating
                  }
                >
                  {isCreating ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconUsers className="size-5" />
          User Selection
        </CardTitle>
        <CardDescription>
          Choose a user to view their investments. This is temporary until we
          add authentication.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Current User:</label>
          {currentUser ? (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <IconUser className="size-4" />
                </div>
                <div>
                  <div className="font-medium">{currentUser.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {currentUser.email}
                  </div>
                </div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          ) : (
            <div className="p-3 border border-dashed rounded-lg text-center text-muted-foreground">
              No user selected
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Switch User:</label>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconPlus className="size-4 mr-1" />
                  New User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to the system. This is for development
                    purposes only.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter user's full name"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      disabled={isCreating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter user's email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      disabled={isCreating}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateUser}
                    disabled={
                      !newUserName.trim() || !newUserEmail.trim() || isCreating
                    }
                  >
                    {isCreating ? 'Creating...' : 'Create User'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Select
            value={currentUser?.id.toString() || ''}
            onValueChange={handleUserChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {mockUsers.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  <div className="flex items-center gap-2">
                    <IconUser className="size-4" />
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2 text-xs text-muted-foreground">
          💡 Mock users are provided for development. In production, this would
          be replaced with proper authentication and user management.
        </div>
      </CardContent>
    </Card>
  )
}

// Simple header component showing current user
export function UserBadge({ className }: { className?: string }) {
  const currentUser = useCurrentUser()
  const initializeMockUsers = useInitializeMockUsers()

  useEffect(() => {
    initializeMockUsers()
  }, [initializeMockUsers])

  if (!currentUser) {
    return (
      <Badge variant="outline" className={className}>
        <IconUser className="size-3" />
        No user
      </Badge>
    )
  }

  return (
    <Badge variant="default" className={className}>
      <IconUser className="size-3" />
      {currentUser.name}
    </Badge>
  )
}
