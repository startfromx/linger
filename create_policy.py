#!/usr/bin/env python3

import os
import sys
from supabase import create_client, Client

# Load environment variables
SUPABASE_URL = "https://ashopwlwxtdwybtdixfy.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzaG9wd2x3eHRkd3lidGRpeGZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTExOTU3NiwiZXhwIjoyMDkwNjk1NTc2fQ.o1gDLCjJIYR3ipDXj8SRHS2vNNivaCp0DTOhdYaQtEM"

def create_rls_policy():
    """Create RLS policy for creator_profile table"""

    # Initialize Supabase client with service role
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # SQL query to create the policy
    sql_query = """CREATE POLICY "authenticated_insert_creator" ON creator_profile
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');"""

    print("Creating RLS policy for creator_profile table...")
    print(f"SQL: {sql_query}\n")

    try:
        # Execute the SQL using the Supabase RPC
        # Note: This requires a custom RPC function to be set up
        # For now, we'll try the REST API approach

        # Try calling a stored function if available
        response = supabase.rpc("execute_sql", {"sql": sql_query}).execute()

        print("✓ RLS policy created successfully!")
        print(f"Response: {response}")
        return True

    except Exception as e:
        print(f"✗ Error: {str(e)}")

        # If direct execution doesn't work, try alternative approach
        print("\nAttempting alternative approach...")

        try:
            # Try using the REST API directly
            import requests
            headers = {
                "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzaG9wd2x3eHRkd3lidGRpeGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTk1NzYsImV4cCI6MjA5MDY5NTU3Nn0.jGz2vbf1WyP7cP5dYcTXM6A7-ZLpQV_5ZMIGjlyhyIg",
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            }

            # This endpoint doesn't exist by default, but let's try
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/sql",
                headers=headers,
                json={"query": sql_query}
            )

            if response.status_code >= 400:
                print(f"HTTP {response.status_code}: {response.text}")
                return False

            print("✓ RLS policy created successfully!")
            print(f"Response: {response.json()}")
            return True

        except Exception as e2:
            print(f"Alternative approach failed: {str(e2)}")
            return False

if __name__ == "__main__":
    success = create_rls_policy()
    sys.exit(0 if success else 1)
