package com.example.open.common.message;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class ChatEventListener {

    private static final Logger logger = LoggerFactory.getLogger(ChatEventListener.class);
    private final SimpUserRegistry simpUserRegistry;

    @EventListener
    public void handleSessionConnected(SessionConnectedEvent event) {
        String username = Objects.requireNonNull(event.getUser()).getName();
        logger.info("사용자 '{}' 연결됨. 현재 접속자 수: {}", username, simpUserRegistry.getUserCount());
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        String username = Objects.requireNonNull(event.getUser()).getName();
        logger.info("사용자 '{}' 연결 종료됨. 현재 접속자 수: {}", username, simpUserRegistry.getUserCount());
    }
}
