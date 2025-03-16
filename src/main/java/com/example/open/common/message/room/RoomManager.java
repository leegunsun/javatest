package com.example.open.common.message.room;

import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RoomManager {

    private final Map<String, Set<String>> roomMap = new ConcurrentHashMap<>();

    public void addUserToRoom(String roomName, String username) {
        roomMap.computeIfAbsent(roomName, key -> new HashSet<>()).add(username);
    }

    public void removeUserFromRoom(String roomName, String username) {
        Set<String> users = roomMap.get(roomName);
        if (users != null) {
            users.remove(username);
            if (users.isEmpty()) {
                roomMap.remove(roomName);
            }
        }
    }

    public Set<String> getUsersInRoom(String roomName) {
        return roomMap.getOrDefault(roomName, Collections.emptySet());
    }
}

