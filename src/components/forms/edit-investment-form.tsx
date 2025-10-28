import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import {
  useCategories,
  useTags,
  useUpdateInvestment,
  useDeleteInvestment,
} from '@/hooks/use-investments'
import { usePortfolios } from '@/hooks/use-portfolios'
import type {
  UpdateInvestmentData,
  InvestmentWithDetails,
} from '@/lib/types/investments'

const investmentSchema = z.object({
  portfolio_id: z.number().min(1, 'Portfolio is required'),
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
  investment_type: z.string(),
  has_distributions: z.boolean(),
  category_ids: z.array(z.number()).optional(),
  tag_ids: z.array(z.number()).optional(),
})

type InvestmentFormData = z.infer<typeof investmentSchema>

interface EditInvestmentFormProps {
  userId: number
  investment: InvestmentWithDetails
  onSuccess?: (investment: any) => void
  onCancel?: () => void
}

export function EditInvestmentForm({
  userId,
  investment,
  onSuccess,
  onCancel,
}: EditInvestmentFormProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { data: categories = [] } = useCategories(userId)
  const { data: tags = [] } = useTags(userId)
  const { data: portfolios = [], isLoading: isLoadingPortfolios } =
    usePortfolios(userId)
  const updateInvestmentMutation = useUpdateInvestment()
  const deleteInvestmentMutation = useDeleteInvestment()

  if (!investment) {
    return null
  }

  const form = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      portfolio_id: investment.portfolio_id,
      name: investment.name,
      description: investment.description || '',
      date_started:
        investment.date_started instanceof Date
          ? investment.date_started.toISOString().split('T')[0]
          : investment.date_started,
      amount:
        typeof investment.amount === 'string'
          ? parseFloat(investment.amount)
          : investment.amount,
      investment_type: investment.investment_type,
      has_distributions: investment.has_distributions ?? true,
      category_ids: investment.categories?.map((c) => c.id) || [],
      tag_ids: investment.tags?.map((t) => t.id) || [],
    },
    mode: 'onBlur',
  })

  async function onSubmit(data: InvestmentFormData) {
    try {
      const result = await updateInvestmentMutation.mutateAsync({
        userId,
        investmentId: investment.id,
        portfolio_id: data.portfolio_id,
        name: data.name,
        description: data.description || '',
        date_started: data.date_started,
        amount: data.amount,
        investment_type: data.investment_type,
        has_distributions: data.has_distributions,
        category_ids: data.category_ids?.length ? data.category_ids : undefined,
        tag_ids: data.tag_ids?.length ? data.tag_ids : undefined,
      })

      onSuccess?.(result)
    } catch (error) {
      console.error('Failed to update investment:', error)
    }
  }

  async function handleDelete() {
    try {
      await deleteInvestmentMutation.mutateAsync({
        userId,
        investmentId: investment.id,
      })

      setShowDeleteDialog(false)
      onSuccess?.({ deleted: true })
    } catch (error) {
      console.error('Failed to delete investment:', error)
    }
  }

  const investmentTypeOptions = [
    { value: 'manual', label: 'Manual' },
    { value: 'stock', label: 'Stock' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'commodities', label: 'Commodities' },
  ]

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

      {/* Portfolio and Investment Type - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Controller
          name="portfolio_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Portfolio</FieldLabel>
              <Select
                name={field.name}
                value={field.value?.toString()}
                onValueChange={(value) => field.onChange(parseInt(value, 10))}
                disabled={isLoadingPortfolios}
              >
                <SelectTrigger
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder="Select portfolio" />
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map((portfolio) => (
                    <SelectItem
                      key={portfolio.id}
                      value={portfolio.id.toString()}
                    >
                      {portfolio.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Which portfolio does this investment belong to?
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="investment_type"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Investment Type</FieldLabel>
              <Select
                name={field.name}
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder="Select investment type" />
                </SelectTrigger>
                <SelectContent>
                  {investmentTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                What type of investment is this?
              </FieldDescription>
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
              <FieldLabel htmlFor={field.name}>Initial Amount</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="number"
                step="0.01"
                min="0"
                aria-invalid={fieldState.invalid}
                placeholder="0.00"
                onChange={(e) => {
                  const value = e.target.value
                  field.onChange(value === '' ? undefined : parseFloat(value))
                }}
                value={field.value ?? ''}
              />
              <FieldDescription>
                How much did you initially invest?
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

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
      <div className="flex justify-between items-center gap-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowDeleteDialog(true)}
          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          Delete Investment
        </Button>
        <div className="flex gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={updateInvestmentMutation.isPending}>
            {updateInvestmentMutation.isPending
              ? 'Updating...'
              : 'Update Investment'}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Investment?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{investment.name}"? This action
              cannot be undone. All associated distributions and history will be
              permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteInvestmentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteInvestmentMutation.isPending}
            >
              {deleteInvestmentMutation.isPending
                ? 'Deleting...'
                : 'Delete Investment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
