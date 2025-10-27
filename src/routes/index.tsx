import { createFileRoute } from '@tanstack/react-router'
import { PortfolioList } from '@/components/portfolios/portfolio-list'
import { PortfolioTotalValue } from '@/components/portfolios/portfolio-total-value'
import { AccountValueChart } from '@/components/portfolios/account-value-chart'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <PortfolioTotalValue />
          <AccountValueChart />
          <PortfolioList />
        </div>
      </div>
    </div>
  )
}
