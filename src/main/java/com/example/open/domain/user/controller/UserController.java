package com.example.open.domain.user.controller;

import com.example.open.common.dto.ApiResponse;
import com.example.open.common.dto.TestDTO;
import com.example.open.domain.user.entity.User;
import com.example.open.domain.user.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "userController")
public class UserController {

    private final UserService userService;

    @GetMapping
    public ApiResponse<List<User>> getAllUsers() {
        return ApiResponse.success(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ApiResponse<TestDTO> getUserById(@PathVariable String id) {
        return userService.getUserById(id)
                .map(ele -> ApiResponse.success(new TestDTO("example", 100)))  // ✅ 수정됨
                .orElseGet(() -> ApiResponse.error("서버 오류"));
    }

    @PostMapping
    public ApiResponse<String> createUser(@RequestBody User user) {
        userService.createUser(user);
        return ApiResponse.success("User created successfully");
    }

    @PutMapping("/{id}")
    public ApiResponse<String> updateUser(@PathVariable Long id, @RequestBody User user) {
        userService.updateUser(id, user);
        return ApiResponse.success("User updated successfully");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteUser(@PathVariable Long id) {
        userService.deleteUserById(id);
        return ApiResponse.success("User deleted successfully");
    }
}
