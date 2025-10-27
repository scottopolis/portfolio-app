import { useState, useEffect, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { searchStockSymbols, getStockQuote } from '@/data/stocks'
import type { StockSymbol } from '@/data/stocks'
import { Loader2 } from 'lucide-react'

const stockSchema = z.object({
  ticker: z
    .string()
    .min(1, 'Ticker symbol is required')
    .max(10, 'Ticker symbol must be at most 10 characters')
    .regex(/^[A-Z]+$/, 'Ticker must be uppercase letters only'),
  shares: z
    .number({
      required_error: 'Number of shares is required',
      invalid_type_error: 'Number of shares must be a number',
    })
    .min(0.001, 'Number of shares must be greater than 0'),
  purchase_price: z
    .number({
      required_error: 'Purchase price is required',
      invalid_type_error: 'Purchase price must be a number',
    })
    .min(0.01, 'Purchase price must be greater than 0'),
})

type StockFormData = z.infer<typeof stockSchema>

interface StockInputProps {
  onSubmit: (data: StockFormData) => void
  onCancel?: () => void
  isSubmitting?: boolean
}

export function StockInput({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: StockInputProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<StockSymbol[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isFetchingPrice, setIsFetchingPrice] = useState(false)
  const [priceFetchedFor, setPriceFetchedFor] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const form = useForm<StockFormData>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      ticker: '',
      shares: undefined,
      purchase_price: undefined,
    },
    mode: 'onBlur',
  })

  // Calculate total value
  const shares = form.watch('shares')
  const purchasePrice = form.watch('purchase_price')
  const totalValue = shares && purchasePrice ? shares * purchasePrice : null

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 1) {
        console.log('Searching for:', searchQuery)
        setIsSearching(true)
        try {
          const results = await searchStockSymbols({
            data: { keywords: searchQuery },
          })
          setSuggestions(results)
          setShowSuggestions(true)
          setSelectedIndex(-1)
        } catch (error) {
          console.error('Error searching stocks:', error)
          setSuggestions([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchStockPrice = async (ticker: string) => {
    if (!ticker || priceFetchedFor === ticker) return

    setIsFetchingPrice(true)
    try {
      const quote = await getStockQuote({
        data: { symbol: ticker },
      })

      form.setValue('purchase_price', quote.price, { shouldValidate: true })
      setPriceFetchedFor(ticker)
    } catch (error) {
      console.error('Error fetching stock quote:', error)
    } finally {
      setIsFetchingPrice(false)
    }
  }

  const handleSelectSuggestion = async (symbol: StockSymbol) => {
    form.setValue('ticker', symbol.symbol, { shouldValidate: true })
    setSearchQuery(symbol.symbol)
    setShowSuggestions(false)
    setSuggestions([])
    setPriceFetchedFor(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault()
          handleSelectSuggestion(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Ticker Symbol */}
      <Controller
        name="ticker"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Ticker Symbol</FieldLabel>
            <div className="relative">
              <Input
                {...field}
                ref={inputRef}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="e.g., AAPL, MSFT, TSLA"
                autoComplete="off"
                onChange={(e) => {
                  const value = e.target.value.toUpperCase()
                  field.onChange(value)
                  if (value.trim().length > 1) {
                    setSearchQuery(value)
                  }
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true)
                  }
                }}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-auto"
                >
                  {suggestions.map((symbol, index) => (
                    <button
                      key={symbol.symbol}
                      type="button"
                      className={`w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground border-b last:border-b-0 ${
                        index === selectedIndex
                          ? 'bg-accent text-accent-foreground'
                          : ''
                      }`}
                      onClick={() => handleSelectSuggestion(symbol)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="font-medium">{symbol.symbol}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {symbol.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {symbol.region} • {symbol.currency}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <FieldDescription>
              Start typing to search for stock symbols (e.g., AAPL for Apple).
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Number of Shares and Purchase Price - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Controller
          name="shares"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Number of Shares</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="number"
                step="0.001"
                min="0"
                aria-invalid={fieldState.invalid}
                placeholder="0.000"
                onFocus={() => {
                  const ticker = form.getValues('ticker')
                  if (ticker) {
                    fetchStockPrice(ticker)
                  }
                }}
                onChange={(e) => {
                  const value = e.target.value
                  field.onChange(value === '' ? undefined : parseFloat(value))
                }}
                value={field.value ?? ''}
              />
              <FieldDescription>
                How many shares did you purchase?
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="purchase_price"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Purchase Price</FieldLabel>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  $
                </div>
                <Input
                  {...field}
                  id={field.name}
                  type="number"
                  step="0.01"
                  min="0"
                  aria-invalid={fieldState.invalid}
                  placeholder="0.00"
                  className="pl-8"
                  disabled={isFetchingPrice}
                  onChange={(e) => {
                    const value = e.target.value
                    field.onChange(value === '' ? undefined : parseFloat(value))
                  }}
                  value={field.value ?? ''}
                />
                {isFetchingPrice && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              <FieldDescription>
                {isFetchingPrice
                  ? 'Fetching current price...'
                  : 'Price per share at purchase.'}
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      {/* Total Value Display */}
      {totalValue !== null && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Total Investment Value
            </span>
            <span className="text-2xl font-bold">
              $
              {totalValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {shares} shares × ${purchasePrice?.toFixed(2)}
          </p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Investment'}
        </Button>
      </div>
    </form>
  )
}
