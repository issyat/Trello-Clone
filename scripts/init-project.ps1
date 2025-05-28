# PowerShell script to initialize the Trello Clone project

Write-Host "🚀 Initializing Trello Clone Project..." -ForegroundColor Green

# Create additional directory structure
$directories = @(
    "backend/apps",
    "backend/apps/authentication",
    "backend/apps/projects", 
    "backend/apps/tasks",
    "backend/config",
    "backend/static",
    "backend/media",
    "frontend/src",
    "frontend/src/components",
    "frontend/src/pages",
    "frontend/src/hooks",
    "frontend/src/services",
    "frontend/src/utils",
    "frontend/src/contexts",
    "frontend/public",
    "docs",
    "scripts"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
        Write-Host "✅ Created directory: $dir" -ForegroundColor Yellow
    }
}

# Copy environment example file
if (Test-Path ".env.example") {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file from .env.example" -ForegroundColor Yellow
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Make sure Docker and Docker Compose are installed"
Write-Host "2. Run: docker-compose up --build"
Write-Host "3. Wait for all services to start"
Write-Host "4. Access the application at http://localhost:3000"
Write-Host "`n🔧 Development Commands:" -ForegroundColor Cyan
Write-Host "• Start services: docker-compose up"
Write-Host "• Stop services: docker-compose down"
Write-Host "• View logs: docker-compose logs -f"
Write-Host "• Rebuild: docker-compose up --build"

Write-Host "`n🎉 Project initialization complete!" -ForegroundColor Green
