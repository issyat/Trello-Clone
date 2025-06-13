
Write-Host "🔧 Setting up test environment..." -ForegroundColor Blue

# Navigate to project root
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

# Backend tests
Write-Host "🐍 Running backend tests..." -ForegroundColor Green
Set-Location backend

# Install dependencies if needed
Write-Host "Installing/updating Python dependencies..." -ForegroundColor Yellow
poetry install --with dev

# Run linting
Write-Host "Running Python linting..." -ForegroundColor Yellow

Write-Host "Checking Black formatting..." -ForegroundColor Cyan
poetry run black --check apps/ trello_backend/
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Black formatting failed. Run 'poetry run black apps/ trello_backend/' to fix." -ForegroundColor Red
    exit 1
}

Write-Host "Checking import sorting..." -ForegroundColor Cyan
poetry run isort --check-only apps/ trello_backend/
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ isort import sorting failed. Run 'poetry run isort apps/ trello_backend/' to fix." -ForegroundColor Red
    exit 1
}

Write-Host "Running Flake8 linting..." -ForegroundColor Cyan
poetry run flake8 apps/ trello_backend/
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Flake8 linting failed. Please fix the reported issues." -ForegroundColor Red
    exit 1
}

# Run tests with coverage
Write-Host "Running Python tests with coverage..." -ForegroundColor Yellow
$env:DJANGO_SETTINGS_MODULE = "trello_backend.test_settings"
poetry run pytest -v --cov=apps --cov-report=html --cov-report=term-missing

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend tests completed successfully!" -ForegroundColor Green

# Frontend tests
Write-Host "🌐 Running frontend tests..." -ForegroundColor Green
Set-Location ../frontend

# Install dependencies if needed
Write-Host "Installing/updating Node.js dependencies..." -ForegroundColor Yellow
npm ci

# Run linting
Write-Host "Running TypeScript/ESLint checks..." -ForegroundColor Yellow

Write-Host "Running ESLint..." -ForegroundColor Cyan
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ESLint failed. Run 'npm run lint:fix' to auto-fix issues." -ForegroundColor Red
    exit 1
}

Write-Host "Running TypeScript type checking..." -ForegroundColor Cyan
npm run type-check
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript type checking failed. Please fix the reported issues." -ForegroundColor Red
    exit 1
}

# Build to ensure everything compiles
Write-Host "Building frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend tests completed successfully!" -ForegroundColor Green

Write-Host "🎉 All tests passed! Ready for deployment." -ForegroundColor Magenta
