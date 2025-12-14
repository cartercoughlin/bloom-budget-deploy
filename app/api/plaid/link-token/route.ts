import { NextResponse } from 'next/server'
import { plaidClient } from '@/lib/plaid'
import { createClient } from '@/lib/supabase/server'
import { LinkTokenCreateRequest, Products, CountryCode } from 'plaid'

export async function POST() {
  try {
    // Check environment variables
    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
      console.error('Missing Plaid environment variables')
      return NextResponse.json({ 
        error: 'Plaid not configured. Please set PLAID_CLIENT_ID and PLAID_SECRET environment variables.' 
      }, { status: 500 })
    }

    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const request: LinkTokenCreateRequest = {
      user: {
        client_user_id: user.id,
      },
      client_name: 'Budget App',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    }

    console.log('Creating Plaid link token for user:', user.id)
    const response = await plaidClient.linkTokenCreate(request)
    
    return NextResponse.json({ 
      link_token: response.data.link_token 
    })

  } catch (error: any) {
    console.error('Link token creation error:', error)
    
    // Log more details about the error
    if (error.response?.data) {
      console.error('Plaid API error details:', error.response.data)
      return NextResponse.json({ 
        error: `Plaid API error: ${error.response.data.error_message || 'Unknown error'}` 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: error.message || 'Failed to create link token' 
    }, { status: 500 })
  }
}
