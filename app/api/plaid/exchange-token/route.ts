import { NextResponse } from 'next/server'
import { plaidClient } from '@/lib/plaid'
import { createClient } from '@/lib/supabase/server'
import { ItemPublicTokenExchangeRequest } from 'plaid'

export async function POST(request: Request) {
  try {
    const { public_token } = await request.json()
    
    if (!public_token) {
      return NextResponse.json({ error: 'Public token required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const exchangeRequest: ItemPublicTokenExchangeRequest = {
      public_token,
    }

    const exchangeResponse = await plaidClient.itemPublicTokenExchange(exchangeRequest)
    const accessToken = exchangeResponse.data.access_token
    const itemId = exchangeResponse.data.item_id

    // Store access token in database
    const { error } = await supabase
      .from('plaid_items')
      .upsert({
        user_id: user.id,
        item_id: itemId,
        access_token: accessToken,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,item_id'
      })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to store access token' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      item_id: itemId 
    })

  } catch (error) {
    console.error('Token exchange error:', error)
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 })
  }
}
