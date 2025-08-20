package com.example.open.domain.todo.service;

import com.example.open.domain.todo.entity.Todo;
import com.example.open.domain.todo.repository.TodoJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TodoService {

    private final TodoJpaRepository todoJpaRepository;

    public List<Todo> getAllTodos() {
        return todoJpaRepository.findAll();
    }

    public Optional<Todo> getTodoById(Long id) {
        return todoJpaRepository.findById(id);
    }

    @Transactional
    public void createTodo(Todo todo) {
        todoJpaRepository.save(todo);
    }

    @Transactional
    public void updateTodo(Todo todo) {
        todoJpaRepository.save(todo);
    }

    @Transactional
    public void deleteTodoById(Long id) {
        todoJpaRepository.deleteById(id);
    }
}