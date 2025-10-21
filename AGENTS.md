# AGENTS.md - Finance App Project Guide

## Project Overview

A personal finance application for tracking investments built with modern React stack, focusing on portfolio management and visualization.

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

- **Database File**: `src/db.ts` - Simple Neon client wrapper using `VITE_DATABASE_URL` env var
- **Plugin**: `neon-vite-plugin.ts` - Vite plugin for Postgres integration with seeding
- **Schema Files**:
  - `db/investments-schema.sql` - Main investment tracking schema
  - `db/init.sql` - Legacy todos schema (unused)
- **Auto-initialization**: Schema is created automatically via `initializeSchema()` in `src/data/investments.ts`

### Schema Reset Behavior

- **Development Mode**: `initializeSchema()` drops and recreates ALL tables on first query
- **Data Loss**: Existing data is cleared when schema is re-initialized
- **Migration Path**: Schema was migrated from PostgreSQL ENUM to VARCHAR for investment_type flexibility
- **Production Note**: In production, use proper database migrations instead of full schema reset

### Database Schema Structure

```
users (id, email, password_hash, name, timestamps)
├── investments (id, user_id, name, description, date_started, amount, investment_type, timestamps)
│   ├── distributions (id, investment_id, date, amount, description, created_at)
│   ├── investment_categories (investment_id, category_id) [junction table]
│   └── investment_tags (investment_id, tag_id) [junction table]
├── categories (id, user_id, name, created_at)
├── tags (id, user_id, name, created_at)
└── investment_types (id, user_id, name, created_at) [user-specific custom investment types]
```

### Investment Types

- **Storage**: VARCHAR(100) in investments table allows any custom investment type string
- **Custom Types**: User-specific custom investment types are stored in `investment_types` table
- **Persistence**: Custom investment types persist across sessions and are scoped per user
- **Default Types**: Built-in types include 'stocks', 'real_estate', 'oil', 'solar', 'other'
- **Creation**: Users can create custom types via the investment form's "+" button

## Investment Calculation Logic

### Data Flow

1. **Source**: `src/data/investments.ts` - Server functions using TanStack Start
2. **Hooks**: `src/hooks/use-investments.ts` - React Query hooks for data fetching
3. **Types**: `src/lib/types/investments.ts` - TypeScript interfaces

### Key Calculations

- **Total Portfolio Value**: `amount + total_distributions` per investment
- **Current Return**: `total_distributions - amount` (profit distributions minus initial investment)
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
├── investments/ - Investment-specific components
│   ├── investment-cards.tsx - Portfolio summary cards
│   ├── investment-pie-chart.tsx - Category distribution
│   ├── portfolio-area-chart.tsx - Growth over time
│   ├── add-investment-modal.tsx - Create new investment
│   └── edit-investment-drawer.tsx - Edit existing investment
├── forms/ - Form components
├── distributions/ - Distribution management
└── [other shared components]
```

### Key Investment Components

- **InvestmentCards**: Shows total portfolio value, investment count, avg return
- **InvestmentPieChart**: Pie chart by investment_type with percentages
- **PortfolioAreaChart**: Step area chart showing cumulative initial investments over time
- **Investment Modals**: Create/edit investments with categories and tags

## State Management

### User Management

- **File**: `src/stores/user-store.ts`
- **Library**: Zustand with persistence
- **Mock Users**: 3 hardcoded users for development (John Doe, Jane Smith, Bob Johnson)
- **Current User**: Persisted in localStorage, defaults to John Doe (id: 1)
- **User Creation**: New users can be created via UI and are stored in database
- **User Selection**: Available in sidebar and dedicated user selector components

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

- **`createUser({ data: { name, email } })`** - Creates new user with name and email
- **`getUsers()`** - Returns all users from database (used for user selector)
- **Auto-initialization**: Mock users are inserted on first schema initialization

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
- **Main Page**: `src/routes/index.tsx` - Dashboard with investment cards and charts
- **Layout**: 2-column grid (lg screens) with pie chart and area chart

## Styling & UI

- **Framework**: TailwindCSS v4
- **Components**: shadcn/ui (Radix primitives)
- **Icons**: Lucide React, Tabler Icons
- **Charts**: Recharts with custom chart components in `src/components/ui/chart.tsx`
- **Themes**: next-themes for dark/light mode support

## Development Patterns

### Server Functions

- Use `createServerFn()` from TanStack Start for backend logic
- All database operations go through server functions in `src/data/`
- Input validation with custom validators
- Automatic schema initialization on first query

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
- Mock users are hardcoded - real auth not implemented
- Environment variable `VITE_DATABASE_URL` required for database connection
- Charts require data transformation from raw DB results

## Testing

- **Framework**: Vitest
- **Testing Library**: React Testing Library
- **Config**: Basic setup, tests in `**/*.test.{ts,tsx}` files
