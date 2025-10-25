# AGENTS.md - Finance App Project Guide

## TODO for Next Session

- None - all server functions successfully using manual auth pattern

## Project Overview

A personal finance application for tracking investments built with modern React stack, focusing on portfolio management and visualization. Users can organize their investments into multiple portfolios and track performance across different investment strategies.

## Technology Stack

- **Frontend**: TanStack Start (React 19, TanStack Router)
- **Database**: Neon (PostgreSQL serverless)
- **Styling**: TailwindCSS v4 + shadcn/ui components
- **Charts**: Recharts
- **State Management**: Zustand + TanStack Query
- **Form Handling**: React Hook Form + Zod validation
- **Build Tool**: Vite
- **Deployment**: Cloudflare Workers (wrangler)

## Key Commands

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run check` - Format with Prettier and fix ESLint issues
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm test` - Run Vitest tests
- `npm run lint` - ESLint check
- `npm run format` - Prettier formatting

## Database Architecture

### Connection & Setup

- **Database File**: `src/db.ts` - Neon client wrapper with RLS support
  - `getClient()` - Returns Neon client
  - `setSessionUser(userId)` - Sets session user for Row-Level Security (MUST be called before queries)
- **Plugin**: `neon-vite-plugin.ts` - Vite plugin for Postgres integration with seeding
- **Schema Files**:
  - `db/investments-schema.sql` - Main investment tracking schema
  - `db/security-and-snapshots.sql` - Security hardening and snapshot tables
  - `db/init.sql` - Legacy todos schema (unused)
- **Auto-initialization**: Schema is created automatically via `initializeSchema()` in `src/data/investments.ts`
- **Row-Level Security**: All tables protected by RLS policies enforcing data isolation per user

### Schema Reset Behavior

- **Development Only**: `initializeSchema()` is gated to `NODE_ENV !== 'production'`
- **Portfolio Migration**: Automatically detects existing investments and creates default portfolios
- **Data Preservation**: Existing investments are moved to default "My Portfolio" without data loss
- **Migration Path**: Schema was migrated from direct user→investment to user→portfolio→investment structure
- **Production Note**: Schema initialization blocked in production to prevent mock data creation

### Database Schema Structure

```
users (id, email, password_hash, name, timestamps)
├── portfolios (id, user_id, name, description, timestamps)
│   ├── portfolio_daily_snapshots (portfolio_id, snapshot_date, total_value, total_invested, total_distributions, investment_count)
│   └── investments (id, portfolio_id, user_id*, name, description, date_started, amount, investment_type,
│       │            stock_symbol, stock_quantity, current_stock_price, stock_price_updated_at, timestamps)
│       ├── distributions (id, investment_id, date, amount, description, created_at)
│       ├── investment_value_history (investment_id, snapshot_date, stock_price, stock_quantity, value, total_distributions)
│       ├── investment_categories (investment_id, category_id) [junction table]
│       └── investment_tags (investment_id, tag_id) [junction table]
├── user_daily_snapshots (user_id, snapshot_date, total_value, total_invested, total_distributions, portfolio_count, investment_count)
├── categories (id, user_id, name, created_at)
├── tags (id, user_id, name, created_at)
└── investment_types (id, user_id, name, created_at) [user-specific custom investment types]

* user_id in investments is legacy field for migration, will be removed after full migration
```

### Historical Tracking

- **Snapshot Tables**: Track portfolio and user values over time
  - `portfolio_daily_snapshots` - Daily snapshots of each portfolio's total value, investments, distributions
  - `user_daily_snapshots` - Daily aggregate snapshots across all user portfolios
  - `investment_value_history` - Optional per-investment value tracking
- **Snapshot Functions**: Computed via PostgreSQL functions in `db/security-and-snapshots.sql`
  - `save_portfolio_snapshot(portfolio_id, date)` - Save portfolio snapshot for specific date
  - `save_user_snapshot(user_id, date)` - Save user aggregate snapshot
  - `save_all_snapshots(date)` - Save all portfolio and user snapshots (cron job)
- **Server Functions**: Exposed via `src/data/investments.ts`
  - `getPortfolioSnapshots()` - Fetch historical data for charts
  - `getUserSnapshots()` - Fetch user aggregate history
  - `savePortfolioSnapshot()` - Trigger snapshot save
  - `saveUserSnapshot()` - Trigger user snapshot save
  - `saveAllSnapshots()` - Admin/cron endpoint

### Investment Types

- **Storage**: VARCHAR(100) in investments table allows any custom investment type string
- **Custom Types**: User-specific custom investment types are stored in `investment_types` table
- **Persistence**: Custom investment types persist across sessions and are scoped per user
- **Default Types**: Built-in types include 'stocks', 'real_estate', 'oil', 'solar', 'other'
- **Creation**: Users can create custom types via the investment form's "+" button

### Stock Investments

- **Stock Fields**: Investments with `investment_type = 'stocks'` can have:
  - `stock_symbol` (VARCHAR) - Ticker symbol (e.g., "AAPL", "TSLA")
  - `stock_quantity` (DECIMAL) - Number of shares owned
  - `current_stock_price` (DECIMAL) - Latest price per share from Alpha Vantage API
  - `stock_price_updated_at` (TIMESTAMP) - Last time price was updated
- **API Integration**: Uses Alpha Vantage API via `getStockQuote` in `src/data/stocks.ts`
- **API Limits**: Free tier limited to 25 requests per day
- **Price Updates**:
  - Automatic: `updateUserStockPrices()` called when user views portfolio cards
  - Frequency: Only updates prices older than 24 hours (prevents API overuse)
  - Process: Fire-and-forget background updates, doesn't block UI
  - Protection: Stops updating if API limit reached, leaves existing prices unchanged
- **Value Calculation**:
  - Stock value = `stock_quantity * current_stock_price` (if price available)
  - Fallback to `amount` if price not yet fetched or outdated

## Investment Calculation Logic

### Data Flow

1. **Source**: `src/data/investments.ts` - Server functions using TanStack Start
2. **Hooks**:
   - `src/hooks/use-investments.ts` - React Query hooks for investment data fetching
   - `src/hooks/use-portfolios.ts` - React Query hooks for portfolio data fetching
3. **Types**: `src/lib/types/investments.ts` - TypeScript interfaces

### Key Calculations

- **Total Portfolio Value**:
  - For stocks: `(stock_quantity * current_stock_price) + total_distributions` (if price available)
  - For non-stocks or stocks without price: `amount + total_distributions`
- **Current Return**: `total_distributions - investment_value` (profit distributions minus current investment value)
- **Portfolio Growth**: Cumulative initial amounts over time (area chart)
- **Distribution**: Percentage by investment type (pie chart)

### Important Notes

- `distributions` table tracks profit distributions (dividends, returns, etc.) for investments
- `total_distributions` is calculated via SQL SUM() in queries
- `current_return` represents net profit: total distributions received minus initial investment

## Component Architecture

### Structure

```
src/components/
├── ui/ - shadcn/ui base components
├── portfolios/ - Portfolio-specific components
│   ├── portfolio-cards.tsx - Portfolio summary cards
│   └── add-portfolio-modal.tsx - Create new portfolio
├── investments/ - Investment-specific components
│   ├── investment-cards.tsx - Investment summary cards (legacy)
│   ├── investment-pie-chart.tsx - Category distribution
│   ├── portfolio-area-chart.tsx - Growth over time
│   ├── add-investment-modal.tsx - Create new investment
│   └── edit-investment-drawer.tsx - Edit existing investment
├── forms/ - Form components
├── distributions/ - Distribution management
└── [other shared components]
```

### Key Investment Components

- **PortfolioCards**: Shows portfolio cards with total value, investment count, and returns
- **InvestmentCards**: Shows total portfolio value, investment count, avg return
- **InvestmentPieChart**: Pie chart by investment_type with percentages
- **PortfolioAreaChart**: Step area chart showing cumulative initial investments over time
- **Investment Modals**: Create/edit investments with categories and tags

## Authentication

### Session-Based Authentication (Manual Pattern)

- **Implementation**: Manual authentication pattern in all server functions
- **Development Mode**: Set `VITE_DEV_USER_ID` environment variable to specify which user to authenticate as (e.g., `VITE_DEV_USER_ID=4`)
- **Production Mode**: Will use Clerk authentication (not yet implemented)
- **Manual RLS**: Each server function manually calls `getCurrentUserId()`, `getClient()`, and `setSessionUser(userId)`

#### Manual Authentication Pattern

All user-scoped server functions use this pattern:

```typescript
export const functionName = createServerFn({
  method: 'POST', // or 'GET'
}).handler(async ({ data }) => {
  const userId = await getCurrentUserId()
  const client = await getClient()
  if (!client) {
    throw new Error('Database connection failed')
  }
  await setSessionUser(userId)
  
  // Function logic here using client and userId
  const result = await client.query(...)
  return result
})
```

#### Environment Variables

- **VITE_DEV_USER_ID**: Set in `.env` to specify which user to authenticate as during development (defaults to 1 if not set)
- **Example**: `VITE_DEV_USER_ID=4` will authenticate all server requests as user ID 4

#### Client-Side Integration

- **No userId in Calls**: Server functions get userId automatically from `getCurrentUserId()` (which reads `VITE_DEV_USER_ID`)
- **Example Hook Call**: `getPortfolios()` - no need to pass userId
- **User Store**: Automatically reads `VITE_DEV_USER_ID` on initialization to set current user
- **SSR Consideration**: Queries include `isClient` check to prevent SSR streaming conflicts

## State Management

### User Management

- **File**: `src/stores/user-store.ts`
- **Library**: Zustand with persistence
- **Mock Users**: 3 hardcoded users for development (John Doe, Jane Smith, Bob Johnson)
- **Current User**: Automatically set from `VITE_DEV_USER_ID` env var, or defaults to first user in database
- **User Creation**: New users can be created via UI and are stored in database
- **User Selection**: Available in sidebar and dedicated user selector components
- **Initialization**: Store checks `VITE_DEV_USER_ID` and marks as initialized immediately if env var is set

#### User Creation Flow

1. **UI Component**: `src/components/user/user-selector.tsx` - Contains "New User" button and modal
2. **Store Function**: `useCreateNewUser()` hook calls `createUser` server function
3. **Server Function**: `createUser()` in `src/data/investments.ts` - Creates user in database
4. **Database**: New users get sequential IDs starting from 10 (avoiding mock user conflicts)
5. **State Update**: User store automatically updates and switches to new user

#### User Database Schema

- **Table**: `users` with SERIAL primary key
- **Mock User IDs**: 1, 2, 3 (reserved for development users)
- **New User IDs**: Start from 10 to avoid conflicts with mock users
- **Sequence**: `users_id_seq` set to start from 10 in `initializeSchema()`

#### User Server Functions

- **`createUser({ data: { name, email } })`** - Creates new user with name and email (NOT migrated - public endpoint)
- **`getUsers()`** - Returns all users from database (NOT migrated - dev/admin endpoint)
- **Auto-initialization**: Mock users are inserted on first schema initialization

#### Server Functions Using Manual Auth Pattern

All user-scoped server functions use manual auth pattern:
- **Investment functions**: `getInvestments`, `getInvestmentByPortfolio`, `getInvestmentWithDetails`, `createInvestment`, `updateInvestment`, `updateInvestmentByPortfolio`
- **Distribution**: `createDistribution`
- **Categories**: `getCategories`, `createCategory`
- **Tags**: `getTags`, `createTag`
- **Investment Types**: `getInvestmentTypes`, `createInvestmentType`
- **Portfolios**: `getPortfolios`, `getPortfolioWithInvestments`, `createPortfolio`, `updatePortfolio`, `deletePortfolio`
- **Stocks**: `updateUserStockPrices`
- **Snapshots**: `getPortfolioSnapshots`, `getUserSnapshots`, `savePortfolioSnapshot`, `saveUserSnapshot`

Functions without auth (admin/dev/public):
- `initializeSchema` - Development schema setup
- `createUser` - Public user registration
- `getUsers` - Development user listing
- `saveAllSnapshots` - Admin cron job

### Stock Price Server Functions

- **`updateUserStockPrices({ data: { userId } })`** - Updates stock prices for all of a user's stock investments
  - Fetches all stocks across all user portfolios where price is >24 hours old
  - Calls Alpha Vantage API via `getStockQuote()` for each stock
  - Updates `current_stock_price` and `stock_price_updated_at` in database
  - Returns `{ updated: number, errors: string[] }`
  - Includes 200ms delay between API calls to respect rate limits
  - Stops updating if API limit detected
  - Never throws errors - returns gracefully with results
- **`searchStockSymbols({ data: { keywords } })`** - Search for stock symbols via Alpha Vantage
- **`getStockQuote({ data: { symbol } })`** - Get current price quote for a stock symbol

#### User Components

- **`UserSelector`** - Full user selector with create functionality
- **`UserSelector` (compact)** - Sidebar version with same create functionality
- **`UserBadge`** - Simple display component showing current user

### Data Management

- **Library**: TanStack Query
- **Query Keys**: Defined in `src/hooks/use-investments.ts`
- **Mutations**: Create/update investments, distributions, categories, tags
- **Cache Invalidation**: Automatic on mutations

## Routing & Pages

- **Router**: TanStack Router with file-based routing
- **Main Page**: `src/routes/index.tsx` - Dashboard with portfolio cards
- **Portfolio Detail**: `src/routes/portfolios/$portfolioId.tsx` - Individual portfolio with investments
- **Investment Detail**: `src/routes/investments/$investmentId.tsx` - Individual investment details

## Styling & UI

- **Framework**: TailwindCSS v4
- **Components**: shadcn/ui (Radix primitives)
- **Icons**: Lucide React, Tabler Icons
- **Charts**: Recharts with custom chart components in `src/components/ui/chart.tsx`
- **Themes**: next-themes for dark/light mode support

## Development Patterns

### Server Functions

- Use `createServerFn()` from TanStack Start for all server functions
- All database operations go through server functions in `src/data/`
- Input validation with custom validators
- Automatic schema initialization on first query (development only)
- **Authentication**: User-scoped functions manually call `getCurrentUserId()`, `getClient()`, and `setSessionUser(userId)` at the start
- **Manual Auth Pattern**: Always include userId/client setup at start of handler
- All queries use `client.query()` syntax for Neon compatibility
- **SSR**: Client-side hooks check `typeof window !== 'undefined'` to prevent SSR query execution

### Error Handling

- Loading states in all components
- Error boundaries for API failures
- Empty state handling for no data
- Database connection failure handling

### TypeScript

- Strict mode enabled
- Path aliases: `@/*` maps to `src/*`
- Comprehensive type definitions in `src/lib/types/`

## File Organization

- **Routes**: `src/routes/` - File-based routing
- **Components**: `src/components/` - Organized by domain
- **Data Layer**: `src/data/` - Server functions and API
- **Hooks**: `src/hooks/` - Custom React hooks
- **Types**: `src/lib/types/` - TypeScript definitions
- **Stores**: `src/stores/` - Zustand state management
- **Database**: `db/` - SQL schema files

## Common Pitfalls

- `distributions` are profit distributions (dividends, returns, etc.), not additional investments
- Schema auto-initialization can be slow on first load
- Environment variable `VITE_DATABASE_URL` required for database connection
- Environment variable `VITE_DEV_USER_ID` sets which user to authenticate as in development
- Charts require data transformation from raw DB results
- **Session-based auth**: All server functions use manual auth pattern (getCurrentUserId, getClient, setSessionUser)
- **SSR conflicts**: Add `typeof window !== 'undefined'` check to query `enabled` conditions
- Use Field instead of Form, see create investment form
- Don't run the dev server, the user will have it running already
- Use POST for server functions (or GET where appropriate)
- **No userId in function calls**: Functions get userId automatically from `getCurrentUserId()` which reads `VITE_DEV_USER_ID`
- Use lucide-react for icons
- Use `client.query()` for Neon queries

## Testing

- **Framework**: Vitest
- **Testing Library**: React Testing Library
- **Config**: Basic setup, tests in `**/*.test.{ts,tsx}` files

## Future Roadmap

See [TODO.md](TODO.md) for planned features including:

- AI assistant for natural language portfolio/investment management
- Authentication system (Clerk integration)
- Data anonymization for privacy
