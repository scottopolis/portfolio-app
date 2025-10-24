import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { useCreateInvestment } from '@/hooks/use-investments'
import type { CreateInvestmentData } from '@/lib/types/investments'
import { StockInput } from './stock-input'
import { CryptoInput } from './crypto-input'
import { CommoditiesInput } from './commodities-input'
import { ManualInvestmentForm } from './manual-investment-form'

type InvestmentType = 'manual' | 'stock' | 'crypto' | 'commodities'

interface CreateInvestmentFormProps {
  userId: number
  portfolioId?: number
  onSuccess?: (investment: any) => void
  onCancel?: () => void
}

export function CreateInvestmentForm({
  userId,
  portfolioId,
  onSuccess,
  onCancel,
}: CreateInvestmentFormProps) {
  const [selectedType, setSelectedType] = useState<InvestmentType | ''>('')
  const createInvestmentMutation = useCreateInvestment()

  const handleTypeSubmit = async (typeSpecificData: any) => {
    try {
      if (!portfolioId) {
        console.error('Portfolio ID is required to create investment')
        return
      }

      let investmentData: CreateInvestmentData

      // Transform type-specific data to general investment data
      switch (selectedType) {
        case 'stock':
          investmentData = {
            portfolio_id: portfolioId,
            name: `${typeSpecificData.ticker} - ${typeSpecificData.shares} shares`,
            description: `Stock: ${typeSpecificData.ticker}, Shares: ${typeSpecificData.shares}, Purchase Price: $${typeSpecificData.purchase_price}`,
            date_started: typeSpecificData.purchase_date,
            amount: typeSpecificData.shares * typeSpecificData.purchase_price,
            investment_type: 'stock',
            has_distributions: false,
          }
          break
        case 'crypto':
          investmentData = {
            portfolio_id: portfolioId,
            name: `${typeSpecificData.symbol} - ${typeSpecificData.amount} units`,
            description: `Cryptocurrency: ${typeSpecificData.symbol}, Amount: ${typeSpecificData.amount}, Purchase Price: $${typeSpecificData.purchase_price}`,
            date_started: typeSpecificData.purchase_date,
            amount: typeSpecificData.amount * typeSpecificData.purchase_price,
            investment_type: 'crypto',
            has_distributions: false,
          }
          break
        case 'commodities':
          investmentData = {
            portfolio_id: portfolioId,
            name: `${typeSpecificData.commodity_type} - ${typeSpecificData.quantity} ${typeSpecificData.unit}`,
            description: `Commodity: ${typeSpecificData.commodity_type}, Quantity: ${typeSpecificData.quantity} ${typeSpecificData.unit}, Purchase Price: $${typeSpecificData.purchase_price}`,
            date_started: typeSpecificData.purchase_date,
            amount: typeSpecificData.quantity * typeSpecificData.purchase_price,
            investment_type: 'commodities',
            has_distributions: false,
          }
          break
        case 'manual':
          investmentData = typeSpecificData
          break
        default:
          console.error('Invalid investment type')
          return
      }

      const result = await createInvestmentMutation.mutateAsync({
        userId,
        ...investmentData,
      })

      setSelectedType('')
      onSuccess?.(result)
    } catch (error) {
      console.error('Failed to create investment:', error)
    }
  }

  const handleCancel = () => {
    if (selectedType) {
      setSelectedType('')
    } else {
      onCancel?.()
    }
  }

  // If no type selected, show type selector
  if (!selectedType) {
    return (
      <div className="space-y-6">
        <Field>
          <FieldLabel htmlFor="investment-type">Investment Type</FieldLabel>
          <Select
            value={selectedType}
            onValueChange={(value) => setSelectedType(value as InvestmentType)}
          >
            <SelectTrigger id="investment-type">
              <SelectValue placeholder="Select investment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="stock">Stock</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
              <SelectItem value="commodities">Commodities</SelectItem>
            </SelectContent>
          </Select>
          <FieldDescription>
            Choose the type of investment you want to add.
          </FieldDescription>
        </Field>

        {onCancel && (
          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Render appropriate form based on selected type
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b">
        <h3 className="text-sm font-medium">
          {selectedType === 'manual' && 'Manual Investment'}
          {selectedType === 'stock' && 'Stock Investment'}
          {selectedType === 'crypto' && 'Crypto Investment'}
          {selectedType === 'commodities' && 'Commodities Investment'}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setSelectedType('')}
        >
          Change Type
        </Button>
      </div>

      {selectedType === 'stock' && (
        <StockInput
          onSubmit={handleTypeSubmit}
          onCancel={handleCancel}
          isSubmitting={createInvestmentMutation.isPending}
        />
      )}
      {selectedType === 'crypto' && (
        <CryptoInput
          onSubmit={handleTypeSubmit}
          onCancel={handleCancel}
          isSubmitting={createInvestmentMutation.isPending}
        />
      )}
      {selectedType === 'commodities' && (
        <CommoditiesInput
          onSubmit={handleTypeSubmit}
          onCancel={handleCancel}
          isSubmitting={createInvestmentMutation.isPending}
        />
      )}
      {selectedType === 'manual' && (
        <ManualInvestmentForm
          userId={userId}
          portfolioId={portfolioId}
          onSubmit={handleTypeSubmit}
          onCancel={handleCancel}
          isSubmitting={createInvestmentMutation.isPending}
        />
      )}
    </div>
  )
}
