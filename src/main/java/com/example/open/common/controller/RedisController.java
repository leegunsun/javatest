package com.example.open.common.controller;

import com.example.open.common.service.RedisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/redis")
@Tag(name = "Redis Management", description = "Redis 캐시 관리 API")
public class RedisController {

    private final RedisService redisService;

    @Autowired
    public RedisController(RedisService redisService) {
        this.redisService = redisService;
    }

    @PostMapping("/set")
    @Operation(summary = "키-값 저장", description = "Redis에 키-값 쌍을 저장합니다")
    public ResponseEntity<Map<String, Object>> setValue(
            @Parameter(description = "Redis 키") @RequestParam String key,
            @Parameter(description = "저장할 값") @RequestParam String value,
            @Parameter(description = "만료 시간 (초)", required = false) @RequestParam(required = false) Long expireSeconds) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (expireSeconds != null && expireSeconds > 0) {
                redisService.setValue(key, value, Duration.ofSeconds(expireSeconds));
                response.put("message", "키-값이 만료시간과 함께 저장되었습니다");
                response.put("expireSeconds", expireSeconds);
            } else {
                redisService.setValue(key, value);
                response.put("message", "키-값이 저장되었습니다");
            }
            
            response.put("success", true);
            response.put("key", key);
            response.put("value", value);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "저장 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/get/{key}")
    @Operation(summary = "값 조회", description = "Redis에서 키에 해당하는 값을 조회합니다")
    public ResponseEntity<Map<String, Object>> getValue(
            @Parameter(description = "조회할 Redis 키") @PathVariable String key) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Object value = redisService.getValue(key);
            
            if (value != null) {
                response.put("success", true);
                response.put("key", key);
                response.put("value", value);
                response.put("exists", true);
                
                Long expireTime = redisService.getExpire(key);
                if (expireTime > 0) {
                    response.put("expireSeconds", expireTime);
                }
            } else {
                response.put("success", true);
                response.put("key", key);
                response.put("value", null);
                response.put("exists", false);
                response.put("message", "키가 존재하지 않습니다");
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/delete/{key}")
    @Operation(summary = "키 삭제", description = "Redis에서 키를 삭제합니다")
    public ResponseEntity<Map<String, Object>> deleteKey(
            @Parameter(description = "삭제할 Redis 키") @PathVariable String key) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Boolean deleted = redisService.deleteKey(key);
            response.put("success", true);
            response.put("key", key);
            response.put("deleted", deleted);
            response.put("message", deleted ? "키가 삭제되었습니다" : "키가 존재하지 않습니다");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "삭제 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/exists/{key}")
    @Operation(summary = "키 존재 확인", description = "Redis에서 키의 존재 여부를 확인합니다")
    public ResponseEntity<Map<String, Object>> hasKey(
            @Parameter(description = "확인할 Redis 키") @PathVariable String key) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Boolean exists = redisService.hasKey(key);
            response.put("success", true);
            response.put("key", key);
            response.put("exists", exists);
            
            if (exists) {
                Long expireTime = redisService.getExpire(key);
                if (expireTime > 0) {
                    response.put("expireSeconds", expireTime);
                }
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "확인 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/keys")
    @Operation(summary = "키 목록 조회", description = "패턴에 맞는 Redis 키 목록을 조회합니다")
    public ResponseEntity<Map<String, Object>> getKeys(
            @Parameter(description = "검색 패턴 (기본값: *)", example = "*user*") 
            @RequestParam(defaultValue = "*") String pattern) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Set<String> keys = redisService.getKeys(pattern);
            response.put("success", true);
            response.put("pattern", pattern);
            response.put("keys", keys);
            response.put("count", keys.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "키 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/increment/{key}")
    @Operation(summary = "값 증가", description = "Redis 키의 숫자 값을 증가시킵니다")
    public ResponseEntity<Map<String, Object>> increment(
            @Parameter(description = "증가시킬 Redis 키") @PathVariable String key,
            @Parameter(description = "증가량 (기본값: 1)") @RequestParam(defaultValue = "1") Long delta) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Long result = redisService.increment(key, delta);
            response.put("success", true);
            response.put("key", key);
            response.put("delta", delta);
            response.put("result", result);
            response.put("message", "값이 증가되었습니다");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "증가 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/health")
    @Operation(summary = "Redis 연결 상태 확인", description = "Redis 서버 연결 상태를 확인합니다")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 테스트 키로 연결 상태 확인
            String testKey = "health_check_" + System.currentTimeMillis();
            String testValue = "OK";
            
            redisService.setValue(testKey, testValue, Duration.ofSeconds(10));
            Object retrievedValue = redisService.getValue(testKey);
            redisService.deleteKey(testKey);
            
            boolean isHealthy = testValue.equals(retrievedValue);
            
            response.put("success", true);
            response.put("healthy", isHealthy);
            response.put("message", isHealthy ? "Redis 연결이 정상입니다" : "Redis 연결에 문제가 있습니다");
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("healthy", false);
            response.put("message", "Redis 연결 확인 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}