import { usePortfolios } from '@/hooks/use-portfolios'
import { useCurrentUser, useUserStore } from '@/stores/user-store'

export function PortfolioTotalValue() {
  const isClient = typeof window !== 'undefined'
  const currentUser = useCurrentUser()
  const isInitialized = useUserStore((state) => state.isInitialized)

  const { data: portfolios } = usePortfolios(
    currentUser?.id || 1,
    isInitialized,
  )

  if (!isClient || !currentUser) {
    return null
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
    <div>
      <h1 className="text-3xl font-bold">
        {formatCurrency(totalPortfolioValue)}
      </h1>
      <p className="text-muted-foreground">Total value</p>
    </div>
  )
}
