package com.example.open.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
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
        String cookieAuth = "cookieAuth";
        
        return new OpenAPI()
                .info(new Info()
                        .title("[BACK-END API]")
                        .description("백엔드 관리 및 운영을 위한 RESTful API 명세서입니다.\n\n" +
                                "🔒 **인증 방법**:\n" +
                                "1. 먼저 `/auth/login` API를 호출하여 로그인하세요.\n" +
                                "2. 로그인 성공 시 세션 쿠키(JSESSIONID)가 자동으로 설정됩니다.\n" +
                                "3. 이후 모든 API 호출에서 세션이 자동으로 유지됩니다.\n\n" +
                                "⚠️ **Swagger UI 제한사항**:\n" +
                                "- 브라우저 보안 정책으로 인해 'Try it out' 기능이 완전히 작동하지 않을 수 있습니다.\n" +
                                "- Postman, Insomnia, curl 등의 외부 도구 사용을 권장합니다.\n\n" +
                                "💡 **팁**: 브라우저 개발자도구 > Application > Cookies에서 JSESSIONID를 확인할 수 있습니다.\n\n" +
                                "🔑 **테스트 계정**: username=admin, password=admin123")
                        .version("1.0.0"))
                .servers(List.of(
                        new Server().url("https://your-dev-url.com").description("Dev Swagger Server"),
                        new Server().url("http://localhost:8082").description("Local Swagger Server")
                ))
                .addSecurityItem(new SecurityRequirement().addList(cookieAuth))
                .components(new io.swagger.v3.oas.models.Components()
                        .addSecuritySchemes(cookieAuth, new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.COOKIE)
                                .name("JSESSIONID")
                                .description("세션 쿠키 기반 인증입니다. 로그인 후 자동으로 설정됩니다.")
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
