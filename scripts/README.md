# Database Setup Scripts

## For New Databases (Fresh Install)

Run these scripts in order on a fresh Supabase database:

1. **`000_complete_schema.sql`** - Creates all tables with final structure including Plaid integration
2. **`001_seed_default_categories.sql`** - Adds default categories for new users

## For Existing Databases (Migration)

If you have an existing database with data:

1. **`002_cleanup_duplicates.sql`** - Removes duplicate transactions (optional)

## Utility Scripts

- **`update-sw-version.js`** - Auto-updates PWA cache version (runs on build)

## Database Schema Summary

**Core Tables:**
- `profiles` - User profiles with sync timestamps
- `categories` - Expense/income categories with colors and icons
- `transactions` - Financial transactions with Plaid integration (`plaid_transaction_id`, `plaid_account_id`)
- `budgets` - Monthly budget limits by category
- `category_rules` - Automated categorization rules
- `account_balances` - Account balances from connected banks (`plaid_account_id`)
- `plaid_items` - Connected Plaid accounts and sync preferences

**Key Features:**
- Row Level Security (RLS) on all tables
- Plaid transaction and account ID tracking for duplicate prevention
- Hidden/recurring transaction flags
- Merchant enrichment data (logos, websites)
- Automated categorization with regex patterns
- Automatic cleanup of disconnected accounts and their transactions

**Plaid Integration:**
- `plaid_transaction_id` - Unique Plaid transaction identifier
- `plaid_account_id` - Links transactions to specific Plaid accounts
- Automatic removal of transactions/balances when accounts are disconnected
- Duplicate prevention using Plaid IDs and fingerprint matching
