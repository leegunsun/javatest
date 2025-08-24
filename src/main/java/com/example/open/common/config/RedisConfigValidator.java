package com.example.open.common.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.redis.connection.RedisClusterConfiguration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.net.InetSocketAddress;
import java.net.Socket;

@Component
public class RedisConfigValidator implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(RedisConfigValidator.class);

    @Autowired
    private RedisClusterConfiguration redisClusterConfiguration;
    
    @Autowired
    private RedisConnectionFactory redisConnectionFactory;
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Override
    public void run(String... args) {
        logger.info("=== Redis Cluster Configuration Validation ===");
        
        validateConfiguration();
        testConnectivity();
        testRedisOperations();
        
        logger.info("=== End Redis Configuration Validation ===");
    }
    
    private void validateConfiguration() {
        if (redisClusterConfiguration != null) {
            logger.info("✅ RedisClusterConfiguration bean loaded successfully");
            
            if (redisClusterConfiguration.getClusterNodes() != null && 
                !redisClusterConfiguration.getClusterNodes().isEmpty()) {
                
                logger.info("✅ Cluster nodes configured: {} nodes", 
                    redisClusterConfiguration.getClusterNodes().size());
                
                redisClusterConfiguration.getClusterNodes().forEach(node -> 
                    logger.info("   - Node: {}:{}", node.getHost(), node.getPort())
                );
                
                logger.info("✅ Max redirects: {}", redisClusterConfiguration.getMaxRedirects());
                
            } else {
                logger.warn("⚠️ No cluster nodes configured!");
            }
        } else {
            logger.error("❌ RedisClusterConfiguration bean not found!");
        }
    }
    
    private void testConnectivity() {
        logger.info("🔌 Testing node connectivity...");
        
        if (redisClusterConfiguration != null && redisClusterConfiguration.getClusterNodes() != null) {
            redisClusterConfiguration.getClusterNodes().forEach(node -> {
                try (Socket socket = new Socket()) {
                    socket.connect(new InetSocketAddress(node.getHost(), node.getPort()), 3000);
                    logger.info("✅ Connection successful: {}:{}", node.getHost(), node.getPort());
                } catch (Exception e) {
                    logger.error("❌ Connection failed: {}:{} - {}", 
                        node.getHost(), node.getPort(), e.getMessage());
                }
            });
        }
    }
    
    private void testRedisOperations() {
        logger.info("🧪 Testing Redis operations...");
        
        try {
            // Test basic Redis operation
            String testKey = "config_test_" + System.currentTimeMillis();
            String testValue = "validation_test";
            
            redisTemplate.opsForValue().set(testKey, testValue);
            Object retrievedValue = redisTemplate.opsForValue().get(testKey);
            redisTemplate.delete(testKey);
            
            if (testValue.equals(retrievedValue)) {
                logger.info("✅ Redis operations working correctly");
            } else {
                logger.error("❌ Redis operations failed - value mismatch");
            }
            
        } catch (Exception e) {
            logger.error("❌ Redis operations failed: {}", e.getMessage());
        }
    }
}