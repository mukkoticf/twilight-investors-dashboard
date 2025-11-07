# CSV Upload Instructions

## Overview
The `upload_investments_csv.py` script reads your CSV file and generates SQL INSERT queries to upload investment data to your Supabase database.

## Prerequisites
1. Python 3.6 or higher installed
2. CSV file: `Anilsiva Investment Receipts - Investments.csv` in the same directory as the script
3. Your Supabase database connection details (you'll need the `purchase_id` from your `company_pools` table)

## Step-by-Step Instructions

### Step 1: Prepare Your CSV File
- Make sure your CSV file is named: `Anilsiva Investment Receipts - Investments.csv`
- Place it in the same directory as the Python script
- The script expects these columns (case-insensitive):
  - `Invoice No` (optional, for reference)
  - `Name` → maps to `investors.investor_name`
  - `Phone Number` → maps to `investors.phone`
  - `Email` → maps to `investors.email` (used as unique identifier)
  - `Amount` → maps to `investor_investments.investment_amount`
  - `Date` → maps to `investor_investments.created_at`
  - Other columns (Received By, Receiver Email, etc.) are ignored

### Step 2: Configure Pool Settings
You have two options:

**Option A: Use an Existing Pool**
1. Go to your Supabase Dashboard
2. Navigate to Table Editor → `company_pools`
3. Find the pool that corresponds to "Anilsiva" investments
4. Copy the `purchase_id` (UUID) for that pool
5. Open `upload_investments_csv.py` and set:
   ```python
   USE_EXISTING_POOL = True
   EXISTING_PURCHASE_ID = "your-actual-uuid-here"
   ```

**Option B: Create a New Pool**
1. Open `upload_investments_csv.py`
2. Set:
   ```python
   USE_EXISTING_POOL = False
   ```
3. Configure the pool details:
   ```python
   POOL_NAME = "Anilsiva Pool"
   POOL_DESCRIPTION = "Pool for Anilsiva company investments"
   OWNER_NAMES = ["Anilsiva"]
   VEHICLE_NUMBERS = []  # Add vehicle numbers if known
   PURCHASE_DATE = "2024-07-11"  # Approximate date
   ```
   - The script will automatically calculate `investor_amount` from your CSV
   - Other fields (total_cost, bank_loan_amount, etc.) can be set to 0 if unknown

### Step 4: Run the Script
```bash
python upload_investments_csv.py
```

The script will:
- Read the CSV file
- Generate SQL INSERT queries
- Save them to `generated_insert_queries.sql`

### Step 5: Review and Execute SQL
1. Open `generated_insert_queries.sql` in a text editor
2. Review the queries to ensure they look correct
3. Go to Supabase Dashboard → SQL Editor
4. Copy and paste the entire SQL script
5. Click "Run" to execute

### Step 6: Verify Data
1. Check the `investors` table to see if investors were inserted/updated
2. Check the `investor_investments` table to see if investments were inserted
3. Verify the amounts and dates are correct

## How It Works

### Investor Data
- The script creates/updates investors based on their **email** (unique identifier)
- If an investor with the same email already exists, it updates their name and phone
- Phone numbers are cleaned (removes +, spaces, etc.)

### Investment Data
- Each row in the CSV creates an investment record
- Investment percentage is automatically calculated: `(investment_amount / total_pool_investment) * 100`
- Dates are parsed from various formats (e.g., "11 July 2024")
- Amounts are cleaned (removes ₹ symbol and commas)

### Data Mapping

| CSV Column | Database Table | Database Column | Notes |
|------------|---------------|-----------------|-------|
| Name | `investors` | `investor_name` | Required |
| Email | `investors` | `email` | Unique identifier |
| Phone Number | `investors` | `phone` | Cleaned (removes +, spaces) |
| Amount | `investor_investments` | `investment_amount` | Cleaned (removes ₹, commas) |
| Date | `investor_investments` | `created_at` | Parsed to TIMESTAMPTZ |
| Invoice No | - | - | Not stored (for reference only) |
| Received By | - | - | Not stored |
| Receiver Email | - | - | Not stored |
| Receiver Account Number | - | - | Not stored |
| Receipt Status | - | - | Not stored |
| isUSA | - | - | Not stored |
| isWelcomeMail | - | - | Not stored |

## Troubleshooting

### Error: File not found
- Make sure the CSV file is in the same directory as the script
- Check the filename matches exactly: `Anilsiva Investment Receipts - Investments.csv`

### Error: Could not parse date
- The script tries multiple date formats
- If your dates are in a different format, update the `parse_date()` function

### Error: Could not parse amount
- Make sure amounts are in format: `₹8,00,000` or `800000`
- The script removes ₹ symbol and commas automatically

### Duplicate investors
- The script handles duplicates using `ON CONFLICT (email) DO UPDATE`
- If an investor with the same email exists, their data will be updated

### Missing purchase_id
- If using an existing pool: You MUST provide a valid `purchase_id` from your `company_pools` table
- If creating a new pool: Set `USE_EXISTING_POOL = False` and configure the pool settings
- The script will automatically create the pool and link investments to it

## Notes
- The script uses transactions (`BEGIN`/`COMMIT`) so all inserts succeed or fail together
- Investment percentages are calculated automatically
- Phone numbers are cleaned to remove formatting
- Dates are converted to PostgreSQL TIMESTAMPTZ format
- The script generates SQL that can be run directly in Supabase SQL Editor

