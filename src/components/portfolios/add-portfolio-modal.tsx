import { useState } from 'react'
import { IconPlus } from '@tabler/icons-react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCreatePortfolio } from '@/hooks/use-portfolios'
import { useCurrentUser } from '@/stores/user-store'
import { toast } from 'sonner'

const portfolioSchema = z.object({
  name: z.string().min(1, 'Portfolio name is required'),
  description: z.string().optional(),
})

type PortfolioFormData = z.infer<typeof portfolioSchema>

interface AddPortfolioModalProps {
  children?: React.ReactNode
  onSuccess?: () => void
}

export function AddPortfolioModal({
  children,
  onSuccess,
}: AddPortfolioModalProps) {
  const [open, setOpen] = useState(false)
  const currentUser = useCurrentUser()
  const createPortfolioMutation = useCreatePortfolio(currentUser?.id || 0)

  const form = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const onSubmit = async (data: PortfolioFormData) => {
    if (!currentUser) {
      toast.error('Please select a user first')
      return
    }

    try {
      await createPortfolioMutation.mutateAsync(data)
      toast.success('Portfolio created successfully')
      setOpen(false)
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create portfolio:', error)
      toast.error('Failed to create portfolio')
    }
  }

  const trigger = children || (
    <Button>
      <IconPlus className="size-4" />
      New Portfolio
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Portfolio</DialogTitle>
          <DialogDescription>
            Add a new portfolio to organize your investments by strategy, asset
            class, or any other criteria.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Portfolio Name</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="e.g., Growth Stocks, Real Estate, Crypto"
                  autoComplete="off"
                />
                <FieldDescription>
                  A descriptive name for your portfolio.
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Description (Optional)
                </FieldLabel>
                <Textarea
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="Describe your investment strategy or goals for this portfolio..."
                  rows={3}
                />
                <FieldDescription>
                  Additional details about this portfolio's purpose or strategy.
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createPortfolioMutation.isPending}>
              {createPortfolioMutation.isPending
                ? 'Creating...'
                : 'Create Portfolio'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
