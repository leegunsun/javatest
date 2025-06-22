package com.example.open.domain.user.service;

import com.example.open.domain.user.controller.MyContext;
import com.example.open.domain.user.entity.User;
import com.example.open.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<User> getAllUsers () {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    public void createUser(User user) {
        userRepository.save(user);
    }

    public boolean updateUser(Long id,User user) {
       int _result = userRepository.update(id, user);

       return _result >= 0;
    }

    public boolean deleteUserById(Long id) {
        int _result = userRepository.delete(id);

        return _result >= 0;
    }

    @Async
    public CompletableFuture<String> doAsync() throws InterruptedException {
        System.out.println("doAsync 응답 처리 스레드 이름: " + Thread.currentThread().getName());
        System.out.println("비동기 스레드의 context: " + MyContext.context.get());
        Thread.sleep(3000); // 외부 API 대기 시뮬레이션
        return CompletableFuture.completedFuture("작업 완료됨");
    }
}
