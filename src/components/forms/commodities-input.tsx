import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'

const commoditiesSchema = z.object({
  commodity_type: z.string().min(1, 'Commodity type is required'),
  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .min(0.001, 'Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  purchase_price: z
    .number({
      required_error: 'Purchase price is required',
      invalid_type_error: 'Purchase price must be a number',
    })
    .min(0.01, 'Purchase price must be greater than 0'),
  purchase_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date')
    .optional()
    .nullable(),
})

type CommoditiesFormData = z.infer<typeof commoditiesSchema>

interface CommoditiesInputProps {
  onSubmit: (data: CommoditiesFormData) => void
  onCancel?: () => void
  isSubmitting?: boolean
}

const commodityTypes = [
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'oil', label: 'Oil' },
  { value: 'natural_gas', label: 'Natural Gas' },
  { value: 'copper', label: 'Copper' },
  { value: 'platinum', label: 'Platinum' },
  { value: 'wheat', label: 'Wheat' },
  { value: 'corn', label: 'Corn' },
  { value: 'other', label: 'Other' },
]

const units = [
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'lb', label: 'Pounds (lb)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'barrel', label: 'Barrels' },
  { value: 'bushel', label: 'Bushels' },
  { value: 'ton', label: 'Tons' },
  { value: 'contract', label: 'Contracts' },
]

export function CommoditiesInput({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CommoditiesInputProps) {
  const form = useForm<CommoditiesFormData>({
    resolver: zodResolver(commoditiesSchema),
    defaultValues: {
      commodity_type: '',
      quantity: undefined,
      unit: '',
      purchase_price: undefined,
      purchase_date: undefined,
    },
    mode: 'onBlur',
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Commodity Type */}
      <Controller
        name="commodity_type"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Commodity Type</FieldLabel>
            <Select
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger id={field.name} aria-invalid={fieldState.invalid}>
                <SelectValue placeholder="Select commodity type" />
              </SelectTrigger>
              <SelectContent>
                {commodityTypes.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>What type of commodity is this?</FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Quantity and Unit - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Controller
          name="quantity"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Quantity</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="number"
                step="0.001"
                min="0"
                aria-invalid={fieldState.invalid}
                placeholder="0.000"
                onChange={(e) => {
                  const value = e.target.value
                  field.onChange(value === '' ? undefined : parseFloat(value))
                }}
                value={field.value ?? ''}
              />
              <FieldDescription>How much did you purchase?</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="unit"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Unit</FieldLabel>
              <Select
                name={field.name}
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>Unit of measurement.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      {/* Purchase Price and Date - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Controller
          name="purchase_price"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Purchase Price</FieldLabel>
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
              <FieldDescription>Price per unit at purchase.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="purchase_date"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Purchase Date</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="date"
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                When did you purchase this commodity?
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

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
