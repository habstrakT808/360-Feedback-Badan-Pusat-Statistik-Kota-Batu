# PowerShell script to run Supabase migrations

Write-Host "🚀 Running Supabase migrations..." -ForegroundColor Green

# Check if Supabase CLI is installed
try {
    $null = Get-Command supabase -ErrorAction Stop
} catch {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Navigate to project directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectPath = Split-Path -Parent $scriptPath
Set-Location $projectPath

Write-Host "📁 Project directory: $projectPath" -ForegroundColor Cyan

# Start Supabase if not running
Write-Host "🔧 Starting Supabase..." -ForegroundColor Yellow
supabase start

# Push migrations
Write-Host "📤 Pushing migrations to database..." -ForegroundColor Yellow
supabase db push

Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green

# Show status
Write-Host "📊 Supabase status:" -ForegroundColor Cyan
supabase status

Write-Host "🎉 Setup complete! You can now test the admin access." -ForegroundColor Green
Read-Host "Press Enter to exit"
