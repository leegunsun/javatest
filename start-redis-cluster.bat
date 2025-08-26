@echo off
echo 🚀 Redis Cluster Starting Script
echo ==============================

REM Check if Docker is running
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running or not installed
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

echo ✅ Docker is running

REM Stop any existing Redis containers
echo 🛑 Stopping existing Redis containers...
docker-compose down >nul 2>&1

REM Start Redis cluster nodes
echo 🚀 Starting Redis cluster nodes...
docker-compose up -d redis-node-1 redis-node-2 redis-node-3 redis-node-4 redis-node-5 redis-node-6

if errorlevel 1 (
    echo ❌ Failed to start Redis nodes
    pause
    exit /b 1
)

echo ⏳ Waiting for nodes to be ready...
timeout /t 15 /nobreak >nul

REM Check if nodes are running
echo 📊 Checking node status...
docker ps | findstr redis-node
if errorlevel 1 (
    echo ❌ Redis nodes are not running properly
    echo Checking logs...
    docker-compose logs redis-node-1
    pause
    exit /b 1
)

REM Initialize cluster
echo 🔧 Initializing Redis cluster...
docker run --rm --network javatest_redis_cluster_network redis:7-alpine redis-cli --cluster create redis-node-1:6379 redis-node-2:6379 redis-node-3:6379 redis-node-4:6379 redis-node-5:6379 redis-node-6:6379 --cluster-replicas 1 --cluster-yes

if errorlevel 1 (
    echo ❌ Failed to initialize cluster
    echo Trying alternative initialization...
    docker-compose up -d redis-cluster-init
)

echo ⏳ Waiting for cluster initialization...
timeout /t 10 /nobreak >nul

REM Test cluster
echo 🧪 Testing cluster connectivity...
docker run --rm --network javatest_redis_cluster_network redis:7-alpine redis-cli -h redis-node-1 -p 6379 ping

if errorlevel 1 (
    echo ❌ Cluster test failed
    echo Checking detailed logs...
    docker-compose logs --tail=20
    pause
    exit /b 1
)

echo ✅ Redis cluster started successfully!
echo 📋 Cluster Status:
docker run --rm --network javatest_redis_cluster_network redis:7-alpine redis-cli --cluster info redis-node-1:6379

echo.
echo 🎯 Ready to test Spring Boot application!
echo Run: curl http://localhost:8082/api/redis/health
echo.
pause