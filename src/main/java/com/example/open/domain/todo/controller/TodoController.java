package com.example.open.domain.todo.controller;

import com.example.open.common.utile.ApiWorkStateLabel;
import com.example.open.domain.todo.service.TodoService;
import com.example.open.domain.todo.entity.Todo;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/todos")
@RequiredArgsConstructor
public class TodoController {

    private final TodoService todoService;

    @Operation(
            summary = ApiWorkStateLabel.WORKING + "회원 가입 API23",
            description = "2025-04-20 신규 추가된 API입니다.2"
    )
    @GetMapping("/set3")
    public String setSession2(HttpSession session, @RequestParam String value) {
        session.setAttribute("key", value);
        return "세션 저장됨: " + value;
    }

    @Operation(
            summary = ApiWorkStateLabel.OK + "회원 가입 API2",
            description = "2025-04-20 신규 추가된 API입니다."
    )
    @GetMapping("/set")
    public String setSession(HttpSession session, @RequestParam String value) {
        session.setAttribute("key", value);
        return "세션 저장됨: " + value;
    }

    @Operation(
            summary = ApiWorkStateLabel.UPDATE + "회원 가입 API",
            description = "2025-04-20 신규 추가된 API입니다."
    )
    @GetMapping("/get")
    public String getSession(HttpSession session) {
        String value = (String) session.getAttribute("key");

        return value != null ? "세션 값: " + value : "세션 없음";
    }

    @Operation(
            summary = ApiWorkStateLabel.OK + "회원 가입 API2",
            description = "2025-04-20 신규 추가된 API입니다."
    )
    @GetMapping("/set4")
    public String setSession4(HttpSession session, @RequestParam String value) {
        session.setAttribute("key", value);
        return "세션 저장됨: " + value;
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
    public ResponseEntity<String> createTodo(@RequestBody Todo todo) {
//        todoService.createTodo(todo);
        return ResponseEntity.ok("Todo created successfully");
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
