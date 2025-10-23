import { useState } from 'react'
import { IconPlus } from '@tabler/icons-react'
import { useParams } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CreateInvestmentForm } from '@/components/forms/create-investment-form'
import { useCurrentUser } from '@/stores/user-store'

interface AddInvestmentModalProps {
  children?: React.ReactNode
  onSuccess?: (investment: any) => void
}

export function AddInvestmentModal({
  children,
  onSuccess,
}: AddInvestmentModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const currentUser = useCurrentUser()
  const { portfolioId } = useParams({ from: '/portfolios/$portfolioId' })

  const handleSuccess = (investment: any) => {
    setIsOpen(false)
    onSuccess?.(investment)
  }

  const handleCancel = () => {
    setIsOpen(false)
  }

  if (!currentUser) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <IconPlus className="size-4" />
            Add Investment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Investment</DialogTitle>
          <DialogDescription>
            Create a new investment to track your portfolio performance and
            returns.
          </DialogDescription>
        </DialogHeader>
        <CreateInvestmentForm
          userId={currentUser.id}
          portfolioId={Number(portfolioId)}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}

// Convenience component for just the button
export function AddInvestmentButton({
  variant = 'default',
  size = 'default',
  className,
  onSuccess,
}: {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  onSuccess?: (investment: any) => void
}) {
  return (
    <AddInvestmentModal onSuccess={onSuccess}>
      <Button variant={variant} size={size} className={className}>
        <IconPlus className="size-4" />
        Add Investment
      </Button>
    </AddInvestmentModal>
  )
}
