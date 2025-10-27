import * as React from 'react'
import { TrendingUpIcon } from 'lucide-react'

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Distribution {
  id: number
  amount: number
  date: string
  description?: string | null
}

interface DistributionsListProps {
  distributions: Distribution[]
  totalDistributions: number
}

export function DistributionsList({
  distributions,
  totalDistributions,
}: DistributionsListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-4">
      <ItemGroup>
        {distributions.map((distribution) => (
          <Item key={distribution.id}>
            <ItemMedia>
              <Avatar>
                <AvatarFallback className="bg-green-500/10">
                  <TrendingUpIcon className="size-5 " />
                </AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent className="gap-1">
              <ItemTitle>{formatDate(distribution.date)}</ItemTitle>
              {distribution.description && (
                <ItemDescription>{distribution.description}</ItemDescription>
              )}
            </ItemContent>
            <ItemActions>
              <div className="font-medium tabular-nums ">
                {formatCurrency(distribution.amount)}
              </div>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
    </div>
  )
}
