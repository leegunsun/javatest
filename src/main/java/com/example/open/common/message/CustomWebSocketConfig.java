package com.example.open.common.message;


import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class CustomWebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");  // 메시지를 구독하는 경로
        config.setApplicationDestinationPrefixes("/app");  // 메시지를 발행하는 경로
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/chat")      // 웹소켓 연결을 위한 엔드포인트
                .setAllowedOriginPatterns("*")
                .withSockJS();             // SockJS 사용 (웹소켓을 지원하지 않는 브라우저 대응)
    }
}
