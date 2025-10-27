import * as React from 'react'
import { PlusIcon, TrendingUpIcon, DollarSignIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '@/components/ui/item'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useInvestmentsByPortfolio } from '@/hooks/use-investments'
import { useCurrentUser } from '@/stores/user-store'
import { AddInvestmentModal } from './add-investment-modal'
import type { InvestmentWithDetails } from '@/lib/types/investments'
import { Badge } from '../ui/badge'

interface InvestmentListProps {
  onCreateInvestment?: () => void
  portfolioId: string
}

export function InvestmentList({
  onCreateInvestment,
  portfolioId,
}: InvestmentListProps) {
  const currentUser = useCurrentUser()
  const {
    data: investments,
    isLoading,
    error,
  } = useInvestmentsByPortfolio(currentUser?.id || 0, parseInt(portfolioId))

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Please select a user to view investments.
          </p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Failed to load investments. Please try again.
          </p>
        </div>
      </div>
    )
  }

  // Show empty state if no investments (even if loading initially)
  if (!isLoading && (!investments || investments.length === 0)) {
    return <EmptyInvestments onCreateInvestment={onCreateInvestment} />
  }

  // Show loading state only if we don't have data yet
  if (isLoading && investments === undefined) {
    return <InvestmentListLoading />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const portfolioTotal =
    investments?.reduce((total, investment) => {
      const initialAmount = Number(investment.amount) || 0
      const distributions = Number(investment.total_distributions) || 0
      return total + initialAmount + distributions
    }, 0) ?? 0

  return (
    <div className="space-y-6">
      {/* Portfolio Total and Add Investment Button */}
      <div className="flex justify-between items-center">
        <div></div>
        <AddInvestmentModal onSuccess={onCreateInvestment} />
      </div>

      {/* Investment Items */}
      <ItemGroup>
        {investments?.map((investment, index) => (
          <React.Fragment key={investment.id}>
            <InvestmentItem investment={investment} portfolioId={portfolioId} />
            {index !== investments.length - 1 && <ItemSeparator />}
          </React.Fragment>
        ))}
      </ItemGroup>
    </div>
  )
}

function InvestmentItem({
  investment,
  portfolioId,
}: {
  investment: InvestmentWithDetails
  portfolioId: string
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getInvestmentTypeLabel = (type: string) => {
    switch (type) {
      case 'stocks':
        return 'Stocks'
      case 'real_estate':
        return 'Real Estate'
      case 'other':
        return 'Other'
      default:
        return type
    }
  }

  return (
    <Link
      to="/portfolios/$portfolioId/investments/$investmentId"
      params={{ portfolioId, investmentId: investment.id.toString() }}
    >
      <Item>
        <ItemMedia>
          <Avatar>
            <AvatarFallback className="bg-primary/10">
              <DollarSignIcon className="size-5 text-primary" />
            </AvatarFallback>
          </Avatar>
        </ItemMedia>
        <ItemContent className="gap-1">
          <ItemTitle>{investment.name}</ItemTitle>
          <ItemDescription>
            {getInvestmentTypeLabel(investment.investment_type)}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <div className="font-medium tabular-nums">
            {formatCurrency(investment.amount)}
          </div>
        </ItemActions>
      </Item>
    </Link>
  )
}

function InvestmentListLoading() {
  return (
    <ItemGroup>
      {Array.from({ length: 4 }).map((_, i) => (
        <React.Fragment key={i}>
          <Item>
            <ItemMedia>
              <Skeleton className="h-10 w-10 rounded-full" />
            </ItemMedia>
            <ItemContent className="gap-1">
              <Skeleton className="h-5 w-32" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-3 w-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            </ItemContent>
            <ItemActions>
              <div className="text-right">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16 mt-1" />
              </div>
            </ItemActions>
          </Item>
          {i !== 3 && <ItemSeparator />}
        </React.Fragment>
      ))}
    </ItemGroup>
  )
}

function EmptyInvestments({
  onCreateInvestment,
}: {
  onCreateInvestment?: () => void
}) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
          <DollarSignIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No investments yet</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Start tracking your investments to see your portfolio performance and
          returns.
        </p>
        <AddInvestmentModal onSuccess={onCreateInvestment}>
          <Button>
            <PlusIcon className="h-4 w-4" />
            Create First Investment
          </Button>
        </AddInvestmentModal>
      </div>
    </div>
  )
}
