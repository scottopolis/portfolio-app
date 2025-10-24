import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { useCategories, useTags } from '@/hooks/use-investments'
import type { CreateInvestmentData } from '@/lib/types/investments'

const manualInvestmentSchema = z.object({
  name: z
    .string()
    .min(1, 'Investment name is required')
    .min(3, 'Investment name must be at least 3 characters')
    .max(255, 'Investment name must be at most 255 characters'),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional()
    .or(z.literal('')),
  date_started: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date')
    .optional()
    .nullable(),
  amount: z
    .number({
      required_error: 'Initial amount is required',
      invalid_type_error: 'Initial amount must be a number',
    })
    .min(0.01, 'Initial amount must be greater than 0')
    .max(999999999.99, 'Initial amount is too large'),
  has_distributions: z.boolean(),
  category_ids: z.array(z.number()).optional(),
  tag_ids: z.array(z.number()).optional(),
})

type ManualInvestmentFormData = z.infer<typeof manualInvestmentSchema>

interface ManualInvestmentFormProps {
  userId: number
  portfolioId?: number
  onSubmit: (data: CreateInvestmentData) => void
  onCancel?: () => void
  isSubmitting?: boolean
}

export function ManualInvestmentForm({
  userId,
  portfolioId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ManualInvestmentFormProps) {
  const { data: categories = [] } = useCategories(userId)
  const { data: tags = [] } = useTags(userId)

  const form = useForm<ManualInvestmentFormData>({
    resolver: zodResolver(manualInvestmentSchema),
    defaultValues: {
      name: '',
      description: '',
      date_started: undefined,
      amount: undefined,
      has_distributions: true,
      category_ids: [],
      tag_ids: [],
    },
    mode: 'onBlur',
  })

  async function handleSubmit(data: ManualInvestmentFormData) {
    if (!portfolioId) {
      console.error('Portfolio ID is required to create investment')
      return
    }

    const investmentData: CreateInvestmentData = {
      portfolio_id: portfolioId,
      name: data.name,
      description: data.description || '',
      date_started: data.date_started,
      amount: data.amount,
      investment_type: 'manual',
      has_distributions: data.has_distributions,
      category_ids: data.category_ids?.length ? data.category_ids : undefined,
      tag_ids: data.tag_ids?.length ? data.tag_ids : undefined,
    }

    onSubmit(investmentData)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Investment Name */}
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Investment Name</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="e.g., Apple Stock, Main Street Duplex"
              autoComplete="off"
            />
            <FieldDescription>
              A descriptive name to help you identify this investment.
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
              placeholder="Optional details about this investment..."
              className="min-h-[100px]"
            />
            <FieldDescription>
              Additional details or notes about this investment (optional).
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Date Started and Initial Amount - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Controller
          name="date_started"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Start Date</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="date"
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                When did you start this investment?
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="amount"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Amount</FieldLabel>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  $
                </div>
                <Input
                  {...field}
                  id={field.name}
                  type="number"
                  step="0.01"
                  min="0"
                  aria-invalid={fieldState.invalid}
                  placeholder="0.00"
                  className="pl-8"
                  onChange={(e) => {
                    const value = e.target.value
                    field.onChange(value === '' ? undefined : parseFloat(value))
                  }}
                  value={field.value ?? ''}
                />
              </div>
              <FieldDescription>How much did you invest?</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      {/* Has Distributions Toggle */}
      <Controller
        name="has_distributions"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <div className="flex items-center gap-3">
              <Checkbox
                id={field.name}
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-invalid={fieldState.invalid}
              />
              <FieldLabel htmlFor={field.name}>Track Distributions</FieldLabel>
            </div>
            <FieldDescription>
              Enable this if you want to track distributions (dividends,
              returns, etc.) for this investment.
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Categories */}
      {categories.length > 0 && (
        <Controller
          name="category_ids"
          control={form.control}
          render={({ field, fieldState }) => (
            <FieldSet>
              <FieldLegend variant="label">Categories</FieldLegend>
              <FieldDescription>
                Select categories that apply to this investment (optional).
              </FieldDescription>
              <FieldGroup data-slot="checkbox-group">
                {categories.map((category) => (
                  <Field
                    key={category.id}
                    orientation="horizontal"
                    data-invalid={fieldState.invalid}
                  >
                    <Checkbox
                      id={`category-${category.id}`}
                      name={field.name}
                      aria-invalid={fieldState.invalid}
                      checked={field.value?.includes(category.id) || false}
                      onCheckedChange={(checked) => {
                        const currentValue = field.value || []
                        const newValue = checked
                          ? [...currentValue, category.id]
                          : currentValue.filter((id) => id !== category.id)
                        field.onChange(newValue)
                      }}
                    />
                    <FieldLabel
                      htmlFor={`category-${category.id}`}
                      className="font-normal"
                    >
                      {category.name}
                    </FieldLabel>
                  </Field>
                ))}
              </FieldGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </FieldSet>
          )}
        />
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <Controller
          name="tag_ids"
          control={form.control}
          render={({ field, fieldState }) => (
            <FieldSet>
              <FieldLegend variant="label">Tags</FieldLegend>
              <FieldDescription>
                Select tags that apply to this investment (optional).
              </FieldDescription>
              <FieldGroup data-slot="checkbox-group">
                {tags.map((tag) => (
                  <Field
                    key={tag.id}
                    orientation="horizontal"
                    data-invalid={fieldState.invalid}
                  >
                    <Checkbox
                      id={`tag-${tag.id}`}
                      name={field.name}
                      aria-invalid={fieldState.invalid}
                      checked={field.value?.includes(tag.id) || false}
                      onCheckedChange={(checked) => {
                        const currentValue = field.value || []
                        const newValue = checked
                          ? [...currentValue, tag.id]
                          : currentValue.filter((id) => id !== tag.id)
                        field.onChange(newValue)
                      }}
                    />
                    <FieldLabel
                      htmlFor={`tag-${tag.id}`}
                      className="font-normal"
                    >
                      {tag.name}
                    </FieldLabel>
                  </Field>
                ))}
              </FieldGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </FieldSet>
          )}
        />
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Investment'}
        </Button>
      </div>
    </form>
  )
}
