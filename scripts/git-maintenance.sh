#!/bin/bash
set -e

echo "=== Git Health & Maintenance ==="
echo "Date: $(date)"

# 1. Fetch and Prune
echo "--- Fetching and Pruning ---"
git fetch --all --prune

# 2. Check Status
echo "--- Git Status ---"
git status

# 3. Local Branch Cleanup (Merged branches)
echo "--- Cleaning up merged branches ---"
git branch --merged main | grep -v "^\* main" | grep -v "master" | xargs -n 1 git branch -d || echo "No merged branches to delete."

# 4. Garbage Collection
echo "--- Running Garbage Collection ---"
git gc --auto

echo "=== Git Maintenance Complete ==="
