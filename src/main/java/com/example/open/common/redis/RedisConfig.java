package com.example.open.common.redis;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
//import org.springframework.data.redis.connection.RedisClusterConfiguration;
//import org.springframework.data.redis.connection.RedisConnectionFactory;
//import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
//import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
//import org.springframework.data.redis.core.RedisTemplate;
//import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.util.Arrays;
import java.util.Collections;

@Configuration
public class RedisConfig {
//
//    @Bean
//    public RedisConnectionFactory redisConnectionFactory() {
//        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration("localhost", 6379);
////        config.setPassword("your_redis_password");  // Redis에 비밀번호가 설정되어 있다면 입력합니다.
//        return new LettuceConnectionFactory(config);
//    }
//
//    @Bean
//    public RedisTemplate<String, Object> redisTemplate() {
//        RedisTemplate<String, Object> template = new RedisTemplate<>();
//        template.setConnectionFactory(redisConnectionFactory());
//        template.setKeySerializer(new StringRedisSerializer());
//        template.setValueSerializer(new StringRedisSerializer());
//        return template;
//    }


//@Bean
//public RedisConnectionFactory redisConnectionFactory() {
//    // 외부 접근 가능한 엔드포인트를 지정합니다.
//    RedisClusterConfiguration clusterConfig = new RedisClusterConfiguration(
//            Collections.singletonList("localhost:31971")
//    );
//    // 클러스터 모드에서의 추가 설정이 필요한 경우 여기에 추가합니다.
//    return new LettuceConnectionFactory(clusterConfig);
//}
//
//    @Bean
//    public RedisTemplate<String, String> redisTemplate() {
//        RedisTemplate<String, String> template = new RedisTemplate<>();
//        template.setConnectionFactory(redisConnectionFactory());
//        template.setKeySerializer(new StringRedisSerializer());
//        template.setValueSerializer(new StringRedisSerializer());
//        return template;
//    }
}
