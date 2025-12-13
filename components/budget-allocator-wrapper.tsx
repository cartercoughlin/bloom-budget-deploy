"use client"

import { BudgetAllocator } from "./budget-allocator"
import { useRouter } from "next/navigation"

interface Budget {
  id: string
  name: string
  allocated_amount: number
  spent_amount: number
  available_amount: number
}

interface BudgetAllocatorWrapperProps {
  budgets: Budget[]
  availableToAllocate: number
}

export function BudgetAllocatorWrapper({ budgets, availableToAllocate }: BudgetAllocatorWrapperProps) {
  const router = useRouter()

  const handleAllocate = async (budgetId: string, amount: number) => {
    try {
      // TODO: Create API endpoint for budget allocation
      console.log('Allocating', amount, 'to budget', budgetId)
      router.refresh()
    } catch (error) {
      console.error('Failed to allocate:', error)
    }
  }

  return (
    <BudgetAllocator
      budgets={budgets}
      availableToAllocate={availableToAllocate}
      onAllocate={handleAllocate}
    />
  )
}
