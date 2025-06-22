package com.example.open.common.config;

import org.apache.catalina.connector.Connector;
import org.apache.coyote.ProtocolHandler;
import org.apache.coyote.http11.AbstractHttp11Protocol;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;


@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:8082") // ✅ 명시적 지정
                .allowedMethods("*")
                .allowCredentials(true);
    }

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> tomcatCustomizer() {
        return factory -> factory.addConnectorCustomizers((Connector connector) -> {
            ProtocolHandler handler = connector.getProtocolHandler();

            if (handler instanceof AbstractHttp11Protocol<?> protocol) {
                int acceptCount = protocol.getAcceptCount();
                System.out.println("현재 톰캣 acceptCount = " + acceptCount);
            } else {
                System.out.println("지원되지 않는 ProtocolHandler: " + handler.getClass());
            }
        });
    }
}