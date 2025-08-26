#!/bin/bash

# Redis Cluster Management Script
set -e

CLUSTER_NODES="localhost:7001 localhost:7002 localhost:7003 localhost:7004 localhost:7005 localhost:7006"

function start_cluster() {
    echo "🚀 Starting Redis Cluster..."
    docker-compose up -d redis-node-1 redis-node-2 redis-node-3 redis-node-4 redis-node-5 redis-node-6
    
    echo "⏳ Waiting for nodes to be ready..."
    sleep 15
    
    echo "🔧 Initializing cluster..."
    docker run --rm --network javatest_redis_cluster_network redis:7-alpine \
        redis-cli --cluster create \
        redis-node-1:6379 redis-node-2:6379 redis-node-3:6379 \
        redis-node-4:6379 redis-node-5:6379 redis-node-6:6379 \
        --cluster-replicas 1 --cluster-yes
    
    echo "✅ Redis cluster started successfully!"
}

function stop_cluster() {
    echo "🛑 Stopping Redis Cluster..."
    docker-compose down
    echo "✅ Redis cluster stopped!"
}

function cluster_status() {
    echo "📊 Redis Cluster Status:"
    docker run --rm --network javatest_redis_cluster_network redis:7-alpine \
        redis-cli --cluster info redis-node-1:6379
}

function cluster_nodes() {
    echo "📋 Cluster Nodes:"
    docker run --rm --network javatest_redis_cluster_network redis:7-alpine \
        redis-cli -h redis-node-1 -p 6379 cluster nodes
}

function test_cluster() {
    echo "🧪 Testing Redis Cluster..."
    
    # Test write to different nodes
    echo "📝 Writing test data..."
    for i in {1..10}; do
        docker run --rm --network javatest_redis_cluster_network redis:7-alpine \
            redis-cli -h redis-node-1 -p 6379 set "test:$i" "value:$i" > /dev/null
    done
    
    echo "📖 Reading test data..."
    for i in {1..10}; do
        value=$(docker run --rm --network javatest_redis_cluster_network redis:7-alpine \
            redis-cli -h redis-node-1 -p 6379 get "test:$i")
        echo "test:$i = $value"
    done
    
    echo "✅ Cluster test completed!"
}

function logs() {
    echo "📄 Redis Cluster Logs:"
    docker-compose logs -f redis-node-1 redis-node-2 redis-node-3 redis-node-4 redis-node-5 redis-node-6
}

case "$1" in
    start)
        start_cluster
        ;;
    stop)
        stop_cluster
        ;;
    restart)
        stop_cluster
        sleep 5
        start_cluster
        ;;
    status)
        cluster_status
        ;;
    nodes)
        cluster_nodes
        ;;
    test)
        test_cluster
        ;;
    logs)
        logs
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|nodes|test|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start Redis cluster"
        echo "  stop    - Stop Redis cluster"
        echo "  restart - Restart Redis cluster"
        echo "  status  - Show cluster status"
        echo "  nodes   - Show cluster nodes"
        echo "  test    - Test cluster functionality"
        echo "  logs    - Show cluster logs"
        exit 1
        ;;
esac