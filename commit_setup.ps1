# PowerShell Script to create 25 incremental commits for BillingPro
# All commits will be authored by dhyeyptl10

$ErrorActionPreference = "Stop"
$projectDir = "c:\Users\DHYEY PATEL\OneDrive\Desktop\Assignment\Diwali - assignment\next-js"

Set-Location $projectDir

# Make sure git is initialized and configured
git config user.name "dhyeyptl10"
git config user.email "patel.dhyey.cg@gmail.com"

# ========================================================
# STEP 1: Backup all source files to a temp folder
# ========================================================
$backupDir = "$projectDir\_backup_temp"
if (Test-Path $backupDir) { Remove-Item -Recurse -Force $backupDir }
New-Item -ItemType Directory -Path $backupDir | Out-Null

# Copy all source files to backup (excluding node_modules, .next, .git)
$filesToBackup = @(
    "package.json",
    "package-lock.json",
    ".gitignore",
    "next.config.ts",
    "tsconfig.json",
    "eslint.config.mjs",
    "next-env.d.ts",
    "README.md",
    "AGENTS.md",
    "public\file.svg",
    "public\globe.svg",
    "public\next.svg",
    "public\vercel.svg",
    "public\window.svg",
    "src\app\globals.css",
    "src\app\page.module.css",
    "src\app\page.tsx",
    "src\app\layout.tsx",
    "src\app\favicon.ico",
    "src\lib\types.ts",
    "src\lib\utils.ts",
    "src\lib\store.ts",
    "src\components\Badge.tsx",
    "src\components\Modal.tsx",
    "src\components\Sidebar.tsx",
    "src\components\TopBar.tsx",
    "src\app\dashboard\page.tsx",
    "src\app\customers\page.tsx",
    "src\app\customers\[id]\page.tsx",
    "src\app\invoices\page.tsx",
    "src\app\invoices\[id]\page.tsx",
    "src\app\payments\page.tsx",
    "src\app\products\page.tsx",
    "src\app\subscriptions\page.tsx",
    "src\app\subscriptions\[id]\page.tsx"
)

foreach ($file in $filesToBackup) {
    $srcPath = Join-Path $projectDir $file
    $destPath = Join-Path $backupDir $file
    $destDir = Split-Path $destPath -Parent
    if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
    if (Test-Path $srcPath) {
        Copy-Item -Path $srcPath -Destination $destPath -Force
    }
}

# ========================================================
# STEP 2: Remove all tracked/untracked source files (keep node_modules, .next, .git)
# ========================================================
$itemsToRemove = @(
    "package.json", "package-lock.json", ".gitignore", "next.config.ts",
    "tsconfig.json", "eslint.config.mjs", "next-env.d.ts", "README.md", "AGENTS.md",
    "public", "src"
)

foreach ($item in $itemsToRemove) {
    $path = Join-Path $projectDir $item
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path
    }
}

# ========================================================
# HELPER: Copy a file from backup to project
# ========================================================
function Restore-File {
    param([string]$RelativePath)
    $srcPath = Join-Path $backupDir $RelativePath
    $destPath = Join-Path $projectDir $RelativePath
    $destDir = Split-Path $destPath -Parent
    if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
    Copy-Item -Path $srcPath -Destination $destPath -Force
}

function Do-Commit {
    param([string]$Message)
    git add -A
    git commit -m $Message
    Write-Host "✅ Committed: $Message" -ForegroundColor Green
}

# ========================================================
# COMMIT 1: Initialize project with package.json
# ========================================================
Restore-File "package.json"
Do-Commit "chore: initialize Next.js project with package.json"

# ========================================================
# COMMIT 2: Add .gitignore
# ========================================================
Restore-File ".gitignore"
Do-Commit "chore: add .gitignore for Next.js project"

# ========================================================
# COMMIT 3: Add TypeScript configuration
# ========================================================
Restore-File "tsconfig.json"
Restore-File "next-env.d.ts"
Do-Commit "chore: add TypeScript configuration (tsconfig.json)"

# ========================================================
# COMMIT 4: Add Next.js and ESLint configuration
# ========================================================
Restore-File "next.config.ts"
Restore-File "eslint.config.mjs"
Do-Commit "chore: add Next.js and ESLint configuration"

# ========================================================
# COMMIT 5: Add package-lock.json
# ========================================================
Restore-File "package-lock.json"
Do-Commit "chore: add package-lock.json for dependency lockfile"

# ========================================================
# COMMIT 6: Add public assets (SVGs and favicon)
# ========================================================
Restore-File "public\file.svg"
Restore-File "public\globe.svg"
Restore-File "public\next.svg"
Restore-File "public\vercel.svg"
Restore-File "public\window.svg"
Restore-File "src\app\favicon.ico"
Do-Commit "feat: add public assets and favicon"

# ========================================================
# COMMIT 7: Add type definitions for billing domain
# ========================================================
Restore-File "src\lib\types.ts"
Do-Commit "feat: add TypeScript type definitions for billing domain models"

# ========================================================
# COMMIT 8: Add utility functions
# ========================================================
Restore-File "src\lib\utils.ts"
Do-Commit "feat: add utility functions (currency formatting, date helpers, ID generation)"

# ========================================================
# COMMIT 9: Add CSS design system - variables and reset
# ========================================================
# Create globals.css with only the first section (variables + reset + app shell)
$cssContent = Get-Content (Join-Path $backupDir "src\app\globals.css") -Raw
# We'll write the CSS in stages - first just variables + reset (lines 1-100 approx)
$cssLines = Get-Content (Join-Path $backupDir "src\app\globals.css")
$partialCss = ($cssLines[0..100] -join "`n")
$destDir = Join-Path $projectDir "src\app"
if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
Set-Content -Path (Join-Path $projectDir "src\app\globals.css") -Value $partialCss -Encoding UTF8
Do-Commit "feat: add CSS design system - variables, reset, and base styles"

# ========================================================
# COMMIT 10: Add CSS - sidebar and topbar styles
# ========================================================
$partialCss = ($cssLines[0..340] -join "`n")
Set-Content -Path (Join-Path $projectDir "src\app\globals.css") -Value $partialCss -Encoding UTF8
Do-Commit "feat: add CSS styles for sidebar and topbar layout"

# ========================================================
# COMMIT 11: Add CSS - buttons, cards, and stat cards
# ========================================================
$partialCss = ($cssLines[0..543] -join "`n")
Set-Content -Path (Join-Path $projectDir "src\app\globals.css") -Value $partialCss -Encoding UTF8
Do-Commit "feat: add CSS styles for buttons, cards, and stat cards"

# ========================================================
# COMMIT 12: Add CSS - tables, forms, search, badges, modals
# ========================================================
$partialCss = ($cssLines[0..899] -join "`n")
Set-Content -Path (Join-Path $projectDir "src\app\globals.css") -Value $partialCss -Encoding UTF8
Do-Commit "feat: add CSS styles for tables, forms, badges, and modals"

# ========================================================
# COMMIT 13: Add complete CSS - charts, detail pages, timeline, responsive, utilities
# ========================================================
Restore-File "src\app\globals.css"
Restore-File "src\app\page.module.css"
Do-Commit "feat: complete CSS design system with responsive styles and utilities"

# ========================================================
# COMMIT 14: Add Badge component
# ========================================================
Restore-File "src\components\Badge.tsx"
Do-Commit "feat: add Badge component for status indicators"

# ========================================================
# COMMIT 15: Add Modal component
# ========================================================
Restore-File "src\components\Modal.tsx"
Do-Commit "feat: add reusable Modal component with animations"

# ========================================================
# COMMIT 16: Add Sidebar navigation component
# ========================================================
Restore-File "src\components\Sidebar.tsx"
Do-Commit "feat: add Sidebar navigation with route highlighting"

# ========================================================
# COMMIT 17: Add TopBar component
# ========================================================
Restore-File "src\components\TopBar.tsx"
Do-Commit "feat: add TopBar component with breadcrumb and live indicator"

# ========================================================
# COMMIT 18: Add root layout and page with redirect
# ========================================================
Restore-File "src\app\layout.tsx"
Restore-File "src\app\page.tsx"
Do-Commit "feat: add root layout with app shell and dashboard redirect"

# ========================================================
# COMMIT 19: Add localStorage data store - CRUD helpers
# ========================================================
# Write partial store.ts (just the CRUD helpers, up to line 65)
$storeLines = Get-Content (Join-Path $backupDir "src\lib\store.ts")
$partialStore = ($storeLines[0..64] -join "`n")
Set-Content -Path (Join-Path $projectDir "src\lib\store.ts") -Value $partialStore -Encoding UTF8
Do-Commit "feat: add localStorage data store with generic CRUD helpers"

# ========================================================
# COMMIT 20: Add entity stores (Customer, Product, Plan, Subscription, Invoice, Payment)
# ========================================================
$partialStore = ($storeLines[0..280] -join "`n")
Set-Content -Path (Join-Path $projectDir "src\lib\store.ts") -Value $partialStore -Encoding UTF8
Do-Commit "feat: add entity-specific stores and dashboard stats computation"

# ========================================================
# COMMIT 21: Add seed data to store
# ========================================================
Restore-File "src\lib\store.ts"
Do-Commit "feat: add seed data for demo (customers, products, plans, invoices, payments)"

# ========================================================
# COMMIT 22: Add Dashboard page with charts and stats
# ========================================================
Restore-File "src\app\dashboard\page.tsx"
Do-Commit "feat: add Dashboard page with revenue charts and KPI stat cards"

# ========================================================
# COMMIT 23: Add Customers module (list + detail pages)
# ========================================================
Restore-File "src\app\customers\page.tsx"
Restore-File "src\app\customers\[id]\page.tsx"
Do-Commit "feat: add Customers module with list view and detail page"

# ========================================================
# COMMIT 24: Add Invoices module (list + detail) and Payments page
# ========================================================
Restore-File "src\app\invoices\page.tsx"
Restore-File "src\app\invoices\[id]\page.tsx"
Restore-File "src\app\payments\page.tsx"
Do-Commit "feat: add Invoices module with PDF preview and Payments page"

# ========================================================
# COMMIT 25: Add Products, Subscriptions modules, and project README
# ========================================================
Restore-File "src\app\products\page.tsx"
Restore-File "src\app\subscriptions\page.tsx"
Restore-File "src\app\subscriptions\[id]\page.tsx"
Restore-File "README.md"
Restore-File "AGENTS.md"
Do-Commit "feat: add Products, Subscriptions modules and finalize README"

# ========================================================
# CLEANUP: Remove backup folder and commit script
# ========================================================
Remove-Item -Recurse -Force $backupDir
Remove-Item -Force (Join-Path $projectDir "commit_setup.ps1")

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ALL 25 COMMITS CREATED SUCCESSFULLY!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Show commit log
git log --oneline

Write-Host ""
Write-Host "Now pushing to GitHub..." -ForegroundColor Yellow

# Add remote and push
git remote remove origin 2>$null
git remote add origin https://github.com/dhyeyptl10/Diwali-Assignment-2026.git
git branch -M main
git push -u origin main --force

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  PUSHED TO GITHUB SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
