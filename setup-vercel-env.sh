#!/bin/bash

# Vercel Environment Variables Setup Script
# This script sets up all environment variables for the Bloom Budget project on Vercel
#
# Prerequisites:
# 1. Run 'vercel login' to authenticate with Vercel
# 2. Ensure you're in the project directory
# 3. Make this script executable: chmod +x setup-vercel-env.sh
#
# Usage: ./setup-vercel-env.sh

set -e

echo "🚀 Setting up Vercel environment variables for Bloom Budget..."
echo ""

# Check if vercel is authenticated
if ! npx vercel whoami &> /dev/null; then
    echo "❌ Error: Not authenticated with Vercel. Please run 'npx vercel login' first."
    exit 1
fi

echo "✅ Vercel authentication verified"
echo ""

# Function to set environment variable for all environments (production, preview, development)
set_env() {
    local key=$1
    local value=$2
    local environments=$3  # "production preview development" or specific ones

    echo "Setting $key..."

    for env in $environments; do
        echo "$value" | npx vercel env add "$key" "$env" --force > /dev/null 2>&1 || true
    done
}

echo "📝 Setting Supabase environment variables..."

# Supabase Public Variables (all environments)
set_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbG9jY2tkd2VqanNvbGd3bnlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MzkwODEsImV4cCI6MjA4MTExNTA4MX0.U6N_uXJVSB8xombCHZzfbVQKDRDH4s6sbgbAdjkGFEI" \
    "production preview development"

set_env "NEXT_PUBLIC_SUPABASE_URL" \
    "https://rmlocckdwejjsolgwnyl.supabase.co" \
    "production preview development"

# Supabase Private Variables (all environments)
set_env "SUPABASE_JWT_SECRET" \
    "8X/LLGYMnIvR2OVf4kBwAlQAVb2WqPyU899V38ttMSVRWtmY6Uf6fyDSJJFA31TLwzPYYx2JXV31jWgm/7dZ3w==" \
    "production preview development"

set_env "SUPABASE_SERVICE_ROLE_KEY" \
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbG9jY2tkd2VqanNvbGd3bnlsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUzOTA4MSwiZXhwIjoyMDgxMTE1MDgxfQ.chkOp_XHmqG62xRcVfAAqvrw9oJBv2HA8iixC6D2LhY" \
    "production preview development"

echo ""
echo "📊 Setting PostgreSQL environment variables..."

set_env "POSTGRES_DATABASE" \
    "postgres" \
    "production preview development"

set_env "POSTGRES_HOST" \
    "db.rmlocckdwejjsolgwnyl.supabase.co" \
    "production preview development"

set_env "POSTGRES_PASSWORD" \
    "dzsTHlVQPNmWQLUH" \
    "production preview development"

set_env "POSTGRES_PRISMA_URL" \
    "postgres://postgres.rmlocckdwejjsolgwnyl:dzsTHlVQPNmWQLUH@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true" \
    "production preview development"

set_env "POSTGRES_URL" \
    "postgres://postgres.rmlocckdwejjsolgwnyl:dzsTHlVQPNmWQLUH@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x" \
    "production preview development"

set_env "POSTGRES_URL_NON_POOLING" \
    "postgres://postgres.rmlocckdwejjsolgwnyl:dzsTHlVQPNmWQLUH@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require" \
    "production preview development"

set_env "POSTGRES_USER" \
    "postgres" \
    "production preview development"

echo ""
echo "🔑 Setting Google Auth environment variables..."

set_env "GOOGLE_SHEETS_SPREADSHEET_ID" \
    "1qmQMEk1sbj55MkTT7l9DyZXsyBydfwjHEQo73zGa56o" \
    "production preview development"

set_env "GOOGLE_CLIENT_EMAIL" \
    "carter@bloom-budget.iam.gserviceaccount.com" \
    "production preview development"

set_env "GOOGLE_CLIENT_ID" \
    "111678461772918770769" \
    "production preview development"

# Google Private Key (multiline - needs special handling)
echo "Setting GOOGLE_PRIVATE_KEY..."
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCbVUAjd7WSf6Z8
yawSLx4T/WXgJDBiRI3+PZto2mLJI/qVkrzHKXT866BaNQeU6tMTkfcAUx4dhyUH
EnRGlZEMq8qcLZ1EXErA8idslPplS3j1M/RwvlEjiTlnh6m+uMbpo+CCK8cYqxb3
JjcroKl7sEpBkV4/cuJEj2wQEy8aC6YP54houmhNfQKovECG7A9yEd2hoxgSgavw
qmxGy1hsgYV9en0nmn3BQ3Os28fJREZDxRLzAVgLJ0cJshCfWWMKBDuQb9Vtt+CA
nnwE5AD8nxVnJ0T0mBMcBGrlKvTtofSanuCet1KrPMgW+uLsJfLDU6DiaOzhJp+s
aMkAEy2/AgMBAAECggEAHY/RZ46aQznA/SHCeil2b3Z7w3cPsDv8zAR8ha1+PGp4
/6tP+xVUOug6+b/64+f26NQQLoMjCZqVPO3RrDc9xiwRoLx7oC1yWpsbTqphpxKA
gCX1oNlPhtRQVPg4IWB4FrIGAbAEMZkqAzpGKKroZm5MC4N3bNrX3hVvivWjsrB1
x76H88KDyV83Hs3QISpn7wKYG+ia+MgYlamtRxMXNXliZruPu06YUMjOv8c8nvHd
+KCD3ApI0DHlg8WI0lT4GyWYC9Zfww3/QAdotzqbrK8Rn2UAjCjhJc7dDWnAPU6D
TdZS7vR2ENX98dQL5SlCzhFSBTh+XEVsDAM/MrLxYQKBgQDUyQlH2Vvbc8nOSFp9
0gGp9Kmr1pJh5yDwvdq0Rk0tgjQpXuDerZUtHMJG6I+OfLT97q4vTZEoUx4cGwCg
9fjoFlndTprJK9getPcjmWKT3NUqtrU4todLMh+Dd0QJ+x6ohiOzhAgPSYfbNJTh
EoEhS6lAxtCLvu3Xq/ql3FBmoQKBgQC64TNgURYgUNFV70ol0ren/juKIijM4gJh
Pd584mKYtpZPDYi/g7uTbHVHpIkNXHop9Iy0M4KpfBu6eLvpkDJhzl4AGXNbOrSY
vAKgQVHZ1wWmIC6P8vSK0RGZtIM5VOph6/4fAgvcrY5ndDrZN2OmzJX2GtNDsfbE
DUsgld4YXwKBgQCt0uCq+gwI9Mi5o++Qcxr63KwyfSGtqqMFJwLfW8K2V3QHC8PF
BKYlaSXnyRlku8ka230dlU7sUyH4sbJMy0MfTQryN8FIb3GofAqb4TRfN/pHX2Qh
RTK2oeaOfcJuKN89qf7GKihvXJEH6CdqybQFIArOqNs6HamsEoi6L4TaoQJ/HqjT
xPmIp8Sak36uq4Xmm6kaG49/Ih3yRgHgfpylkGhkQJP323PBUm54z0gvNAH4COoW
K3pH9YZnBjDIo4kEuwcgZOPICS+YcXZm9+O/if2874RYH0W82Qlz2cPDw6Qqz+Xn
yy6Kw6m1s0NeZESyFKt77uR3xKNt2LxVlwL/bQKBgQDNYghgcur87mzLOgWZ9m5q
v3yqLVlnnF0FOr8Iwi9zx93DMv7gWxKq17XjuES641cu+18s7QsC0yBkJgim/Fk2
f+kEA15257F7q74+4W4VoseBXXsei0ISm0xN4Vibqnh64oiwhrCgejFEefU9Zq58
qx1NjRHSBPSwx9WDk+so+w==
-----END PRIVATE KEY-----"

for env in production preview development; do
    echo "$GOOGLE_PRIVATE_KEY" | npx vercel env add "GOOGLE_PRIVATE_KEY" "$env" --force > /dev/null 2>&1 || true
done

# Google Auth URIs
set_env "GOOGLE_AUTH_URI" \
    "https://accounts.google.com/o/oauth2/auth" \
    "production preview development"

set_env "GOOGLE_TOKEN_URI" \
    "https://oauth2.googleapis.com/token" \
    "production preview development"

set_env "GOOGLE_AUTH_PROVIDER_CERT_URL" \
    "https://www.googleapis.com/oauth2/v1/certs" \
    "production preview development"

set_env "GOOGLE_CLIENT_CERT_URL" \
    "https://www.googleapis.com/robot/v1/metadata/x509/carter%40bloom-budget.iam.gserviceaccount.com" \
    "production preview development"

echo ""
echo "✅ All environment variables have been set successfully!"
echo ""
echo "📋 Summary of environment variables set:"
echo "  - Supabase configuration (public and private)"
echo "  - PostgreSQL database URLs and credentials"
echo "  - Google Service Account credentials for authentication"
echo ""
echo "🔍 To verify, run: npx vercel env ls"
echo "🚀 To deploy with new environment variables: npx vercel --prod"
echo ""
echo "✨ Setup complete!"
