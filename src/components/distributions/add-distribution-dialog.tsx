import { useState } from 'react'
import { Plus } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AddDistributionForm } from '@/components/forms/add-distribution-form'

interface AddDistributionDialogProps {
  investmentId: number
  investmentName: string
}

export function AddDistributionDialog({
  investmentId,
  investmentName,
}: AddDistributionDialogProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
  }

  const handleCancel = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Distribution
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Distribution</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Add a new distribution for {investmentName}
          </p>
        </DialogHeader>
        <AddDistributionForm
          investmentId={investmentId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}
