package com.example.open.common.message;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
    private final SimpMessagingTemplate messagingTemplate;


    @EventListener
    public void handleSessionConnected(SessionConnectedEvent event) {
        String username = Objects.requireNonNull(event.getUser()).getName();
        logger.info("사용자 '{}' 연결됨. 현재 접속자 수: {}", username, simpUserRegistry.getUserCount());
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        String username = Objects.requireNonNull(event.getUser()).getName();
        logger.info("사용자 '{}' 연결 종료됨. 현재 접속자 수: {}", username, simpUserRegistry.getUserCount());

        SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String roomName = (String) headerAccessor.getSessionAttributes().get("roomName");

        if (roomName != null) {
            messagingTemplate.convertAndSend("/topic/" + roomName, "사용자가 퇴장했습니다.");
        }
    }
}
