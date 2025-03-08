package com.example.open.domain.todo.controller;

import com.example.open.domain.todo.service.TodoService;
import com.example.open.domain.todo.entity.Todo;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/todos")
@RequiredArgsConstructor
public class TodoController {

    private final TodoService todoService;


    @GetMapping("/set")
    public String setSession(HttpSession session, @RequestParam String value) {
        session.setAttribute("key", value);
        return "세션 저장됨: " + value;
    }

    @GetMapping("/get")
    public String getSession(HttpSession session) {
        String value = (String) session.getAttribute("key");

        return value != null ? "세션 값: " + value : "세션 없음";
    }

    @GetMapping
    public List<Todo> getAllTodos() {
        return todoService.getAllTodos();
    }

    @GetMapping("/{id}")
    public Optional<Todo> getTodoById(@PathVariable Long id) {
        return todoService.getTodoById(id);
    }

    @PostMapping
    public void createTodo(@RequestBody Todo todo) {
        todoService.createTodo(todo);
    }

    @PutMapping("/{id}")
    public void updateTodo(@PathVariable Long id, @RequestBody Todo todo) {
        todo.setId(id);
        todoService.updateTodo(todo);
    }

    @DeleteMapping("/{id}")
    public void deleteTodoById(@PathVariable Long id) {
        todoService.deleteTodoById(id);
    }
}
