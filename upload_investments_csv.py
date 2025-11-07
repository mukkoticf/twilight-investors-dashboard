#!/usr/bin/env python3
"""
CSV to SQL Upload Script for Anilsiva Investment Receipts
This script reads the CSV file and generates SQL INSERT queries for investors and investments.
"""

import csv
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# Configuration
CSV_FILE_PATH = "Anilsiva Investment Receipts - Investments.csv"
OUTPUT_SQL_FILE = "generated_insert_queries.sql"

# Database configuration - UPDATE THESE VALUES
# Option 1: Use existing pool - provide the purchase_id (UUID) from company_pools table
# Option 2: Create new pool - set CREATE_NEW_POOL = True and provide pool details below
USE_EXISTING_POOL = False  # Set to False to create a new pool
EXISTING_PURCHASE_ID = "YOUR_PURCHASE_ID_HERE"  # Only used if USE_EXISTING_POOL = True

# Pool creation settings (only used if USE_EXISTING_POOL = False)
POOL_NAME = "Anilsiva Pool"  # Name for the new pool
POOL_DESCRIPTION = "Pool for Anilsiva company investments"  # Description
OWNER_NAMES = ["Anilsiva"]  # Array of company names
VEHICLE_NUMBERS = []  # Array of vehicle numbers (leave empty if unknown)
PURCHASE_DATE = "2024-07-11"  # Approximate purchase date (YYYY-MM-DD format)
TOTAL_COST = 0  # Total cost (set to 0 if unknown, will be calculated from investments)
BANK_LOAN_AMOUNT = 0  # Bank loan amount (set to 0 if unknown)
INVESTOR_AMOUNT = 0  # Will be calculated from CSV investments if set to 0
MONTHLY_EMI = 0  # Monthly EMI (set to 0 if unknown)
EMERGENCY_FUND_COLLECTED = 0  # Emergency fund collected (set to 0 if unknown)
EMERGENCY_FUND_COMPANY_SHARE = 0  # Company share of emergency fund
EMERGENCY_FUND_INVESTOR_SHARE = 0  # Investor share of emergency fund
EMERGENCY_FUND_REMAINING = 0  # Remaining emergency fund

# Date format in CSV (adjust if different)
DATE_FORMAT = "%d %B %Y"  # e.g., "11 July 2024"
ALTERNATIVE_DATE_FORMAT = "%d %b %Y"  # e.g., "11 Jul 2024"


def clean_phone(phone: str) -> str:
    """Clean phone number by removing +, spaces, and handling errors."""
    if not phone or phone.strip() == "#ERROR!":
        return ""
    # Remove +, spaces, parentheses, hyphens
    cleaned = re.sub(r'[\+\s\(\)\-]', '', phone.strip())
    return cleaned


def clean_amount(amount: str) -> float:
    """Convert amount string (₹8,00,000) to float (800000.0)."""
    if not amount:
        return 0.0
    # Remove ₹, commas, and spaces
    cleaned = re.sub(r'[₹,\s]', '', amount.strip())
    try:
        return float(cleaned)
    except ValueError:
        print(f"Warning: Could not parse amount: {amount}")
        return 0.0


def parse_date(date_str: str) -> Optional[str]:
    """Parse date string to PostgreSQL TIMESTAMPTZ format."""
    if not date_str or date_str.strip() == "":
        return None
    
    date_str = date_str.strip()
    
    # Try different date formats
    formats = [
        "%d %B %Y",      # 11 July 2024
        "%d %b %Y",      # 11 Jul 2024
        "%d-%m-%Y",      # 11-07-2024
        "%d/%m/%Y",      # 11/07/2024
        "%Y-%m-%d",      # 2024-07-11
    ]
    
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            # Return in PostgreSQL TIMESTAMPTZ format
            return dt.strftime("%Y-%m-%d %H:%M:%S+00")
        except ValueError:
            continue
    
    print(f"Warning: Could not parse date: {date_str}")
    return None


def sanitize_sql_string(value: str) -> str:
    """Sanitize string for SQL (escape single quotes)."""
    if not value:
        return "NULL"
    # Escape single quotes by doubling them
    escaped = value.replace("'", "''")
    return f"'{escaped}'"


def generate_investor_insert(investor_data: Dict) -> str:
    """Generate SQL INSERT statement for investors table."""
    investor_name = sanitize_sql_string(investor_data.get('Name', '').strip())
    email = sanitize_sql_string(investor_data.get('Email', '').strip())
    phone = sanitize_sql_string(clean_phone(investor_data.get('Phone Number', '')))
    
    # Use email as unique identifier, or phone if email is missing
    # Note: email is UNIQUE in the database, so we'll use ON CONFLICT handling
    
    sql = f"""
-- Investor: {investor_data.get('Name', 'Unknown')}
INSERT INTO public.investors (investor_name, email, phone, is_active, created_at)
VALUES ({investor_name}, {email if email != "NULL" else "NULL"}, {phone if phone != "NULL" else "NULL"}, true, NOW())
ON CONFLICT (email) DO UPDATE SET
    investor_name = EXCLUDED.investor_name,
    phone = COALESCE(EXCLUDED.phone, investors.phone),
    updated_at = NOW()
RETURNING investor_id;
"""
    return sql


def generate_pool_insert(pool_config: Dict, total_investment: float) -> str:
    """Generate SQL INSERT statement for creating a new company_pools entry."""
      # If investor_amount is 0, use total_investment from CSV (this is from CSV data, not auto-calculated)
    investor_amount = pool_config.get('investor_amount', 0)
    if investor_amount == 0:
        investor_amount = total_investment
    
    # Use exact values from config - no auto-calculation
    total_cost = pool_config.get('total_cost', 0)
    bank_loan_amount = pool_config.get('bank_loan_amount', 0)
    
    # Format vehicle numbers array
    vehicle_numbers = pool_config.get('vehicle_numbers', [])
    if vehicle_numbers:
        vehicle_array = "ARRAY[" + ", ".join([sanitize_sql_string(v) for v in vehicle_numbers]) + "]"
    else:
        vehicle_array = "ARRAY[]::TEXT[]"
    
    # Format owner names array
    owner_names = pool_config.get('owner_names', [])
    owner_array = "ARRAY[" + ", ".join([sanitize_sql_string(o) for o in owner_names]) + "]"
    
    sql = f"""
-- Create new pool: {pool_config.get('pool_name', 'Unknown')}
INSERT INTO public.company_pools (
    pool_name,
    description,
    owner_names,
    vehicle_numbers,
    purchase_date,
    total_cost,
    bank_loan_amount,
    investor_amount,
    monthly_emi,
    emergency_fund_collected,
    emergency_fund_company_share,
    emergency_fund_investor_share,
    emergency_fund_remaining,
    status
)
VALUES (
    {sanitize_sql_string(pool_config.get('pool_name', 'Unknown'))},
    {sanitize_sql_string(pool_config.get('description', ''))},
    {owner_array},
    {vehicle_array},
    {sanitize_sql_string(pool_config.get('purchase_date', ''))}::DATE,
    {total_cost},
    {bank_loan_amount},
    {investor_amount},
    {pool_config.get('monthly_emi', 0)},
    {pool_config.get('emergency_fund_collected', 0)},
    {pool_config.get('emergency_fund_company_share', 0)},
    {pool_config.get('emergency_fund_investor_share', 0)},
    {pool_config.get('emergency_fund_remaining', 0)},
    'Active'
)
RETURNING purchase_id;
"""
    return sql


def generate_investment_insert(investor_id_placeholder: str, investment_data: Dict, purchase_id: str, total_pool_investment: float) -> str:
    """Generate SQL INSERT statement for investor_investments table."""
    amount = clean_amount(investment_data.get('Amount', '0'))
    date_str = parse_date(investment_data.get('Date', ''))
    
    if amount == 0:
        print(f"Warning: Investment amount is 0 for {investment_data.get('Name', 'Unknown')}")
        return ""
    
    # Calculate investment percentage
    # investment_percentage = (investment_amount / total_investor_amount) * 100
    if total_pool_investment > 0:
        investment_percentage = (amount / total_pool_investment) * 100
    else:
        investment_percentage = 0.0
        print(f"Warning: Total pool investment is 0, cannot calculate percentage")
    
    created_at = date_str if date_str else "NOW()"
    
    # Check if purchase_id is a subquery (for new pools) or a UUID string
    if purchase_id.startswith("(SELECT"):
        purchase_id_expr = purchase_id
    else:
        purchase_id_expr = f"{sanitize_sql_string(purchase_id)}::UUID"
    
    sql = f"""
-- Investment: {investment_data.get('Name', 'Unknown')} - {investment_data.get('Amount', '0')}
INSERT INTO public.investor_investments (
    investor_id,
    purchase_id,
    investment_amount,
    investment_percentage,
    created_at
)
SELECT 
    i.investor_id,
    {purchase_id_expr},
    {amount},
    {investment_percentage:.4f},
    {created_at if isinstance(created_at, str) and created_at != "NOW()" else "NOW()"}
FROM public.investors i
WHERE i.email = {sanitize_sql_string(investment_data.get('Email', '').strip())}
ON CONFLICT DO NOTHING;
"""
    return sql


def read_csv_file(file_path: str) -> List[Dict]:
    """Read CSV file and return list of dictionaries."""
    investments = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            # Try to detect delimiter
            sample = f.read(1024)
            f.seek(0)
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(sample).delimiter
            
            reader = csv.DictReader(f, delimiter=delimiter)
            
            for row in reader:
                # Skip empty rows
                if not any(row.values()):
                    continue
                investments.append(row)
        
        print(f"[OK] Successfully read {len(investments)} rows from CSV")
        return investments
    
    except FileNotFoundError:
        print(f"[ERROR] File '{file_path}' not found!")
        print(f"   Please make sure the CSV file is in the same directory as this script.")
        return []
    except Exception as e:
        print(f"[ERROR] Error reading CSV file: {e}")
        return []


def calculate_total_investment_amount(investments: List[Dict]) -> float:
    """Calculate total investment amount from all investments."""
    total = 0.0
    for inv in investments:
        amount = clean_amount(inv.get('Amount', '0'))
        total += amount
    return total


def generate_sql_queries(investments: List[Dict], purchase_id: Optional[str] = None, create_new_pool: bool = False, pool_config: Optional[Dict] = None) -> str:
    """Generate complete SQL script with all INSERT statements."""
    
    if not investments:
        return "-- No investments to process"
    
    # Calculate total pool investment for percentage calculation
    total_pool_investment = calculate_total_investment_amount(investments)
    
    sql_output = f"""-- =====================================================
-- GENERATED SQL QUERIES FOR INVESTMENT UPLOAD
-- =====================================================
-- Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
-- Total investments: {len(investments)}
-- Total investment amount: ₹{total_pool_investment:,.2f}
-- =====================================================

BEGIN;

"""
    
    # Step 0: Create new pool if needed
    if create_new_pool and pool_config:
        sql_output += "-- Step 0: Create New Pool\n"
        sql_output += "-- =====================================================\n"
        
        # Update pool_config with calculated investor_amount
        pool_config['investor_amount'] = total_pool_investment
        pool_insert = generate_pool_insert(pool_config, total_pool_investment)
        
        # Add the pool insert (without RETURNING, we'll use a subquery)
        pool_sql_clean = pool_insert.replace("RETURNING purchase_id;", ";")
        sql_output += pool_sql_clean
        sql_output += "\n"
        
        # For investments, we'll use a subquery to get the purchase_id
        purchase_id_placeholder = "(SELECT purchase_id FROM public.company_pools WHERE pool_name = " + sanitize_sql_string(pool_config.get('pool_name', '')) + " ORDER BY created_at DESC LIMIT 1)"
    elif purchase_id:
        purchase_id_placeholder = sanitize_sql_string(purchase_id) + "::UUID"
    else:
        return "-- ERROR: No purchase_id provided and create_new_pool is False"
    
    sql_output += "-- Step 1: Insert/Update Investors\n"
    sql_output += "-- =====================================================\n"
    
    # Track unique investors by email
    seen_emails = set()
    
    # Generate investor inserts
    for idx, inv in enumerate(investments, 1):
        email = inv.get('Email', '').strip()
        if email and email not in seen_emails:
            sql_output += f"\n-- Investor {idx}: {inv.get('Name', 'Unknown')}\n"
            sql_output += generate_investor_insert(inv)
            seen_emails.add(email)
    
    sql_output += "\n\n-- Step 2: Insert Investments\n"
    sql_output += "-- =====================================================\n"
    
    # Generate investment inserts
    for idx, inv in enumerate(investments, 1):
        sql_output += f"\n-- Investment {idx}: {inv.get('Name', 'Unknown')} - {inv.get('Amount', '0')}\n"
        # Use the appropriate purchase_id reference
        purchase_id_to_use = purchase_id_placeholder
        investment_sql = generate_investment_insert("", inv, purchase_id_to_use, total_pool_investment)
        if investment_sql:
            sql_output += investment_sql
    
    sql_output += "\n\nCOMMIT;\n"
    sql_output += "\n-- =====================================================\n"
    sql_output += "-- END OF GENERATED QUERIES\n"
    sql_output += "-- =====================================================\n"
    
    return sql_output


def main():
    """Main function to orchestrate the CSV to SQL conversion."""
    print("=" * 60)
    print("CSV to SQL Upload Script for Investment Receipts")
    print("=" * 60)
    print()
    
    # Read CSV file first to get total investment amount
    print(f"Reading CSV file: {CSV_FILE_PATH}")
    investments = read_csv_file(CSV_FILE_PATH)
    
    if not investments:
        print("No data to process. Exiting...")
        return
    
    # Show summary
    print(f"\n[SUMMARY]")
    print(f"   Total rows: {len(investments)}")
    unique_emails = set(inv.get('Email', '').strip() for inv in investments if inv.get('Email', '').strip())
    print(f"   Unique investors: {len(unique_emails)}")
    total_amount = calculate_total_investment_amount(investments)
    print(f"   Total investment amount: Rs. {total_amount:,.2f}")
    print()
    
    # Determine pool handling
    purchase_id = None
    create_new_pool = False
    pool_config = None
    
    if USE_EXISTING_POOL:
        if EXISTING_PURCHASE_ID == "YOUR_PURCHASE_ID_HERE":
            print("[WARNING] Configuration: USE_EXISTING_POOL is True but EXISTING_PURCHASE_ID is not set!")
            print()
            print("Options:")
            print("1. Set USE_EXISTING_POOL = False to create a new pool")
            print("2. Set EXISTING_PURCHASE_ID to an existing pool UUID")
            print()
            response = input("Do you want to create a new pool instead? (yes/no): ")
            if response.lower() == 'yes':
                create_new_pool = True
                pool_config = {
                    'pool_name': POOL_NAME,
                    'description': POOL_DESCRIPTION,
                    'owner_names': OWNER_NAMES,
                    'vehicle_numbers': VEHICLE_NUMBERS,
                    'purchase_date': PURCHASE_DATE,
                    'total_cost': TOTAL_COST,
                    'bank_loan_amount': BANK_LOAN_AMOUNT,
                    'investor_amount': total_amount,  # Will be calculated
                    'monthly_emi': MONTHLY_EMI,
                    'emergency_fund_collected': EMERGENCY_FUND_COLLECTED,
                    'emergency_fund_company_share': EMERGENCY_FUND_COMPANY_SHARE,
                    'emergency_fund_investor_share': EMERGENCY_FUND_INVESTOR_SHARE,
                    'emergency_fund_remaining': EMERGENCY_FUND_REMAINING,
                }
            else:
                print("Exiting... Please update the configuration.")
                return
        else:
            purchase_id = EXISTING_PURCHASE_ID
            print(f"[OK] Using existing pool: {EXISTING_PURCHASE_ID}")
    else:
        create_new_pool = True
        pool_config = {
            'pool_name': POOL_NAME,
            'description': POOL_DESCRIPTION,
            'owner_names': OWNER_NAMES,
            'vehicle_numbers': VEHICLE_NUMBERS,
            'purchase_date': PURCHASE_DATE,
            'total_cost': TOTAL_COST,
            'bank_loan_amount': BANK_LOAN_AMOUNT,
            'investor_amount': total_amount,  # Will be calculated
            'monthly_emi': MONTHLY_EMI,
            'emergency_fund_collected': EMERGENCY_FUND_COLLECTED,
            'emergency_fund_company_share': EMERGENCY_FUND_COMPANY_SHARE,
            'emergency_fund_investor_share': EMERGENCY_FUND_INVESTOR_SHARE,
            'emergency_fund_remaining': EMERGENCY_FUND_REMAINING,
        }
        print(f"[OK] Will create new pool: {POOL_NAME}")
    
    print()
    
    # Generate SQL queries
    print("Generating SQL queries...")
    sql_queries = generate_sql_queries(investments, purchase_id, create_new_pool, pool_config)
    
    # Write to file
    try:
        with open(OUTPUT_SQL_FILE, 'w', encoding='utf-8') as f:
            f.write(sql_queries)
        print(f"[OK] SQL queries written to: {OUTPUT_SQL_FILE}")
    except Exception as e:
        print(f"[ERROR] Error writing SQL file: {e}")
        return
    
    print()
    print("=" * 60)
    print("[SUCCESS] Done!")
    print("=" * 60)
    print(f"Next steps:")
    print(f"1. Review the generated SQL file: {OUTPUT_SQL_FILE}")
    if create_new_pool:
        print(f"2. The script will create a new pool: {POOL_NAME}")
    else:
        print(f"2. Using existing pool: {purchase_id}")
    print(f"3. Execute the SQL in your Supabase SQL Editor")
    print(f"4. Verify the data was inserted correctly")
    print()


if __name__ == "__main__":
    main()

