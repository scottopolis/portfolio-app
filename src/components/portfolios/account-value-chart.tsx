'use client'

import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { useIsMobile } from '@/hooks/use-mobile'
import { getUserSnapshots } from '@/data/investments'
import {
  Card,
  CardAction,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const chartConfig = {
  totalValue: {
    label: 'Total Value',
    color: 'var(--primary)',
  },
} satisfies ChartConfig

export function AccountValueChart() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState('30d')
  const [chartData, setChartData] = React.useState<
    { date: string; totalValue: number }[]
  >([])
  const [isLoading, setIsLoading] = React.useState(true)
  const isClient = typeof window !== 'undefined'

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange('7d')
    }
  }, [isMobile])

  React.useEffect(() => {
    if (!isClient) return

    async function fetchSnapshots() {
      setIsLoading(true)
      try {
        let days = 30
        if (timeRange === '90d') {
          days = 90
        } else if (timeRange === '7d') {
          days = 7
        }

        const snapshots = await getUserSnapshots({ data: { days } })

        const formattedData = snapshots
          .map((snapshot) => ({
            date: typeof snapshot.snapshot_date === 'string' 
              ? snapshot.snapshot_date 
              : new Date(snapshot.snapshot_date).toISOString().split('T')[0],
            totalValue: Number(snapshot.total_value),
          }))
          .reverse()

        setChartData(formattedData)
      } catch (error) {
        console.error('Failed to fetch snapshots:', error)
        setChartData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSnapshots()
  }, [timeRange, isClient])

  if (!isClient) {
    return null
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Account Value Over Time</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total account value for the last{' '}
            {timeRange === '90d' ? '3 months' : timeRange === '30d' ? '30 days' : '7 days'}
          </span>
          <span className="@[540px]/card:hidden">
            Last {timeRange === '90d' ? '3 mo' : timeRange === '30d' ? '30d' : '7d'}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="flex h-[250px] items-center justify-center">
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center">
            <p className="text-muted-foreground text-sm">No data available</p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillTotalValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-totalValue)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-totalValue)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={['dataMin - 10000', 'dataMax + 10000']}
                tickFormatter={(value) => {
                  return `$${(value / 1000).toFixed(0)}k`
                }}
                hide
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    }}
                    formatter={(value) => {
                      return `$${Number(value).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="totalValue"
                type="monotone"
                fill="url(#fillTotalValue)"
                stroke="var(--color-totalValue)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
