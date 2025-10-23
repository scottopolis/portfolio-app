import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Folder } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePortfolioById } from '@/hooks/use-portfolios'
import { useCurrentUser } from '@/stores/user-store'
import { InvestmentList } from '@/components/investments/investment-list'

export const Route = createFileRoute('/portfolios/$portfolioId')({
  component: PortfolioDetailPage,
})

function PortfolioDetailPage() {
  const { portfolioId } = Route.useParams()
  const currentUser = useCurrentUser()
  const {
    data: portfolio,
    isLoading,
    error,
  } = usePortfolioById(currentUser?.id || 0, parseInt(portfolioId))

  if (!currentUser) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4 mt-4">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Portfolios
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">
            Please select a user to view portfolios.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <PortfolioDetailSkeleton />
  }

  if (error || !portfolio) {
    return <PortfolioDetailError />
  }

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

  const totalInvested = portfolio.investments.reduce(
    (total, inv) => total + Number(inv.amount),
    0,
  )
  const totalDistributions = portfolio.investments.reduce(
    (total, inv) => total + Number(inv.total_distributions),
    0,
  )
  const totalValue = totalInvested + totalDistributions

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between mt-4">
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Portfolios
          </Button>
        </Link>
      </div>

      {/* Portfolio Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Folder className="size-8 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold">
                {portfolio.name}
              </CardTitle>
              {portfolio.description && (
                <p className="text-muted-foreground mt-2">
                  {portfolio.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span>Created {formatDate(portfolio.created_at)}</span>
                <Badge variant="outline">
                  {portfolio.investments.length} investments
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Total Invested
              </h3>
              <p className="text-2xl font-semibold">
                {formatCurrency(totalInvested)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Total Distributions
              </h3>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(totalDistributions)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Portfolio Value
              </h3>
              <p className="text-2xl font-semibold">
                {formatCurrency(totalValue)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investments Section */}
      <div className="space-y-4">
        <InvestmentList portfolioId={portfolioId} />
      </div>
    </div>
  )
}

function PortfolioDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-40" />
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Skeleton className="h-14 w-14 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full max-w-md" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PortfolioDetailError() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Portfolios
          </Button>
        </Link>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Portfolio not found</h2>
          <p className="text-muted-foreground mb-4">
            The portfolio you're looking for doesn't exist or has been deleted.
          </p>
          <Link to="/">
            <Button>Return to Portfolios</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
