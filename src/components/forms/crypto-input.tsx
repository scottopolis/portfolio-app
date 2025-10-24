import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'

const cryptoSchema = z.object({
  symbol: z
    .string()
    .min(1, 'Crypto symbol is required')
    .max(10, 'Crypto symbol must be at most 10 characters')
    .regex(/^[A-Z]+$/, 'Symbol must be uppercase letters only'),
  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .min(0.00000001, 'Amount must be greater than 0'),
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

type CryptoFormData = z.infer<typeof cryptoSchema>

interface CryptoInputProps {
  onSubmit: (data: CryptoFormData) => void
  onCancel?: () => void
  isSubmitting?: boolean
}

export function CryptoInput({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CryptoInputProps) {
  const form = useForm<CryptoFormData>({
    resolver: zodResolver(cryptoSchema),
    defaultValues: {
      symbol: '',
      amount: undefined,
      purchase_price: undefined,
      purchase_date: undefined,
    },
    mode: 'onBlur',
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Crypto Symbol */}
      <Controller
        name="symbol"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Crypto Symbol</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="e.g., BTC, ETH, SOL"
              autoComplete="off"
              onChange={(e) => {
                // Convert to uppercase automatically
                field.onChange(e.target.value.toUpperCase())
              }}
            />
            <FieldDescription>
              The cryptocurrency symbol (e.g., BTC for Bitcoin).
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Amount and Purchase Price - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Controller
          name="amount"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Amount</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="number"
                step="0.00000001"
                min="0"
                aria-invalid={fieldState.invalid}
                placeholder="0.00000000"
                onChange={(e) => {
                  const value = e.target.value
                  field.onChange(value === '' ? undefined : parseFloat(value))
                }}
                value={field.value ?? ''}
              />
              <FieldDescription>
                How much cryptocurrency did you purchase?
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

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
      </div>

      {/* Purchase Date */}
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
              When did you purchase this cryptocurrency?
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Investment'}
        </Button>
      </div>
    </form>
  )
}
