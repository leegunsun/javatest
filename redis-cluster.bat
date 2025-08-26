@echo off
REM Redis Cluster Management Script for Windows
setlocal enabledelayedexpansion

set CLUSTER_NODES=localhost:7001 localhost:7002 localhost:7003 localhost:7004 localhost:7005 localhost:7006

if "%1"=="start" goto start_cluster
if "%1"=="stop" goto stop_cluster
if "%1"=="restart" goto restart_cluster
if "%1"=="status" goto cluster_status
if "%1"=="nodes" goto cluster_nodes
if "%1"=="test" goto test_cluster
if "%1"=="logs" goto logs
goto usage

:start_cluster
echo 🚀 Starting Redis Cluster...
docker-compose up -d redis-node-1 redis-node-2 redis-node-3 redis-node-4 redis-node-5 redis-node-6

echo ⏳ Waiting for nodes to be ready...
timeout /t 15 >nul

echo 🔧 Initializing cluster...
docker run --rm --network javatest_redis_cluster_network redis:7-alpine redis-cli --cluster create redis-node-1:6379 redis-node-2:6379 redis-node-3:6379 redis-node-4:6379 redis-node-5:6379 redis-node-6:6379 --cluster-replicas 1 --cluster-yes

echo ✅ Redis cluster started successfully!
goto end

:stop_cluster
echo 🛑 Stopping Redis Cluster...
docker-compose down
echo ✅ Redis cluster stopped!
goto end

:restart_cluster
call :stop_cluster
timeout /t 5 >nul
call :start_cluster
goto end

:cluster_status
echo 📊 Redis Cluster Status:
docker run --rm --network javatest_redis_cluster_network redis:7-alpine redis-cli --cluster info redis-node-1:6379
goto end

:cluster_nodes
echo 📋 Cluster Nodes:
docker run --rm --network javatest_redis_cluster_network redis:7-alpine redis-cli -h redis-node-1 -p 6379 cluster nodes
goto end

:test_cluster
echo 🧪 Testing Redis Cluster...

echo 📝 Writing test data...
for /L %%i in (1,1,10) do (
    docker run --rm --network javatest_redis_cluster_network redis:7-alpine redis-cli -h redis-node-1 -p 6379 set "test:%%i" "value:%%i" >nul
)

echo 📖 Reading test data...
for /L %%i in (1,1,10) do (
    for /f "delims=" %%a in ('docker run --rm --network javatest_redis_cluster_network redis:7-alpine redis-cli -h redis-node-1 -p 6379 get "test:%%i"') do (
        echo test:%%i = %%a
    )
)

echo ✅ Cluster test completed!
goto end

:logs
echo 📄 Redis Cluster Logs:
docker-compose logs -f redis-node-1 redis-node-2 redis-node-3 redis-node-4 redis-node-5 redis-node-6
goto end

:usage
echo Usage: %0 {start^|stop^|restart^|status^|nodes^|test^|logs}
echo.
echo Commands:
echo   start   - Start Redis cluster
echo   stop    - Stop Redis cluster
echo   restart - Restart Redis cluster
echo   status  - Show cluster status
echo   nodes   - Show cluster nodes
echo   test    - Test cluster functionality
echo   logs    - Show cluster logs
exit /b 1

:end