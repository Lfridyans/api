@echo off
REM Script untuk setup dan push ke GitHub
REM Repository: https://github.com/Lfridyans/injourneyairports.git

echo ============================================
echo   Setup GitHub Repository
echo ============================================
echo.

REM Step 1: Initialize git (jika belum)
echo [1/6] Checking git repository...
if not exist .git (
    echo Initializing git repository...
    git init
    echo ✓ Git repository initialized
) else (
    echo ✓ Git repository already exists
)
echo.

REM Step 2: Check .gitignore
echo [2/6] Checking .gitignore...
findstr /C:".env" .gitignore >nul
if %errorlevel% equ 0 (
    echo ✓ .env is already in .gitignore
) else (
    echo ⚠ Warning: .env might not be in .gitignore
)
echo.

REM Step 3: Add remote (check if already exists)
echo [3/6] Setting up remote repository...
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    git remote add origin https://github.com/Lfridyans/injourneyairports.git
    echo ✓ Remote added
) else (
    echo ✓ Remote already exists
    git remote set-url origin https://github.com/Lfridyans/injourneyairports.git
    echo ✓ Remote URL updated
)
echo.

REM Step 4: Check if .env exists and warn
echo [4/6] Checking for sensitive files...
if exist .env (
    echo ⚠ WARNING: .env file exists - Make sure it's in .gitignore!
    git check-ignore .env >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✓ .env is properly ignored by git
    ) else (
        echo ❌ ERROR: .env is NOT ignored! Please check .gitignore
        pause
        exit /b 1
    )
) else (
    echo ✓ No .env file found (this is OK if you haven't created it yet)
)
echo.

REM Step 5: Add all files
echo [5/6] Adding files to git...
git add .
echo ✓ Files added
echo.

REM Step 6: Show status and instructions
echo [6/6] Git status:
git status
echo.
echo ============================================
echo   NEXT STEPS:
echo ============================================
echo.
echo 1. Review the files above to make sure .env is NOT listed
echo 2. If .env is listed, STOP and fix .gitignore first!
echo 3. Commit the files:
echo    git commit -m "Initial commit: Nataru Traffic Predictor"
echo.
echo 4. Rename branch to main:
echo    git branch -M main
echo.
echo 5. Push to GitHub (you'll need your token):
echo    git push -u origin main
echo.
echo    When prompted:
echo    - Username: Lfridyans
echo    - Password: YOUR_GITHUB_TOKEN (masukkan token Anda)
echo.
echo ============================================
echo.
pause

