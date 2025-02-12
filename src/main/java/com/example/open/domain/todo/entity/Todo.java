package com.example.open.domain.todo.entity;

import lombok.Data;

@Data
public class Todo {
    private Long id;
    private String title;
    private boolean completed;
}