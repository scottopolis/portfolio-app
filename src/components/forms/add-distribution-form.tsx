import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { useCreateDistribution } from '@/hooks/use-investments'
import { useCurrentUser } from '@/stores/user-store'
import type { CreateDistributionData } from '@/lib/types/investments'

const addDistributionSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
})

type AddDistributionFormData = z.infer<typeof addDistributionSchema>

interface AddDistributionFormProps {
  investmentId: number
  onSuccess?: () => void
  onCancel?: () => void
}

export function AddDistributionForm({
  investmentId,
  onSuccess,
  onCancel,
}: AddDistributionFormProps) {
  const currentUser = useCurrentUser()
  const createDistribution = useCreateDistribution()

  const form = useForm<AddDistributionFormData>({
    resolver: zodResolver(addDistributionSchema),
    defaultValues: {
      amount: 0,
      date: new Date().toISOString().split('T')[0], // Today's date
      description: '',
    },
  })

  const onSubmit = async (data: AddDistributionFormData) => {
    if (!currentUser?.id) return

    const distributionData: CreateDistributionData = {
      investment_id: investmentId,
      amount: data.amount,
      date: data.date,
      description: data.description || undefined,
    }

    try {
      await createDistribution.mutateAsync({
        userId: currentUser.id,
        ...distributionData,
      })

      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create distribution:', error)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Field>
        <FieldLabel>Amount</FieldLabel>
        <FieldContent>
          <Controller
            control={form.control}
            name="amount"
            render={({ field }) => (
              <Input type="number" step="0.01" placeholder="0.00" {...field} />
            )}
          />
          <FieldError>{form.formState.errors.amount?.message}</FieldError>
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>Date</FieldLabel>
        <FieldContent>
          <Controller
            control={form.control}
            name="date"
            render={({ field }) => <Input type="date" {...field} />}
          />
          <FieldError>{form.formState.errors.date?.message}</FieldError>
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>Description (Optional)</FieldLabel>
        <FieldContent>
          <Controller
            control={form.control}
            name="description"
            render={({ field }) => (
              <Textarea
                placeholder="Additional details about this distribution..."
                className="min-h-[100px]"
                {...field}
              />
            )}
          />
          <FieldError>{form.formState.errors.description?.message}</FieldError>
        </FieldContent>
      </Field>

      <div className="flex gap-3">
        <Button type="submit" disabled={createDistribution.isPending}>
          {createDistribution.isPending ? 'Adding...' : 'Add Distribution'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
