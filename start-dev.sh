#!/bin/bash

cd /Users/a2021/Desktop/x/Linger1

# Load environment variables from .env.local
set -a
source ./.env.local
set +a

# Start Next.js dev server
/usr/local/bin/node ./node_modules/.bin/next dev
