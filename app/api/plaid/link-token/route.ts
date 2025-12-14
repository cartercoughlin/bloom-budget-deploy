import { NextResponse } from 'next/server'
import { plaidClient } from '@/lib/plaid'
import { createClient } from '@/lib/supabase/server'
import { LinkTokenCreateRequest, Products, CountryCode } from 'plaid'

export async function POST() {
  try {
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

    const response = await plaidClient.linkTokenCreate(request)
    
    return NextResponse.json({ 
      link_token: response.data.link_token 
    })

  } catch (error) {
    console.error('Link token creation error:', error)
    return NextResponse.json({ error: 'Failed to create link token' }, { status: 500 })
  }
}
