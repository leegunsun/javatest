package com.example.open.domain.user.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class User {
    private final Long id;
    private final String username;
    private final String password;
    private final String email;
    private final String phone_number;
    private final Role role;
    private final Status status;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;
}

