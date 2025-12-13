"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"

interface Account {
  id: string
  account_name: string
  account_type: 'checking' | 'savings' | 'liability'
  balance: number
}

interface AccountBalancesProps {
  accounts: Account[]
  onAddAccount: (name: string, type: string, balance: number) => void
  onUpdateBalance: (id: string, balance: number) => void
  onDeleteAccount: (id: string) => void
}

export function AccountBalances({ accounts, onAddAccount, onUpdateBalance, onDeleteAccount }: AccountBalancesProps) {
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'checking',
    balance: ''
  })

  const handleAddAccount = () => {
    if (newAccount.name && newAccount.balance) {
      onAddAccount(newAccount.name, newAccount.type, parseFloat(newAccount.balance))
      setNewAccount({ name: '', type: 'checking', balance: '' })
    }
  }

  const totalAssets = accounts
    .filter(acc => acc.account_type !== 'liability')
    .reduce((sum, acc) => sum + acc.balance, 0)

  const totalLiabilities = accounts
    .filter(acc => acc.account_type === 'liability')
    .reduce((sum, acc) => sum + Math.abs(acc.balance), 0)

  const availableToAllocate = totalAssets - totalLiabilities

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Balances</CardTitle>
        <CardDescription>
          Manage your account balances to calculate available money for budgeting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Assets</p>
              <p className="text-lg font-bold text-green-600">${totalAssets.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Liabilities</p>
              <p className="text-lg font-bold text-red-500">${totalLiabilities.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">Available to Allocate</p>
            <p className="text-xl font-bold">${availableToAllocate.toFixed(2)}</p>
          </div>
        </div>

        {/* Existing Accounts */}
        <div className="space-y-3">
          {accounts.map((account) => (
            <div key={account.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{account.account_name}</p>
                <p className="text-sm text-muted-foreground capitalize">{account.account_type}</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={account.balance}
                  onChange={(e) => onUpdateBalance(account.id, parseFloat(e.target.value) || 0)}
                  className="w-32"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteAccount(account.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Account */}
        <div className="p-4 border-2 border-dashed rounded-lg">
          <h4 className="font-medium mb-3">Add New Account</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="account-name">Account Name</Label>
              <Input
                id="account-name"
                placeholder="e.g., Main Checking"
                value={newAccount.name}
                onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="account-type">Account Type</Label>
              <Select
                value={newAccount.type}
                onValueChange={(value) => setNewAccount(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="liability">Liability</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="account-balance">Balance</Label>
              <Input
                id="account-balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newAccount.balance}
                onChange={(e) => setNewAccount(prev => ({ ...prev, balance: e.target.value }))}
              />
            </div>
          </div>
          <Button onClick={handleAddAccount} className="mt-3">
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
