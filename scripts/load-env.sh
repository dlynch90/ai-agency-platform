#!/bin/bash
# Environment Loading Script
# Loads environment variables from .env file

set -a
source .env
set +a

echo "✅ Environment variables loaded from .env file"
