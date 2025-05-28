#!/usr/bin/env bash
# filepath: c:\Users\ismai\OneDrive\Bureau\TrelloClone\scripts\run-tests.sh

set -e

echo "🔧 Setting up test environment..."

# Navigate to project root
cd "$(dirname "$0")/.."

# Backend tests
echo "🐍 Running backend tests..."
cd backend

# Install dependencies if needed
echo "Installing/updating Python dependencies..."
poetry install --with dev

# Run linting
echo "Running Python linting..."
poetry run black --check apps/ trello_backend/ || {
    echo "❌ Black formatting failed. Run 'poetry run black apps/ trello_backend/' to fix."
    exit 1
}

poetry run isort --check-only apps/ trello_backend/ || {
    echo "❌ isort import sorting failed. Run 'poetry run isort apps/ trello_backend/' to fix."
    exit 1
}

poetry run flake8 apps/ trello_backend/ || {
    echo "❌ Flake8 linting failed. Please fix the reported issues."
    exit 1
}

# Run tests with coverage
echo "Running Python tests with coverage..."
export DJANGO_SETTINGS_MODULE=trello_backend.test_settings
poetry run pytest -v --cov=apps --cov-report=html --cov-report=term-missing

echo "✅ Backend tests completed successfully!"

# Frontend tests
echo "🌐 Running frontend tests..."
cd ../frontend

# Install dependencies if needed
echo "Installing/updating Node.js dependencies..."
npm ci

# Run linting
echo "Running TypeScript/ESLint checks..."
npm run lint || {
    echo "❌ ESLint failed. Run 'npm run lint:fix' to auto-fix issues."
    exit 1
}

npm run type-check || {
    echo "❌ TypeScript type checking failed. Please fix the reported issues."
    exit 1
}

# Build to ensure everything compiles
echo "Building frontend..."
npm run build

echo "✅ Frontend tests completed successfully!"

echo "🎉 All tests passed! Ready for deployment."
