package com.example.open.common.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
public class RedisService {

    private final RedisTemplate<String, Object> redisTemplate;

    @Autowired
    public RedisService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    // String operations
    public void setValue(String key, Object value) {
        redisTemplate.opsForValue().set(key, value);
    }

    public void setValue(String key, Object value, long timeout, TimeUnit unit) {
        redisTemplate.opsForValue().set(key, value, timeout, unit);
    }

    public void setValue(String key, Object value, Duration timeout) {
        redisTemplate.opsForValue().set(key, value, timeout);
    }

    public Object getValue(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    public Boolean deleteKey(String key) {
        return redisTemplate.delete(key);
    }

    public Boolean hasKey(String key) {
        return redisTemplate.hasKey(key);
    }

    public Boolean expire(String key, long timeout, TimeUnit unit) {
        return redisTemplate.expire(key, timeout, unit);
    }

    public Boolean expire(String key, Duration timeout) {
        return redisTemplate.expire(key, timeout);
    }

    public Long getExpire(String key) {
        return redisTemplate.getExpire(key);
    }

    // Hash operations
    public void setHashValue(String key, String hashKey, Object value) {
        redisTemplate.opsForHash().put(key, hashKey, value);
    }

    public Object getHashValue(String key, String hashKey) {
        return redisTemplate.opsForHash().get(key, hashKey);
    }

    public Map<Object, Object> getHashEntries(String key) {
        return redisTemplate.opsForHash().entries(key);
    }

    public Boolean deleteHashKey(String key, String hashKey) {
        return redisTemplate.opsForHash().delete(key, hashKey) > 0;
    }

    public Boolean hasHashKey(String key, String hashKey) {
        return redisTemplate.opsForHash().hasKey(key, hashKey);
    }

    // Set operations
    public Long addToSet(String key, Object... values) {
        return redisTemplate.opsForSet().add(key, values);
    }

    public Set<Object> getSetMembers(String key) {
        return redisTemplate.opsForSet().members(key);
    }

    public Boolean isSetMember(String key, Object value) {
        return redisTemplate.opsForSet().isMember(key, value);
    }

    public Long removeFromSet(String key, Object... values) {
        return redisTemplate.opsForSet().remove(key, values);
    }

    public Long getSetSize(String key) {
        return redisTemplate.opsForSet().size(key);
    }

    // List operations
    public Long addToListLeft(String key, Object... values) {
        return redisTemplate.opsForList().leftPushAll(key, values);
    }

    public Long addToListRight(String key, Object... values) {
        return redisTemplate.opsForList().rightPushAll(key, values);
    }

    public Object popFromListLeft(String key) {
        return redisTemplate.opsForList().leftPop(key);
    }

    public Object popFromListRight(String key) {
        return redisTemplate.opsForList().rightPop(key);
    }

    public Object getListIndex(String key, long index) {
        return redisTemplate.opsForList().index(key, index);
    }

    public Long getListSize(String key) {
        return redisTemplate.opsForList().size(key);
    }

    // Increment/Decrement operations
    public Long increment(String key) {
        return redisTemplate.opsForValue().increment(key);
    }

    public Long increment(String key, long delta) {
        return redisTemplate.opsForValue().increment(key, delta);
    }

    public Double increment(String key, double delta) {
        return redisTemplate.opsForValue().increment(key, delta);
    }

    public Long decrement(String key) {
        return redisTemplate.opsForValue().decrement(key);
    }

    public Long decrement(String key, long delta) {
        return redisTemplate.opsForValue().decrement(key, delta);
    }

    // Utility methods
    public Set<String> getKeys(String pattern) {
        return redisTemplate.keys(pattern);
    }

    public void flushAll() {
        redisTemplate.getConnectionFactory().getConnection().flushAll();
    }
    // Cluster-specific methods
    public String getClusterInfo() {
        try {
            return (String) redisTemplate.execute((RedisCallback<String>) (connection) -> {
                return new String((byte[]) Objects.requireNonNull(connection.execute("CLUSTER", "INFO".getBytes())));
            });
        } catch (Exception e) {
            return "Cluster info not available: " + e.getMessage();
        }
    }

    public String getClusterNodes() {
        try {
            return (String) redisTemplate.execute((RedisCallback<String>) (connection) -> {
                return new String((byte[]) Objects.requireNonNull(connection.execute("CLUSTER", "NODES".getBytes())));
            });
        } catch (Exception e) {
            return "Cluster nodes info not available: " + e.getMessage();
        }
    }

    public boolean isClusterEnabled() {
        try {
            String info = getClusterInfo();
            return info != null && info.contains("cluster_state:ok");
        } catch (Exception e) {
            return false;
        }
    }
}