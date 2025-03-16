package com.example.open.domain;

import lombok.Data;

@Data
public class ChatMessage {
    private String type; // "PRIVATE" 또는 "GROUP"
    private String senderId;
    private String receiverId; // 1:1 채팅 상대
    private String roomId; // 그룹 채팅 ID
    private String message;
    private String recipient;
    private String groupName;

    public Object getSender() {
        return null;
    }
}