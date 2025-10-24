import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { useUpdatePortfolio } from '@/hooks/use-portfolios'
import type { Portfolio, UpdatePortfolioData } from '@/lib/types/investments'

const portfolioSchema = z.object({
  name: z
    .string()
    .min(1, 'Portfolio name is required')
    .min(3, 'Portfolio name must be at least 3 characters')
    .max(255, 'Portfolio name must be at most 255 characters'),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional()
    .or(z.literal('')),
})

type PortfolioFormData = z.infer<typeof portfolioSchema>

interface EditPortfolioFormProps {
  userId: number
  portfolio: Portfolio
  onSuccess?: (portfolio: any) => void
  onCancel?: () => void
}

export function EditPortfolioForm({
  userId,
  portfolio,
  onSuccess,
  onCancel,
}: EditPortfolioFormProps) {
  const updatePortfolioMutation = useUpdatePortfolio(userId, portfolio.id)

  const form = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      name: portfolio.name,
      description: portfolio.description || '',
    },
    mode: 'onBlur',
  })

  async function onSubmit(data: PortfolioFormData) {
    try {
      const portfolioData: UpdatePortfolioData = {
        name: data.name,
        description: data.description || '',
      }

      const result = await updatePortfolioMutation.mutateAsync(portfolioData)

      onSuccess?.(result)
    } catch (error) {
      console.error('Failed to update portfolio:', error)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Portfolio Name */}
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
              placeholder="e.g., Growth Stocks, Real Estate"
              autoComplete="off"
            />
            <FieldDescription>
              A descriptive name to help you identify this portfolio.
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Description */}
      <Controller
        name="description"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Description</FieldLabel>
            <Textarea
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="Optional details about this portfolio..."
              className="min-h-[100px]"
            />
            <FieldDescription>
              Additional details or notes about this portfolio (optional).
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={updatePortfolioMutation.isPending}>
          {updatePortfolioMutation.isPending
            ? 'Updating...'
            : 'Update Portfolio'}
        </Button>
      </div>
    </form>
  )
}
