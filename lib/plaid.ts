import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

// Validate environment variables
if (!process.env.PLAID_CLIENT_ID) {
  console.error('PLAID_CLIENT_ID environment variable is required')
}
if (!process.env.PLAID_SECRET) {
  console.error('PLAID_SECRET environment variable is required')
}

const plaidEnv = process.env.PLAID_ENV || 'sandbox'
console.log('Plaid environment:', plaidEnv)

const configuration = new Configuration({
  basePath: PlaidEnvironments[plaidEnv as keyof typeof PlaidEnvironments] || PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
})

export const plaidClient = new PlaidApi(configuration)
