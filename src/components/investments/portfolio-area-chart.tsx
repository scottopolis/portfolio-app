'use client'

import { useMemo } from 'react'
import { TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type {
  ChartConfig} from '@/components/ui/chart';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { useInvestments } from '@/hooks/use-investments'
import { useCurrentUser } from '@/stores/user-store'

const chartConfig = {
  portfolio: {
    label: 'Portfolio Value',
    color: 'var(--primary)',
  },
} satisfies ChartConfig

export function PortfolioAreaChart() {
  const currentUser = useCurrentUser()
  const {
    data: investments,
    isLoading,
    error,
  } = useInvestments(currentUser?.id || 0)

  const chartData = useMemo(() => {
    if (!investments || investments.length === 0) return []

    // Create a timeline of investments by date
    const timeline: { [key: string]: number } = {}

    investments.forEach((investment) => {
      const date = investment.date_started
      if (!timeline[date]) {
        timeline[date] = 0
      }
      timeline[date] += parseFloat(investment.initial_amount.toString())
    })

    // Sort dates and create cumulative portfolio values
    const sortedDates = Object.keys(timeline).sort()
    let cumulativeValue = 0

    return sortedDates.map((date) => {
      cumulativeValue += timeline[date]
      return {
        date: new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        portfolio: cumulativeValue,
      }
    })
  }, [investments])

  const growthPercentage = useMemo(() => {
    if (chartData.length < 2) return 0
    const firstValue = chartData[0].portfolio
    const lastValue = chartData[chartData.length - 1].portfolio
    return (((lastValue - firstValue) / firstValue) * 100).toFixed(1)
  }, [chartData])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Growth</CardTitle>
          <CardDescription>
            Initial investment amounts over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Loading chart data...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Growth</CardTitle>
          <CardDescription>
            Initial investment amounts over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Error loading investment data
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!investments || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Growth</CardTitle>
          <CardDescription>
            Initial investment amounts over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No investment data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Growth</CardTitle>
        <CardDescription>
          Cumulative initial investment amounts over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Area
              dataKey="portfolio"
              type="stepAfter"
              fill="var(--color-portfolio)"
              fillOpacity={0.4}
              stroke="var(--color-portfolio)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              Portfolio growth: {growthPercentage}%{' '}
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Based on initial investment amounts
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
