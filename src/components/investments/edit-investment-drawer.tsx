import { useState } from 'react'
import { Edit } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { EditInvestmentForm } from '@/components/forms/edit-investment-form'
import { useCurrentUser } from '@/stores/user-store'
import type { InvestmentWithDetails } from '@/lib/types/investments'

interface EditInvestmentDrawerProps {
  investment: InvestmentWithDetails
  children?: React.ReactNode
  onSuccess?: () => void
}

export function EditInvestmentDrawer({
  investment,
  children,
  onSuccess,
}: EditInvestmentDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const currentUser = useCurrentUser()
  const navigate = useNavigate()

  const handleSuccess = (updatedInvestment: any) => {
    setIsOpen(false)
    
    // If investment was deleted, navigate to portfolio page
    if (updatedInvestment?.deleted) {
      navigate({
        to: '/portfolios/$portfolioId',
        params: { portfolioId: investment.portfolio_id.toString() },
      })
    }
    
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
            Edit Investment
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent className="min-h-[90vh]" direction="right">
        <div className="flex flex-col h-full overflow-y-auto">
          <DrawerHeader className="flex-shrink-0">
            <DrawerTitle>Edit Investment</DrawerTitle>
            <DrawerDescription>
              Update the details of "{investment.name}"
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <EditInvestmentForm
              userId={currentUser?.id || 0}
              investment={investment}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
