import { createFileRoute } from '@tanstack/react-router'
import { User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EditUserDrawer } from '@/components/user/edit-user-drawer'
import { useCurrentUser } from '@/stores/user-store'

export const Route = createFileRoute('/account')({
  component: AccountPage,
})

function AccountPage() {
  const currentUser = useCurrentUser()

  if (!currentUser) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-muted-foreground">
          No user selected
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account details
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Profile Information</CardTitle>
            </div>
            <EditUserDrawer user={currentUser} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              Name
            </div>
            <div className="text-lg mt-1">{currentUser.name}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              Email
            </div>
            <div className="text-lg mt-1">{currentUser.email}</div>
          </div>
          {currentUser.created_at && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Account Created
              </div>
              <div className="text-lg mt-1">
                {new Date(currentUser.created_at).toLocaleDateString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
