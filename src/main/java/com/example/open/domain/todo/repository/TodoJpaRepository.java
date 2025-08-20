package com.example.open.domain.todo.repository;

import com.example.open.domain.todo.entity.Todo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TodoJpaRepository extends JpaRepository<Todo, Long> {
    // JPA will automatically provide implementation for basic CRUD operations
}