import * as React from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { usePortfolios } from '@/hooks/use-portfolios'
import { useCurrentUser, useUserStore } from '@/stores/user-store'
import { AddPortfolioModal } from './add-portfolio-modal'
import { updateUserStockPrices } from '@/data/investments'
import type { Portfolio } from '@/lib/types/investments'
import { Badge } from '../ui/badge'

interface PortfolioListProps {
  onCreatePortfolio?: () => void
}

export function PortfolioList({ onCreatePortfolio }: PortfolioListProps) {
  const isClient = typeof window !== 'undefined'
  const currentUser = useCurrentUser()
  const isInitialized = useUserStore((state) => state.isInitialized)

  const {
    data: portfolios,
    isLoading,
    error,
  } = usePortfolios(currentUser?.id || 1, isInitialized)

  // Prevent SSR rendering - only render on client
  if (!isClient) {
    return null
  }

  // Update stock prices for user when component mounts
  React.useEffect(() => {
    if (currentUser?.id && portfolios && portfolios.length > 0) {
      // Fire-and-forget: update stock prices in the background
      updateUserStockPrices({ data: { userId: currentUser.id } }).catch(
        (err) => {
          console.error(`Failed to update stock prices:`, err)
        },
      )
    }
  }, [currentUser?.id, portfolios?.length]) // Only re-run if user or number of portfolios changes

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
    return <PortfolioListLoading />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <AddPortfolioModal onSuccess={onCreatePortfolio} />
      </div>
      <ItemGroup>
        {portfolios?.map((portfolio, index) => {
          const totalValue =
            Number(portfolio.total_invested) +
            Number(portfolio.total_distributions)
          return (
            <React.Fragment key={portfolio.id}>
              <Link
                to="/portfolios/$portfolioId"
                params={{ portfolioId: portfolio.id.toString() }}
              >
                <Item>
                  <ItemMedia>
                    <Avatar>
                      <AvatarFallback className="bg-primary/10">
                        <IconFolder className="size-5 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent className="gap-1">
                    <ItemTitle>{portfolio.name}</ItemTitle>
                    <ItemDescription>
                      {portfolio.investment_count}{' '}
                      {portfolio.investment_count === 1
                        ? 'investment'
                        : 'investments'}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <div className="font-medium tabular-nums">
                      {formatCurrency(totalValue)}
                    </div>
                  </ItemActions>
                </Item>
              </Link>
              {index !== portfolios.length - 1 && <ItemSeparator />}
            </React.Fragment>
          )
        })}
      </ItemGroup>
    </div>
  )
}

function PortfolioListLoading() {
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
