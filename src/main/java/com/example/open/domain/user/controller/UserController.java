package com.example.open.domain.user.controller;

import com.example.open.common.dto.BodyResponse;
import com.example.open.common.dto.CustomResponse;
import com.example.open.common.dto.ResponseUtil;
import com.example.open.common.dto.TestDTO;
import com.example.open.domain.user.entity.User;
import com.example.open.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public CustomResponse<List<User>> getAllUsers() {
        return ResponseUtil.success(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BodyResponse<TestDTO>> getUserById(@PathVariable String id) {
        return userService.getUserById(id)
                .map(ele -> new BodyResponse<TestDTO>(0, "Success", new TestDTO("example", 100)).toResponseEntity(HttpStatus.OK))  // ✅ 수정됨
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(null));
    }

//        return userService.getUserById(id)
//                .map(ResponseEntity::ok)
//                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(null));
    @PostMapping
    public ResponseEntity<String> createUser(@RequestBody User user) {
        userService.createUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body("User created successfully");
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> updateUser(@PathVariable Long id, @RequestBody User user) {
        userService.updateUser(id, user);
        return ResponseEntity.ok("User updated successfully");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        userService.deleteUserById(id);
        return ResponseEntity.ok("User deleted successfully");
    }
}
