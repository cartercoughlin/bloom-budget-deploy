"use client"

import { useState } from "react"
import { AccountBalances } from "./account-balances"
import { useRouter } from "next/navigation"

interface Account {
  id: string
  account_name: string
  account_type: 'checking' | 'savings' | 'liability'
  balance: number
}

interface AccountBalancesWrapperProps {
  initialAccounts: Account[]
}

export function AccountBalancesWrapper({ initialAccounts }: AccountBalancesWrapperProps) {
  const [accounts, setAccounts] = useState(initialAccounts)
  const router = useRouter()

  const handleAddAccount = async (name: string, type: string, balance: number) => {
    try {
      const response = await fetch('/api/account-balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_name: name, account_type: type, balance })
      })
      
      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to add account:', error)
    }
  }

  const handleUpdateBalance = async (id: string, balance: number) => {
    try {
      const response = await fetch(`/api/account-balances/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance })
      })
      
      if (response.ok) {
        setAccounts(prev => prev.map(acc => 
          acc.id === id ? { ...acc, balance } : acc
        ))
      }
    } catch (error) {
      console.error('Failed to update balance:', error)
    }
  }

  const handleDeleteAccount = async (id: string) => {
    try {
      const response = await fetch(`/api/account-balances/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to delete account:', error)
    }
  }

  return (
    <AccountBalances
      accounts={accounts}
      onAddAccount={handleAddAccount}
      onUpdateBalance={handleUpdateBalance}
      onDeleteAccount={handleDeleteAccount}
    />
  )
}
