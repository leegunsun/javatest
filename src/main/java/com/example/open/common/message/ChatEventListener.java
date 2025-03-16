package com.example.open.common.message;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class ChatEventListener {

    private static final Logger logger = LoggerFactory.getLogger(ChatEventListener.class);

    @EventListener
    public void handleSessionConnected(SessionConnectedEvent event) {
        logger.info("새로운 연결 발생");
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        logger.info("연결 종료");
    }
}
