"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react"

interface SyncResult {
  success: boolean
  newTransactions: number
  updatedTransactions: number
  totalProcessed: number
  error?: string
}

export function SyncStatus() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSync = async () => {
    setIsSyncing(true)
    setError(null)
    setSyncResult(null)

    try {
      const response = await fetch("/api/sync-sheets", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync")
      }

      setSyncResult(data)
      setLastSync(new Date().toISOString())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync with Google Sheets")
    } finally {
      setIsSyncing(false)
    }
  }

  const formatLastSync = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Google Sheets Sync
          {lastSync && (
            <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatLastSync(lastSync)}
            </span>
          )}
        </CardTitle>
        <CardDescription>Automatically sync transactions from your Tiller spreadsheet</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleSync} disabled={isSyncing} className="w-full" size="lg">
          {isSyncing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Now
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {syncResult && syncResult.success && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Sync completed successfully!</p>
                <ul className="text-sm space-y-1 mt-2">
                  <li>New transactions: {syncResult.newTransactions}</li>
                  <li>Updated transactions: {syncResult.updatedTransactions}</li>
                  <li>Total processed: {syncResult.totalProcessed}</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground space-y-2">
          <p>
            <strong>Note:</strong> Make sure you've set up the required environment variables:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>GOOGLE_SHEETS_CLIENT_EMAIL</li>
            <li>GOOGLE_SHEETS_PRIVATE_KEY</li>
            <li>GOOGLE_SHEETS_SPREADSHEET_ID</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
