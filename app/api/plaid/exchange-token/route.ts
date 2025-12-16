import { NextResponse } from 'next/server'
import { plaidClient } from '@/lib/plaid'
import { createClient } from '@/lib/supabase/server'
import { ItemPublicTokenExchangeRequest, AccountsGetRequest, InstitutionsGetByIdRequest } from 'plaid'

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

    console.log('Exchanging public token...')
    const exchangeRequest: ItemPublicTokenExchangeRequest = {
      public_token,
    }

    const exchangeResponse = await plaidClient.itemPublicTokenExchange(exchangeRequest)
    const accessToken = exchangeResponse.data.access_token
    const itemId = exchangeResponse.data.item_id

    console.log('Getting account details...')
    // Get account details
    const accountsRequest: AccountsGetRequest = {
      access_token: accessToken,
    }
    const accountsResponse = await plaidClient.accountsGet(accountsRequest)
    const accounts = accountsResponse.data.accounts
    const institutionId = accountsResponse.data.item.institution_id

    console.log('Found accounts:', accounts.map(acc => ({
      name: acc.name,
      type: acc.type,
      subtype: acc.subtype,
      official_name: acc.official_name
    })))
    console.log('Institution ID:', institutionId)

    // Get institution name using institution_id
    let institutionName = 'Connected Account'
    if (institutionId) {
      try {
        const institutionRequest: InstitutionsGetByIdRequest = {
          institution_id: institutionId,
          country_codes: ['US'],
        }
        const institutionResponse = await plaidClient.institutionsGetById(institutionRequest)
        institutionName = institutionResponse.data.institution.name
        console.log('Institution name:', institutionName)
      } catch (error) {
        console.error('Failed to get institution name:', error)
        // Fallback to cleaned institution ID
        institutionName = institutionId.replace('ins_', '').replace(/_/g, ' ').split(' ').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ')
        console.log('Using fallback institution name:', institutionName)
      }
    }

    // Create account names with proper institution context
    const accountNames = accounts.map(acc => {
      const accountName = acc.official_name || acc.name
      const typeInfo = acc.subtype ? ` (${acc.subtype})` : ` (${acc.type})`
      return accountName + typeInfo
    }).join(', ')

    console.log('Storing account info:', { accountNames, institutionName })

    // Store access token in database
    const { error } = await supabase
      .from('plaid_items')
      .upsert({
        user_id: user.id,
        item_id: itemId,
        access_token: accessToken,
        account_name: accountNames,
        institution_name: institutionName,
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

  } catch (error: any) {
    console.error('Token exchange error:', error)
    if (error.response?.data) {
      console.error('Plaid API error:', error.response.data)
    }
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 })
  }
}
