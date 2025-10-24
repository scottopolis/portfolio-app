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
import { EditPortfolioForm } from '@/components/forms/edit-portfolio-form'
import { useCurrentUser } from '@/stores/user-store'
import type { Portfolio } from '@/lib/types/investments'

interface EditPortfolioDrawerProps {
  portfolio: Portfolio
  children?: React.ReactNode
  onSuccess?: () => void
}

export function EditPortfolioDrawer({
  portfolio,
  children,
  onSuccess,
}: EditPortfolioDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const currentUser = useCurrentUser()

  if (!currentUser) {
    return null
  }

  const handleSuccess = (updatedPortfolio: any) => {
    setIsOpen(false)
    onSuccess?.(updatedPortfolio)
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
            Edit Portfolio
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent className="min-h-[90vh]" direction="right">
        <div className="flex flex-col h-full">
          <DrawerHeader className="flex-shrink-0">
            <DrawerTitle>Edit Portfolio</DrawerTitle>
            <DrawerDescription>
              Update the details of "{portfolio.name}"
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <EditPortfolioForm
              userId={currentUser.id}
              portfolio={portfolio}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
