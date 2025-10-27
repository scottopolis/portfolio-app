import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { useUpdateUser } from '@/hooks/use-user'
import type { User, UpdateUserData } from '@/lib/types/investments'

const userSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be at most 255 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be at most 255 characters'),
})

type UserFormData = z.infer<typeof userSchema>

interface EditUserFormProps {
  user: User
  onSuccess?: (user: any) => void
  onCancel?: () => void
}

export function EditUserForm({ user, onSuccess, onCancel }: EditUserFormProps) {
  const updateUserMutation = useUpdateUser()

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
    },
    mode: 'onBlur',
  })

  async function onSubmit(data: UserFormData) {
    try {
      const userData: UpdateUserData = {
        name: data.name,
        email: data.email,
      }

      const result = await updateUserMutation.mutateAsync(userData)

      onSuccess?.(result)
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Name</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="e.g., John Doe"
              autoComplete="name"
            />
            <FieldDescription>Your full name.</FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Email */}
      <Controller
        name="email"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="email"
              aria-invalid={fieldState.invalid}
              placeholder="e.g., john@example.com"
              autoComplete="email"
            />
            <FieldDescription>Your email address.</FieldDescription>
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
        <Button type="submit" disabled={updateUserMutation.isPending}>
          {updateUserMutation.isPending ? 'Updating...' : 'Update Account'}
        </Button>
      </div>
    </form>
  )
}
