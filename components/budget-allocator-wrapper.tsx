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
      const response = await fetch(`/api/budgets/${budgetId}/allocate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Failed to allocate:', error)
        return
      }

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
