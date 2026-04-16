#!/usr/bin/env python3
"""
Execute RLS policy SQL against Supabase PostgreSQL database.
Uses the service role key to connect directly to the database.
"""
import os
import sys
import json
import base64

# Parse the service role JWT to understand the structure
service_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzaG9wd2x3eHRkd3lidGRpeGZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTExOTU3NiwiZXhwIjoyMDkwNjk1NTc2fQ.o1gDLCjJIYR3ipDXj8SRHS2vNNivaCp0DTOhdYaQtEM"

# The Supabase database URL follows the pattern:
# postgresql://postgres:[PASSWORD]@[PROJECT_ID].supabase.co:5432/postgres
# For service role, we need to use: postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:6543/postgres

# Since we don't have the password directly, we need to extract it from the project settings
# or use an alternative approach via the REST API with proper authorization

import requests
import json

supabase_url = "https://ashopwlwxtdwybtdixfy.supabase.co"
service_key_bearer = service_key

# Read the migration file
migration_sql = open('/Users/a2021/Desktop/x/Linger1/supabase/migrations/20260412_add_creator_insert_rls_policy.sql').read()

print("SQL to execute:")
print(migration_sql)
print("\n" + "="*50 + "\n")

# Try to execute via Supabase API
# We'll try different endpoints
endpoints_to_try = [
    ("/functions/v1/run-sql", "Edge Functions"),
    ("/rest/v1/rpc/execute_sql", "RPC Function"),
    ("/rest/v1/rpc/run_sql", "RPC Function (alternate)"),
]

for endpoint, name in endpoints_to_try:
    print(f"Trying {name} at {endpoint}...")
    try:
        response = requests.post(
            f"{supabase_url}{endpoint}",
            headers={
                "Authorization": f"Bearer {service_key_bearer}",
                "apikey": service_key_bearer,
                "Content-Type": "application/json"
            },
            json={"sql": migration_sql},
            timeout=10
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500]}")

        if response.status_code in [200, 201]:
            print(f"SUCCESS via {name}!")
            sys.exit(0)
    except Exception as e:
        print(f"Error: {e}")
    print()

print("\nAll endpoints failed. The SQL policy needs to be executed through the Supabase dashboard.")
print("The migration file is located at: /Users/a2021/Desktop/x/Linger1/supabase/migrations/20260412_add_creator_insert_rls_policy.sql")
sys.exit(1)
