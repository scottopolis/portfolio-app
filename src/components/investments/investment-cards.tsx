import { IconPlus } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvestments } from '@/hooks/use-investments'
import { useCurrentUser } from '@/stores/user-store'
import { AddInvestmentModal } from './add-investment-modal'
import type { InvestmentWithDetails } from '@/lib/types/investments'
import { Badge } from '../ui/badge'

interface InvestmentCardsProps {
  onCreateInvestment?: () => void
}

export function InvestmentCards({ onCreateInvestment }: InvestmentCardsProps) {
  const currentUser = useCurrentUser()
  const {
    data: investments,
    isLoading,
    error,
  } = useInvestments(currentUser?.id || 0)

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
  if (isLoading && !investments) {
    return <InvestmentCardsLoading />
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
    }, 0) || 0

  return (
    <div className="space-y-6">
      {/* Add Investment Button */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-4xl font-bold">{formatCurrency(portfolioTotal)}</p>
        </div>
        <AddInvestmentModal onSuccess={onCreateInvestment} />
      </div>

      {/* Investment Cards */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {investments.map((investment) => (
          <InvestmentCard key={investment.id} investment={investment} />
        ))}
      </div>
    </div>
  )
}

function InvestmentCard({ investment }: { investment: InvestmentWithDetails }) {
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
      to="/investments/$investmentId"
      params={{ investmentId: investment.id.toString() }}
      className="flex h-full"
    >
      <Card className="@container/card hover:shadow-md transition-shadow cursor-pointer flex flex-col w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold tabular-nums truncate">
            {investment.name}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm mt-auto">
          <div className="flex justify-between items-center w-full">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(investment.amount)}
            </span>
          </div>
          {investment.total_distributions > 0 ? (
            <div className="flex justify-between items-center w-full">
              <span className="text-muted-foreground">
                Total Distributions:
              </span>
              <span className="font-medium tabular-nums text-green-600 dark:text-green-400">
                {formatCurrency(investment.total_distributions)}
              </span>
            </div>
          ) : null}
          <div className="pt-1 text-xs text-muted-foreground line-clamp-2">
            <Badge variant="secondary">
              {getInvestmentTypeLabel(investment.investment_type)}
            </Badge>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}

function InvestmentCardsLoading() {
  return (
    <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="@container/card">
          <CardHeader>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-full" />
            <div className="flex justify-end">
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-3">
            <div className="flex justify-between items-center w-full">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex justify-between items-center w-full">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex justify-between items-center w-full">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

function EmptyInvestments({
  onCreateInvestment,
}: {
  onCreateInvestment?: () => void
}) {
  return (
    <div className="flex items-center justify-center p-8">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">No investments yet</CardTitle>
          <CardDescription className="text-sm">
            Start tracking your investments to see your portfolio performance
            and returns.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <AddInvestmentModal onSuccess={onCreateInvestment}>
            <Button className="w-full">
              <IconPlus className="size-4" />
              Create First Investment
            </Button>
          </AddInvestmentModal>
        </CardFooter>
      </Card>
    </div>
  )
}
