import * as React from 'react'

import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const ItemGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'divide-y divide-border rounded-lg border bg-card text-card-foreground shadow-xs',
      className,
    )}
    {...props}
  />
))
ItemGroup.displayName = 'ItemGroup'

const Item = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center gap-3 px-4 py-3 first:rounded-t-lg last:rounded-b-lg',
      className,
    )}
    {...props}
  />
))
Item.displayName = 'Item'

const ItemMedia = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex shrink-0', className)} {...props} />
))
ItemMedia.displayName = 'ItemMedia'

const ItemContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('min-w-0 flex-1', className)} {...props} />
))
ItemContent.displayName = 'ItemContent'

const ItemTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm font-medium leading-none', className)}
    {...props}
  />
))
ItemTitle.displayName = 'ItemTitle'

const ItemDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
ItemDescription.displayName = 'ItemDescription'

const ItemActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex shrink-0 items-center', className)}
    {...props}
  />
))
ItemActions.displayName = 'ItemActions'

const ItemSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentPropsWithoutRef<typeof Separator>
>(({ className, ...props }, ref) => (
  <Separator ref={ref} className={cn('mx-0', className)} {...props} />
))
ItemSeparator.displayName = 'ItemSeparator'

export {
  ItemGroup,
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemSeparator,
}
