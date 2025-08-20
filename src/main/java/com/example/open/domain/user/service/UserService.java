package com.example.open.domain.user.service;

import com.example.open.domain.user.entity.User;
import com.example.open.domain.user.repository.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserJpaRepository userJpaRepository;

    public List<User> getAllUsers () {
        return userJpaRepository.findAll();
    }

    public Optional<User> getUserById(String id) {
        try {
            Long userId = Long.parseLong(id);
            return userJpaRepository.findById(userId);
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    @Transactional
    public void createUser(User user) {
        userJpaRepository.save(user);
    }

    @Transactional
    public boolean updateUser(Long id, User user) {
        Optional<User> existingUser = userJpaRepository.findById(id);
        if (existingUser.isPresent()) {
            user.setId(id);
            userJpaRepository.save(user);
            return true;
        }
        return false;
    }

    @Transactional
    public boolean deleteUserById(Long id) {
        if (userJpaRepository.existsById(id)) {
            userJpaRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
