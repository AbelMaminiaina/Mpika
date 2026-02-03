#!/bin/bash

# Mpikarakara - Development Start Script
# This script starts all services needed for development

set -e

echo "🚀 Starting Mpikarakara Development Environment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"

# Navigate to project root
cd "$(dirname "$0")/.."

# Start PostgreSQL and Redis with Docker
echo ""
echo -e "${YELLOW}📦 Starting PostgreSQL and Redis containers...${NC}"
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo ""
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
until docker-compose exec -T postgres pg_isready -U mpikarakara -d mpikarakara > /dev/null 2>&1; do
    echo "   Waiting for PostgreSQL..."
    sleep 2
done
echo -e "${GREEN}✓ PostgreSQL is ready${NC}"

# Wait for Redis to be ready
echo -e "${YELLOW}⏳ Waiting for Redis to be ready...${NC}"
until docker-compose exec -T redis redis-cli -a mpikarakara_redis_2024 ping > /dev/null 2>&1; do
    echo "   Waiting for Redis..."
    sleep 2
done
echo -e "${GREEN}✓ Redis is ready${NC}"

# Install backend dependencies if needed
echo ""
echo -e "${YELLOW}📦 Checking backend dependencies...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    echo "   Installing backend dependencies..."
    npm install
fi
echo -e "${GREEN}✓ Backend dependencies ready${NC}"

# Generate Prisma client and run migrations
echo ""
echo -e "${YELLOW}🗄️  Setting up database...${NC}"
npx prisma generate
npx prisma migrate dev --name init 2>/dev/null || npx prisma db push
echo -e "${GREEN}✓ Database schema synchronized${NC}"

# Start backend
echo ""
echo -e "${GREEN}🎉 Starting backend server...${NC}"
echo ""
echo "================================================"
echo "  Mpikarakara Development Environment"
echo "================================================"
echo ""
echo "  📡 Backend API:     http://localhost:3000"
echo "  🐘 PostgreSQL:      localhost:5432"
echo "  🔴 Redis:           localhost:6379"
echo "  🔧 pgAdmin:         http://localhost:5050"
echo "     (admin@mpikarakara.com / admin123)"
echo ""
echo "  To start mobile app, run in another terminal:"
echo "    cd mobile && npm start"
echo ""
echo "================================================"
echo ""

npm run dev
