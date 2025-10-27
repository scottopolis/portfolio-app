'use client'

import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { useIsMobile } from '@/hooks/use-mobile'
import { getUserSnapshots } from '@/data/investments'
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
            date:
              typeof snapshot.snapshot_date === 'string'
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-1">
        <div>
          <h2 className="text-lg font-semibold">Account Value</h2>
          <p className="text-sm text-muted-foreground">
            Last{' '}
            {timeRange === '90d'
              ? '3 months'
              : timeRange === '30d'
                ? '30 days'
                : '7 days'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden md:flex"
          >
            <ToggleGroupItem value="90d">3 mo</ToggleGroupItem>
            <ToggleGroupItem value="30d">30d</ToggleGroupItem>
            <ToggleGroupItem value="7d">7d</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-32 md:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
    </div>
  )
}
