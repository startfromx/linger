#!/usr/bin/env python3
import requests
import json

supabase_url = "https://ashopwlwxtdwybtdixfy.supabase.co"
supabase_service_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzaG9wd2x3eHRkd3lidGRpeGZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTExOTU3NiwiZXhwIjoyMDkwNjk1NTc2fQ.o1gDLCjJIYR3ipDXj8SRHS2vNNivaCp0DTOhdYaQtEM"

# SQL command to execute
sql_command = """CREATE POLICY "authenticated_insert_creator" ON creator_profile
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');"""

headers = {
    "apikey": supabase_service_key,
    "Authorization": f"Bearer {supabase_service_key}",
    "Content-Type": "application/json"
}

try:
    # Try to execute using rpc if such a function exists
    response = requests.post(
        f"{supabase_url}/rest/v1/rpc/exec_sql",
        headers=headers,
        json={"sql": sql_command}
    )
    print(f"RPC Response: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {str(e)}")
