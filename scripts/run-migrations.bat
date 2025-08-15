@echo off
echo 🚀 Running Supabase migrations...

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI not found. Please install it first:
    echo    npm install -g supabase
    pause
    exit /b 1
)

REM Navigate to project directory
cd /d "%~dp0\.."

echo 📁 Project directory: %cd%

REM Start Supabase if not running
echo 🔧 Starting Supabase...
supabase start

REM Push migrations
echo 📤 Pushing migrations to database...
supabase db push

echo ✅ Migrations completed successfully!

REM Show status
echo 📊 Supabase status:
supabase status

echo 🎉 Setup complete! You can now test the admin access.
pause
