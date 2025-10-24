import { IconPlus, IconFolder } from '@tabler/icons-react'
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
import { usePortfolios } from '@/hooks/use-portfolios'
import { useCurrentUser } from '@/stores/user-store'
import { AddPortfolioModal } from './add-portfolio-modal'
import type { Portfolio } from '@/lib/types/investments'
import { Badge } from '../ui/badge'

interface PortfolioCardsProps {
  onCreatePortfolio?: () => void
}

export function PortfolioCards({ onCreatePortfolio }: PortfolioCardsProps) {
  const currentUser = useCurrentUser()

  const {
    data: portfolios,
    isLoading,
    error,
  } = usePortfolios(currentUser?.id || 1) // Use user ID 1 (John Doe) as fallback

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Please select a user to view portfolios.
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
            Failed to load portfolios. Please try again.
          </p>
        </div>
      </div>
    )
  }

  // Show empty state if no portfolios (even if loading initially)
  if (!isLoading && (!portfolios || portfolios.length === 0)) {
    return <EmptyPortfolios onCreatePortfolio={onCreatePortfolio} />
  }

  // Show loading state only if we don't have data yet
  if (isLoading) {
    return <PortfolioCardsLoading />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const totalPortfolioValue =
    portfolios?.reduce((total, portfolio) => {
      const invested = Number(portfolio.total_invested) || 0
      const distributions = Number(portfolio.total_distributions) || 0
      return total + invested + distributions
    }, 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {formatCurrency(totalPortfolioValue)}
          </h1>
          <p className="text-muted-foreground">Total value</p>
        </div>
        <AddPortfolioModal onSuccess={onCreatePortfolio} />
      </div>

      {/* Portfolio Cards */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
        {portfolios?.map((portfolio) => (
          <PortfolioCard key={portfolio.id} portfolio={portfolio} />
        ))}
      </div>
    </div>
  )
}

function PortfolioCard({
  portfolio,
}: {
  portfolio: Portfolio & {
    investment_count: number
    total_invested: number
    total_distributions: number
  }
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const totalValue =
    Number(portfolio.total_invested) + Number(portfolio.total_distributions)

  return (
    <Link
      to="/portfolios/$portfolioId"
      params={{ portfolioId: portfolio.id.toString() }}
      className="flex h-full"
    >
      <Card className="@container/card hover:shadow-md transition-shadow cursor-pointer flex flex-col w-full">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <IconFolder className="size-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold truncate">
                {portfolio.name}
              </CardTitle>
              {portfolio.description && (
                <CardDescription className="text-sm mt-1 line-clamp-2">
                  {portfolio.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-2 text-sm mt-auto">
          <div className="flex justify-between items-center w-full">
            <span className="text-muted-foreground">Investments:</span>
            <Badge variant="secondary">{portfolio.investment_count}</Badge>
          </div>
          <div className="flex justify-between items-center w-full">
            <span className="text-muted-foreground">Total Value:</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(totalValue)}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}

function PortfolioCardsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <div className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-3">
              <div className="flex justify-between items-center w-full">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
              <div className="flex justify-between items-center w-full">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between items-center w-full">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

function EmptyPortfolios({
  onCreatePortfolio,
}: {
  onCreatePortfolio?: () => void
}) {
  return (
    <div className="flex items-center justify-center p-8">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-4">
            <IconFolder className="size-8 text-primary" />
          </div>
          <CardTitle className="text-xl">No portfolios yet</CardTitle>
          <CardDescription className="text-sm">
            Create your first portfolio to start organizing and tracking your
            investments across different strategies or asset classes.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <AddPortfolioModal onSuccess={onCreatePortfolio}>
            <Button className="w-full">
              <IconPlus className="size-4" />
              Create First Portfolio
            </Button>
          </AddPortfolioModal>
        </CardFooter>
      </Card>
    </div>
  )
}
