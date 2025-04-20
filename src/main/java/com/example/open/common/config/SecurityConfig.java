package com.example.open.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Swagger 접근 허용
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/swagger-status/**",      // ✅ 여기에 추가
                                "/swagger-custom.js",      // ✅ 직접 작성한 JS도 필요 시 허용
                                "/swagger-custom.css"
                        ).permitAll()
                        // 예시로 추가된 API
                        .requestMatchers("/todos").permitAll()
                        // 나머지는 인증 필요
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}
