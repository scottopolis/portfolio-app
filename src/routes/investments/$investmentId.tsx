import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useInvestmentById,
  investmentDetailsQueryOptions,
} from '@/hooks/use-investments'
import { EditInvestmentDrawer } from '@/components/investments/edit-investment-drawer'
import { AddDistributionDialog } from '@/components/distributions/add-distribution-dialog'

export const Route = createFileRoute('/investments/$investmentId')({
  loader: async ({ context, params }) => {
    // Get the current user ID (default to 1 for now, in real app this would come from auth)
    const userId = 1
    const investmentId = parseInt(params.investmentId)

    if (investmentId && !isNaN(investmentId)) {
      await context.queryClient.ensureQueryData(
        investmentDetailsQueryOptions(userId, investmentId),
      )
    }
  },
  component: InvestmentDetailPage,
})

function InvestmentDetailPage() {
  const { investmentId } = Route.useParams()
  const {
    data: investment,
    isLoading,
    error,
  } = useInvestmentById(parseInt(investmentId))

  if (isLoading) {
    return <InvestmentDetailSkeleton />
  }

  if (error || !investment) {
    return <InvestmentDetailError />
  }

  const daysSinceStart = Math.floor(
    (new Date().getTime() - new Date(investment.date_started).getTime()) /
      (1000 * 60 * 60 * 24),
  )

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
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between mt-4">
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Investments
          </Button>
        </Link>
        <EditInvestmentDrawer investment={investment} />
      </div>

      {/* Investment Details */}
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl font-bold">
                  {investment.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">
                    {getInvestmentTypeLabel(investment.investment_type)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Description */}
            {investment.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Description
                </h3>
                <p className="text-sm">{investment.description}</p>
              </div>
            )}

            {/* Investment Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Initial Amount
                  </h3>
                  <p className="text-2xl font-semibold">
                    {formatCurrency(investment.initial_amount)}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Date Started
                  </h3>
                  <p className="text-sm">
                    {formatDate(investment.date_started)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {daysSinceStart} days ago
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Total Distributions
                  </h3>
                  <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(investment.total_distributions)}
                  </p>
                </div>
              </div>
            </div>

            {/* Tags */}
            {investment.tags && investment.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {investment.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {investment.categories && investment.categories.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {investment.categories.map((category) => (
                    <Badge key={category.id} variant="outline">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distributions Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Distributions</CardTitle>
              <AddDistributionDialog
                investmentId={investment.id}
                investmentName={investment.name}
              />
            </div>
          </CardHeader>
          <CardContent>
            {investment.distributions && investment.distributions.length > 0 ? (
              <div className="space-y-4">
                {investment.distributions.map((distribution) => (
                  <div
                    key={distribution.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-semibold">
                        {formatCurrency(distribution.amount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(distribution.date)}
                      </div>
                      {distribution.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {distribution.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Distributions:</span>
                    <span className="text-green-600 dark:text-green-400">
                      {formatCurrency(investment.total_distributions)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No distributions yet</p>
                <p className="text-sm mt-1">
                  Add your first distribution to track your returns
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InvestmentDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="h-9 w-40 bg-muted rounded-md animate-pulse" />
      </div>
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted rounded-md animate-pulse" />
            <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2" />
                <div className="h-8 w-32 bg-muted rounded animate-pulse" />
              </div>
              <div>
                <div className="h-4 w-20 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 w-28 bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="h-4 w-28 bg-muted rounded animate-pulse mb-2" />
                <div className="h-8 w-32 bg-muted rounded animate-pulse" />
              </div>
              <div>
                <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2" />
                <div className="h-6 w-28 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function InvestmentDetailError() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Investments
          </Button>
        </Link>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Investment not found</h2>
          <p className="text-muted-foreground mb-4">
            The investment you're looking for doesn't exist or has been deleted.
          </p>
          <Link to="/">
            <Button>Return to Investments</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
