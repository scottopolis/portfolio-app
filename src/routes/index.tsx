import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { DataTable } from '@/components/data-table'
import { SectionCards } from '@/components/section-cards'
import { createFileRoute } from '@tanstack/react-router'
import data from '@/data/data.json'
import { InvestmentCards } from '@/components/investments/investment-cards'
import { InvestmentPieChart } from '@/components/investments/investment-pie-chart'
import { PortfolioAreaChart } from '@/components/investments/portfolio-area-chart'
import { investmentsQueryOptions } from '@/hooks/use-investments'

export const Route = createFileRoute('/')({
  loader: async ({ context }) => {
    // Get the current user ID (default to 1 for now, in real app this would come from auth)
    const userId = 1
    await context.queryClient.ensureQueryData(investmentsQueryOptions(userId))
  },
  component: IndexPage,
})

function IndexPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <InvestmentCards />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <InvestmentPieChart />
            <PortfolioAreaChart />
          </div>
          {/* <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div> */}
          {/* <DataTable data={data} /> */}
        </div>
      </div>
    </div>
  )
}
