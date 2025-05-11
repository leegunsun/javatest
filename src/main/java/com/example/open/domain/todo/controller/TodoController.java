package com.example.open.domain.todo.controller;

import com.example.open.common.utile.ApiWorkStateLabel;
import com.example.open.domain.todo.dto.contract.PaymentBase;
import com.example.open.domain.todo.dto.internal.CardPaymentDTO;
import com.example.open.domain.todo.dto.internal.KakaoPayDTO;
import com.example.open.domain.todo.service.TodoService;
import com.example.open.domain.todo.entity.Todo;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/todo")
@RequiredArgsConstructor
@Tag(
        name = "todos",
        description = "할 일 관리 API"
)
public class TodoController {

    private final TodoService todoService;

    @Operation(
            summary = ApiWorkStateLabel.WORKING + "회원 가입 API23",
            description = "2025-04-20 신규 추가된 API입니다.23"
    )
    @GetMapping("/set3")
    public String setSession2(HttpSession session, @RequestParam String value) {
        session.setAttribute("key", value);
        return "세션 저장됨: " + value;
    }

    @Operation(
            summary = ApiWorkStateLabel.WORKING + "회원 가입 API2",
            description = "2025-04-20 신규 추가된 API입니다.5",
            responses = {
                    @ApiResponse(
                            responseCode = "200",
                            description = "성공적으로 반환된 다형성 리스트",
                            content = @Content(
                                    array = @ArraySchema(
                                            schema = @Schema(anyOf = {CardPaymentDTO.class, KakaoPayDTO.class})
                                    )
                            )
                    )
            }
    )
    @GetMapping("/set")
    public ResponseEntity<List<PaymentBase>> setSession(HttpSession session) {

        List<PaymentBase> paymentBaseList = new ArrayList<>();
        paymentBaseList.add(new CardPaymentDTO("cardValue2", "cardValue21", "cardValue22", "cardValue23"));
        paymentBaseList.add(new KakaoPayDTO("kakaoValue1", "kakaoValue11", "kakaoValue12"));

        return ResponseEntity.ok(paymentBaseList);
    }


    @Operation(
            summary = ApiWorkStateLabel.UPDATE + "회원 가입 API",
            description = "2025-04-20 신규 추가된 API입니다.7"
    )
    @GetMapping("/get")
    public String getSession(HttpSession session) {
        String value = (String) session.getAttribute("key");

        return value != null ? "세션 값: " + value : "세션 없음";
    }

    @Operation(
            summary = ApiWorkStateLabel.OK + "",
            description = "2025-04-20 신규 추가된 API입니다.8"
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
