package com.example.open.common.message;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

public class CustomHandshakeHandler extends DefaultHandshakeHandler {
    @Override
    protected Principal determineUser(ServerHttpRequest request,
                                      WebSocketHandler wsHandler,
                                      Map<String, Object> attributes) {

        // 🔥 사용자 정보 설정
        String username = request.getHeaders().getFirst("username");
        if (username == null || username.isEmpty()) {
            return null;  // 사용자 정보가 없는 경우
        }

        // 사용자 정보를 Principal 객체로 전달
        return () -> username;
    }
}
