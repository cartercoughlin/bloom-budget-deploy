# Vercel Environment Variables Setup

This guide explains how to set up environment variables for the Bloom Budget application on Vercel.

## Overview

The application requires the following environment variable categories:
- **Supabase Configuration**: Database and authentication
- **PostgreSQL**: Database connection strings
- **Google Service Account**: For Google Sheets integration and authentication

## Quick Setup (Automated)

We've created a script to automatically set up all environment variables in Vercel.

### Prerequisites

1. Ensure you have Node.js and npm installed
2. Authenticate with Vercel (you only need to do this once)

### Steps

1. **Authenticate with Vercel** (first time only):
   ```bash
   npx vercel login
   ```

2. **Run the setup script**:
   ```bash
   ./setup-vercel-env.sh
   ```

The script will automatically set all environment variables for production, preview, and development environments.

## Manual Setup (Alternative)

If you prefer to set up environment variables manually, you can use the Vercel dashboard or CLI.

### Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **bloom-budget**
3. Navigate to **Settings** → **Environment Variables**
4. Add each variable from the list below

### Using Vercel CLI

```bash
# Authenticate first
npx vercel login

# Add environment variables one by one
echo "your-value" | npx vercel env add VARIABLE_NAME production
echo "your-value" | npx vercel env add VARIABLE_NAME preview
echo "your-value" | npx vercel env add VARIABLE_NAME development
```

## Environment Variables Reference

### Supabase (Public)

These variables are safe to expose to the client:

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
```

### Supabase (Private)

Keep these secret:

```bash
SUPABASE_JWT_SECRET="your-jwt-secret"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### PostgreSQL

Database connection strings:

```bash
POSTGRES_DATABASE="postgres"
POSTGRES_HOST="db.your-project.supabase.co"
POSTGRES_PASSWORD="your-password"
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
POSTGRES_USER="postgres"
```

### Google Service Account

For Google Sheets integration and authentication:

```bash
GOOGLE_SHEETS_SPREADSHEET_ID="your-spreadsheet-id"
GOOGLE_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_AUTH_URI="https://accounts.google.com/o/oauth2/auth"
GOOGLE_TOKEN_URI="https://oauth2.googleapis.com/token"
GOOGLE_AUTH_PROVIDER_CERT_URL="https://www.googleapis.com/oauth2/v1/certs"
GOOGLE_CLIENT_CERT_URL="https://www.googleapis.com/robot/v1/metadata/x509/your-email"
```

## Google Service Account Details

The current service account is configured with:
- **Email**: `carter@bloom-budget.iam.gserviceaccount.com`
- **Client ID**: `111678461772918770769`
- **Project**: `bloom-budget`

This service account is used for:
1. Google Sheets API access
2. Google authentication flows
3. Server-side Google API operations

## Verifying Setup

After setting up the environment variables, verify they're configured correctly:

```bash
# List all environment variables
npx vercel env ls

# Pull environment variables to local .env file (optional)
npx vercel env pull .env.local
```

## Deployment

After setting up environment variables:

1. **Deploy to production**:
   ```bash
   npx vercel --prod
   ```

2. **Or push to your git branch** and Vercel will automatically deploy

## Troubleshooting

### Authentication Issues

If you get "No existing credentials found":
```bash
npx vercel login
```

### Environment Variables Not Working

1. Check that variables are set for the correct environment (production/preview/development)
2. Redeploy your application after adding new variables
3. Verify variable names match exactly (they're case-sensitive)

### Google Auth Issues

If Google authentication fails:
1. Verify the `GOOGLE_PRIVATE_KEY` includes the full key with headers
2. Check that the service account has necessary permissions
3. Ensure the client email is correct

## Security Notes

- Never commit `.env` files to git (they're in `.gitignore`)
- Keep service account credentials secure
- Rotate keys periodically
- Use environment-specific values when needed

## Support

For more information:
- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Service Account Documentation](https://cloud.google.com/iam/docs/service-accounts)
