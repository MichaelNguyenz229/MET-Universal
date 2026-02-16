#!/bin/bash

# Exit immediately if a command fails
set -e 

echo "🚀 Starting MET-Universal Sync..."

# 1. Pull the latest code from Google Apps Script
echo "☁️ Pulling latest code from Clasp..."
clasp pull 

# 2. Check the git status
echo "📊 Current Git Status:"
git status -s

# 3. Prompt the user for a commit message
echo "📝 Enter your commit message (or press Enter to skip git push):"
read commit_message

# 4. If a message was typed, push to GitHub
if [ -n "$commit_message" ]; then
    echo "💾 Saving to GitHub..."
    git add .
    git commit -m "$commit_message"
    git push origin main
    echo "✅ Successfully synced and pushed to GitHub!"
else
    echo "⏩ Skipped GitHub push. Local sync complete."
fi
