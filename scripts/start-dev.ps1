# Mpikarakara - Development Start Script (Windows PowerShell)
# This script starts all services needed for development

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🚀 Starting Mpikarakara Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Navigate to project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

# Start PostgreSQL and Redis with Docker
Write-Host ""
Write-Host "📦 Starting PostgreSQL and Redis containers..." -ForegroundColor Yellow
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
Write-Host ""
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$maxRetries = 30
$retryCount = 0
do {
    Start-Sleep -Seconds 2
    $retryCount++
    try {
        $result = docker-compose exec -T postgres pg_isready -U mpikarakara -d mpikarakara 2>&1
        if ($LASTEXITCODE -eq 0) { break }
    } catch {}
    Write-Host "   Waiting for PostgreSQL... ($retryCount/$maxRetries)"
} while ($retryCount -lt $maxRetries)

if ($retryCount -ge $maxRetries) {
    Write-Host "❌ PostgreSQL failed to start" -ForegroundColor Red
    exit 1
}
Write-Host "✓ PostgreSQL is ready" -ForegroundColor Green

# Wait for Redis to be ready
Write-Host "⏳ Waiting for Redis to be ready..." -ForegroundColor Yellow
$retryCount = 0
do {
    Start-Sleep -Seconds 2
    $retryCount++
    try {
        $result = docker-compose exec -T redis redis-cli -a mpikarakara_redis_2024 ping 2>&1
        if ($result -match "PONG") { break }
    } catch {}
    Write-Host "   Waiting for Redis... ($retryCount/$maxRetries)"
} while ($retryCount -lt $maxRetries)
Write-Host "✓ Redis is ready" -ForegroundColor Green

# Install backend dependencies if needed
Write-Host ""
Write-Host "📦 Checking backend dependencies..." -ForegroundColor Yellow
Set-Location "$projectRoot\backend"
if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing backend dependencies..."
    npm install
}
Write-Host "✓ Backend dependencies ready" -ForegroundColor Green

# Generate Prisma client and run migrations
Write-Host ""
Write-Host "🗄️  Setting up database..." -ForegroundColor Yellow
npx prisma generate
try {
    npx prisma migrate dev --name init 2>&1 | Out-Null
} catch {
    npx prisma db push
}
Write-Host "✓ Database schema synchronized" -ForegroundColor Green

# Display info and start backend
Write-Host ""
Write-Host "🎉 Starting backend server..." -ForegroundColor Green
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Mpikarakara Development Environment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  📡 Backend API:     http://localhost:3000" -ForegroundColor White
Write-Host "  🐘 PostgreSQL:      localhost:5432" -ForegroundColor White
Write-Host "  🔴 Redis:           localhost:6379" -ForegroundColor White
Write-Host "  🔧 pgAdmin:         http://localhost:5050" -ForegroundColor White
Write-Host "     (admin@mpikarakara.com / admin123)" -ForegroundColor Gray
Write-Host ""
Write-Host "  To start mobile app, run in another terminal:" -ForegroundColor White
Write-Host "    cd mobile; npm start" -ForegroundColor Yellow
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

npm run dev
