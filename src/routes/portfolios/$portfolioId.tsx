import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Plus, Folder } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePortfolioById } from '@/hooks/use-portfolios'
import { useCurrentUser } from '@/stores/user-store'
import { AddInvestmentModal } from '@/components/investments/add-investment-modal'

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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Investments</h2>
          <AddInvestmentModal
            portfolioId={parseInt(portfolioId)}
            onSuccess={() => {}}
          />
        </div>

        {portfolio.investments.length > 0 ? (
          <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            {portfolio.investments.map((investment) => (
              <InvestmentCard key={investment.id} investment={investment} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mx-auto p-3 rounded-full bg-muted/50 w-fit mb-4">
                <Plus className="size-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No investments yet</h3>
              <p className="text-muted-foreground mb-4 text-center max-w-sm">
                Start building this portfolio by adding your first investment.
              </p>
              <AddInvestmentModal
                portfolioId={parseInt(portfolioId)}
                onSuccess={() => {}}
              >
                <Button>
                  <Plus className="size-4" />
                  Add Investment
                </Button>
              </AddInvestmentModal>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function InvestmentCard({ investment }: { investment: any }) {
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
        <CardContent className="flex-col items-start gap-1.5 text-sm mt-auto">
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
        </CardContent>
      </Card>
    </Link>
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
