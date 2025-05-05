package com.example.open.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("[BACK-END API]")
                        .description("백엔드 관리 및 운영을 위한 RESTful API 명세서입니다.")
                        .version("1.0.0"))
                .servers(List.of(
                        new Server().url("https://your-dev-url.com").description("Dev Swagger Server"),
                        new Server().url("http://localhost:8082").description("Local Swagger Server")
                ));
    }

    @Bean
    public GroupedOpenApi allApi() {
        return GroupedOpenApi.builder()
                .group("1")
                .displayName("전체 API")
                .pathsToMatch("/**")
                .build();
    }

    @Bean
    public GroupedOpenApi memberApi() {
        return GroupedOpenApi.builder()
                .group("memberApi")
                .displayName("회원 API")
                .packagesToScan("com.example.project.member.controller")
                .build();
    }

    @Bean
    public GroupedOpenApi memberApiSub() {
        return GroupedOpenApi.builder()
                .group("memberApi.1")
                .displayName("회원 API 하위목록")
                .packagesToScan("com.example.project.member.controller")
                .build();
    }

    @Bean
    public GroupedOpenApi productApi() {
        return GroupedOpenApi.builder()
                .group("3")
                .displayName("상품 API")
                .packagesToScan("com.example.project.product.controller")
                .build();
    }

}
