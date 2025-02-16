package com.example.open.domain;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class GroupChatManager {
    private static final Map<String, Set<String>> groupMembers = new HashMap<>();

    public static void addUserToGroup(String groupId, String userId) {
        groupMembers.computeIfAbsent(groupId, k -> new HashSet<>()).add(userId);
    }

    public static void removeUserFromGroup(String groupId, String userId) {
        Set<String> members = groupMembers.get(groupId);
        if (members != null) {
            members.remove(userId);
            if (members.isEmpty()) {
                groupMembers.remove(groupId);
            }
        }
    }

    public static Set<String> getGroupMembers(String groupId) {
        return groupMembers.getOrDefault(groupId, new HashSet<>());
    }
}