'use client'

import { useState, useCallback } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface PlaidLinkProps {
  onSuccess?: () => void
}

export function PlaidLink({ onSuccess }: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onPlaidSuccess = useCallback(async (public_token: string) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_token }),
      })

      if (!response.ok) {
        throw new Error('Failed to connect account')
      }

      toast.success('Account connected successfully!')
      onSuccess?.()
    } catch (error) {
      console.error('Error connecting account:', error)
      toast.error('Failed to connect account')
    } finally {
      setLoading(false)
    }
  }, [onSuccess])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: (err) => {
      if (err) {
        console.error('Plaid Link error:', err)
        toast.error('Failed to connect account')
      }
    },
  })

  const createLinkToken = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/plaid/link-token', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to create link token')
      }

      const data = await response.json()
      setLinkToken(data.link_token)
      
      // Open Plaid Link once token is ready
      setTimeout(() => {
        if (ready) {
          open()
        }
      }, 100)
    } catch (error) {
      console.error('Error creating link token:', error)
      toast.error('Failed to initialize account connection')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={createLinkToken}
      disabled={loading}
      className="w-full"
    >
      {loading ? 'Connecting...' : 'Connect Bank Account'}
    </Button>
  )
}
