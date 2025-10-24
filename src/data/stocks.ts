import { createServerFn } from '@tanstack/react-start'

// Alpha Vantage API Response Types
export interface AlphaVantageSearchMatch {
  '1. symbol': string
  '2. name': string
  '3. type': string
  '4. region': string
  '5. marketOpen': string
  '6. marketClose': string
  '7. timezone': string
  '8. currency': string
  '9. matchScore': string
}

export interface AlphaVantageSearchResponse {
  bestMatches: AlphaVantageSearchMatch[]
}

export interface StockSymbol {
  symbol: string
  name: string
  type: string
  region: string
  currency: string
  matchScore: number
}

export interface AlphaVantageQuoteResponse {
  'Global Quote': {
    '01. symbol': string
    '02. open': string
    '03. high': string
    '04. low': string
    '05. price': string
    '06. volume': string
    '07. latest trading day': string
    '08. previous close': string
    '09. change': string
    '10. change percent': string
  }
}

export interface StockQuote {
  symbol: string
  price: number
  open: number
  high: number
  low: number
  volume: number
  latestTradingDay: string
  previousClose: number
  change: number
  changePercent: string
}

export const searchStockSymbols = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { keywords: string }) => data)
  .handler(async ({ data }): Promise<StockSymbol[]> => {
    const { keywords } = data

    if (!keywords || keywords.trim().length === 0) {
      return []
    }

    const apiKey = process.env.AV_API_KEY
    if (!apiKey) {
      console.error('Missing AV_API_KEY environment variable')
      throw new Error('Alpha Vantage API key not configured')
    }

    try {
      const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(keywords)}&apikey=${apiKey}`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.statusText}`)
      }

      const result = (await response.json()) as AlphaVantageSearchResponse

      // Check for API error responses
      if (!result.bestMatches) {
        console.error('Alpha Vantage API error:', result)
        return []
      }

      // Transform the API response to our interface
      const symbols: StockSymbol[] = result.bestMatches.map((match) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'],
        region: match['4. region'],
        currency: match['8. currency'],
        matchScore: parseFloat(match['9. matchScore']),
      }))

      return symbols
    } catch (error) {
      console.error('Error fetching stock symbols:', error)
      throw error
    }
  })

export const getStockQuote = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { symbol: string }) => data)
  .handler(async ({ data }): Promise<StockQuote> => {
    const { symbol } = data

    if (!symbol || symbol.trim().length === 0) {
      throw new Error('Stock symbol is required')
    }

    const apiKey = process.env.AV_API_KEY
    if (!apiKey) {
      console.error('Missing AV_API_KEY environment variable')
      throw new Error('Alpha Vantage API key not configured')
    }

    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.statusText}`)
      }

      const result = (await response.json()) as AlphaVantageQuoteResponse

      // Check for API error responses
      if (!result['Global Quote'] || !result['Global Quote']['01. symbol']) {
        console.error('Alpha Vantage API error:', result)
        throw new Error('Invalid stock symbol or no data available')
      }

      const quote = result['Global Quote']

      // Transform the API response to our interface
      const stockQuote: StockQuote = {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        open: parseFloat(quote['02. open']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        volume: parseInt(quote['06. volume']),
        latestTradingDay: quote['07. latest trading day'],
        previousClose: parseFloat(quote['08. previous close']),
        change: parseFloat(quote['09. change']),
        changePercent: quote['10. change percent'],
      }

      return stockQuote
    } catch (error) {
      console.error('Error fetching stock quote:', error)
      throw error
    }
  })
