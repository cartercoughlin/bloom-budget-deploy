'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, AlertCircle, Loader2, CreditCard, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PlaidLink } from '@/components/plaid-link'
import { toast } from 'sonner'

export default function ImportTransactionsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSync = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/sync-transactions', {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to sync transactions')
      }

      const data = await response.json()
      
      if (data.success) {
        setSuccess(true)
        toast.success(`Synced ${data.newTransactions} new transactions and ${data.syncedAccounts} accounts`)
        setTimeout(() => {
          router.push('/transactions')
        }, 2000)
      } else {
        throw new Error(data.error || 'Sync failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync transactions')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlaidSuccess = () => {
    toast.success('Account connected! You can now sync transactions.')
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Connect Your Bank</h1>
        <p className="text-muted-foreground">
          Connect your bank accounts to automatically import transactions
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Connect Bank Account
            </CardTitle>
            <CardDescription>
              Securely connect your bank account using Plaid to automatically import transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlaidLink onSuccess={handlePlaidSuccess} />
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Supported institutions:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Most major US banks and credit unions</li>
                <li>Credit card companies</li>
                <li>Investment accounts</li>
                <li>Digital banks and fintech apps</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Sync Transactions
            </CardTitle>
            <CardDescription>
              Import the latest transactions from your connected accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleSync} 
              disabled={isLoading} 
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing Transactions...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Transactions
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Transactions synced successfully! Redirecting to transactions page...
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Security & Privacy</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Your financial data is protected with bank-level security:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>256-bit SSL encryption for all data transmission</li>
              <li>Read-only access to your accounts (we cannot move money)</li>
              <li>Credentials are encrypted and stored securely</li>
              <li>Powered by Plaid, trusted by thousands of financial apps</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
