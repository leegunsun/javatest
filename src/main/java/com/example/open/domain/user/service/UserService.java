package com.example.open.domain.user.service;

import com.example.open.domain.user.entity.User;
import com.example.open.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<User> getAllUsers () {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
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
}
