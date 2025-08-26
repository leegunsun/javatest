@echo off
echo 🔍 Redis Connection Test Tool
echo =============================

echo 📊 Testing Docker Redis Cluster Status...
docker exec redis-node-1 redis-cli cluster info

echo.
echo 🧪 Testing host connectivity to each node...
for /L %%i in (1,1,6) do (
    echo Testing localhost:700%%i...
    docker run --rm redis:7-alpine redis-cli -h host.docker.internal -p 700%%i ping 2>nul
    if errorlevel 1 (
        echo ❌ localhost:700%%i - Connection failed
    ) else (
        echo ✅ localhost:700%%i - Connection successful
    )
)

echo.
echo 🔗 Testing cluster operations from host...
echo SET test_key "test_value"
docker run --rm redis:7-alpine redis-cli -h host.docker.internal -p 7001 set test_key "test_value"

echo GET test_key
docker run --rm redis:7-alpine redis-cli -h host.docker.internal -p 7001 get test_key

echo DEL test_key
docker run --rm redis:7-alpine redis-cli -h host.docker.internal -p 7001 del test_key

echo.
echo 📋 Current cluster nodes:
docker exec redis-node-1 redis-cli cluster nodes

echo.
echo 🎯 Spring Boot should now be able to connect to the cluster!
pause