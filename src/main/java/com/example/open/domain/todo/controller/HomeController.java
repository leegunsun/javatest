package com.example.open.domain.todo.controller;

import com.example.open.common.service.RedisService;
import com.example.open.domain.dto.A;
import com.example.open.domain.dto.AExtends;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Controller
public class HomeController {

    @Autowired
    private RedisService redisService;

    @GetMapping("/")
    @Operation()
    public A home(Model model) {

        return A.builder()
                .aTest("example")
                .aBaseItem(AExtends.builder().aExtendsTest("test").build())
                .build();
    }

    @GetMapping("/redis-test")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> testRedis(
            @RequestParam(defaultValue = "test") String key,
            @RequestParam(defaultValue = "hello") String value) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Redis에 값 저장 (10초 만료)
            redisService.setValue(key, value, Duration.ofSeconds(10));
            
            // 저장된 값 조회
            Object retrievedValue = redisService.getValue(key);
            
            // 키 존재 확인
            Boolean exists = redisService.hasKey(key);
            
            response.put("success", true);
            response.put("operation", "Redis 테스트 완료");
            response.put("key", key);
            response.put("setValue", value);
            response.put("getValue", retrievedValue);
            response.put("exists", exists);
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Redis 연결 실패: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}