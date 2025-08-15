#!/bin/bash

echo "🚀 Running Supabase migrations..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Navigate to project directory
cd "$(dirname "$0")/.."

echo "📁 Project directory: $(pwd)"

# Start Supabase if not running
echo "🔧 Starting Supabase..."
supabase start

# Push migrations
echo "📤 Pushing migrations to database..."
supabase db push

echo "✅ Migrations completed successfully!"

# Show status
echo "📊 Supabase status:"
supabase status

echo "🎉 Setup complete! You can now test the admin access."
