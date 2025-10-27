import { useState } from 'react'
import { Edit } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { EditUserForm } from '@/components/forms/edit-user-form'
import type { User } from '@/lib/types/investments'

interface EditUserDrawerProps {
  user: User
  children?: React.ReactNode
  onSuccess?: () => void
}

export function EditUserDrawer({
  user,
  children,
  onSuccess,
}: EditUserDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSuccess = (updatedUser: any) => {
    setIsOpen(false)
    onSuccess?.()
  }

  const handleCancel = () => {
    setIsOpen(false)
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Account
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent className="min-h-[90vh]" direction="right">
        <div className="flex flex-col h-full">
          <DrawerHeader className="flex-shrink-0">
            <DrawerTitle>Edit Account</DrawerTitle>
            <DrawerDescription>
              Update your account details
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <EditUserForm
              user={user}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
