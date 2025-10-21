'use client'

import { useMemo } from 'react'
import { Pie, PieChart } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { ChartConfig } from '@/components/ui/chart'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { InvestmentWithDetails } from '@/lib/types/investments'
import { useInvestments } from '@/hooks/use-investments'
import { useCurrentUser } from '@/stores/user-store'

interface InvestmentPieChartProps {
  title?: string
  description?: string
}

interface ChartDataItem {
  category: string
  value: number
  percentage: number
  fill: string
}

const chartConfig = {
  value: {
    label: 'Value',
  },
  stocks: {
    label: 'Stocks',
    color: 'var(--chart-1)',
  },
  real_estate: {
    label: 'Real Estate',
    color: 'var(--chart-2)',
  },
  other: {
    label: 'Other',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig

export function InvestmentPieChart({
  title = 'Portfolio Distribution',
  description = 'Investment allocation by category',
}: InvestmentPieChartProps) {
  const currentUser = useCurrentUser()
  const {
    data: investments,
    isLoading,
    error,
  } = useInvestments(currentUser?.id || 0)

  const chartData = useMemo(() => {
    if (!investments || investments.length === 0) return []

    // Group investments by investment_type and calculate totals
    const categoryTotals = investments.reduce(
      (acc, investment) => {
        const category = investment.investment_type
        if (!acc[category]) {
          acc[category] = 0
        }
        acc[category] +=
          parseFloat(investment.amount) +
          parseFloat(investment.total_distributions)
        return acc
      },
      {} as Record<string, number>,
    )

    // Calculate total portfolio value
    const totalValue = Object.values(categoryTotals).reduce(
      (sum, value) => sum + value,
      0,
    )

    // Transform into chart data format
    const data: ChartDataItem[] = Object.entries(categoryTotals).map(
      ([category, value]) => ({
        category,
        value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
        fill:
          chartConfig[category as keyof typeof chartConfig]?.color ||
          'var(--chart-4)',
      }),
    )
    return data
  }, [investments])

  if (isLoading) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Loading chart data...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Error loading investment data
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!investments || chartData.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No investment data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie data={chartData} dataKey="value" nameKey="category" />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
