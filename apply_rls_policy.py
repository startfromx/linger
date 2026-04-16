#!/usr/bin/env python3
"""
Apply RLS Policy to creator_profile table using Supabase Python client.
"""

from supabase import create_client
import os
import sys

# Configuration
SUPABASE_URL = "https://ashopwlwxtdwybtdixfy.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzaG9wd2x3eHRkd3lidGRpeGZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTExOTU3NiwiZXhwIjoyMDkwNjk1NTc2fQ.o1gDLCjJIYR3ipDXj8SRHS2vNNivaCp0DTOhdYaQtEM"

SQL_POLICY = """
CREATE POLICY "authenticated_insert_creator" ON creator_profile
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
"""

def main():
    print("Attempting to apply RLS policy using Supabase Python client...\n")

    try:
        # Create Supabase client with service role key
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        print(f"Connected to Supabase at {SUPABASE_URL}")
        print(f"Using service role authentication\n")

        # Execute the SQL
        print(f"Executing SQL:\n{SQL_POLICY}\n")

        # Use the rpc method to execute custom SQL
        # Note: This requires a PL/pgSQL function to be available
        try:
            response = supabase.rpc("execute_sql", {
                "sql": SQL_POLICY
            }).execute()
            print(f"✓ Policy applied successfully!")
            print(f"Response: {response}\n")
            return True
        except Exception as e:
            print(f"RPC method not available: {e}")
            print("\nTrying alternative approach via postgrest...\n")

        # Try alternative approach - we can't directly execute arbitrary SQL
        # via the Supabase Python client without a specific RPC function
        # The dashboard method is the recommended approach
        print("Note: Direct SQL execution via Python client requires a PL/pgSQL function")
        print("Please apply the policy through the Supabase dashboard:")
        print(f"1. Go to: https://supabase.com/dashboard/project/ashopwlwxtdwybtdixfy/sql/new")
        print(f"2. Paste the SQL:")
        print(f"   {SQL_POLICY}")
        print(f"3. Click 'Run'")

        return False

    except Exception as e:
        print(f"✗ Error: {e}")
        print("\nPlease apply the policy manually through the Supabase dashboard.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
