package com.example.open.common.message;

import com.example.open.domain.ChatMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
public class MessageController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")     // 클라이언트에서 '/app/chat.send'로 전송 시 처리
    @SendTo("/topic/public")          // 구독자들이 '/topic/public'을 구독하고 있다면 전달
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {

        return chatMessage;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(@Payload ChatMessage chatMessage,
                               SimpMessageHeaderAccessor headerAccessor) {
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSenderId());
        return chatMessage;
    }

    @MessageMapping("/chat.sendToUser")
    public void sendToUser(@Payload ChatMessage message, Principal principal) {
        String recipient = principal.getName(); // 메시지를 받을 사용자
//        String recipient = message.getRecipient(); // 메시지를 받을 사용자
        messagingTemplate.convertAndSendToUser(recipient, "/queue/messages", message);
    }

    @MessageMapping("/chat.sendToGroup")
    public void sendToGroup(@Payload ChatMessage message) {
        String groupName = message.getGroupName(); // 그룹 이름
        messagingTemplate.convertAndSend("/topic/" + groupName, message);
    }
}
