import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { DataTable } from '@/components/data-table'
import { SectionCards } from '@/components/section-cards'
import { createFileRoute } from '@tanstack/react-router'
import data from '@/data/data.json'
import { PortfolioCards } from '@/components/portfolios/portfolio-cards'
import { InvestmentPieChart } from '@/components/investments/investment-pie-chart'
import { PortfolioAreaChart } from '@/components/investments/portfolio-area-chart'
import { useCurrentUser } from '@/stores/user-store'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <PortfolioCards />
        </div>
      </div>
    </div>
  )
}
