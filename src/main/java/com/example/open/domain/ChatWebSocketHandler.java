package com.example.open.domain;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Collections;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class ChatWebSocketHandler extends TextWebSocketHandler {

    // 사용자 ID와 WebSocket 세션을 매핑
    private static final Map<String, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // 사용자가 접속하면, `userId`를 가져와서 매핑
        String userId = getUserIdFromSession(session);
        userSessions.computeIfAbsent(userId, k -> Collections.synchronizedSet(new HashSet<>())).add(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // JSON 메시지를 파싱
        ChatMessage chatMessage = objectMapper.readValue(message.getPayload(), ChatMessage.class);

        if (chatMessage.getType().equals("PRIVATE")) {
            sendPrivateMessage(chatMessage);
        } else if (chatMessage.getType().equals("GROUP")) {
            sendGroupMessage(chatMessage);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        // 세션 종료 시 사용자 목록에서 제거
        String userId = getUserIdFromSession(session);
        Set<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions != null) {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                userSessions.remove(userId);
            }
        }
    }

    private void sendPrivateMessage(ChatMessage chatMessage) throws IOException {
        String receiverId = chatMessage.getReceiverId();
        Set<WebSocketSession> sessions = userSessions.get(receiverId);

        if (sessions != null) {
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(chatMessage)));
                }
            }
        }
    }

    private void sendGroupMessage(ChatMessage chatMessage) throws IOException {
        Set<String> members = GroupChatManager.getGroupMembers(chatMessage.getRoomId());

        for (String memberId : members) {
            Set<WebSocketSession> sessions = userSessions.get(memberId);
            if (sessions != null) {
                for (WebSocketSession session : sessions) {
                    if (session.isOpen()) {
                        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(chatMessage)));
                    }
                }
            }
        }
    }

    private String getUserIdFromSession(WebSocketSession session) {
        // 예제: URL에서 userId 추출 (실제로는 JWT 등을 활용 가능)
        String query = session.getUri().getQuery();
        return query != null ? query.replace("userId=", "") : "anonymous";
    }
}