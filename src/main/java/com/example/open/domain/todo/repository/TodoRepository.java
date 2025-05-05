package com.example.open.domain.todo.repository;

import com.example.open.domain.todo.entity.Todo;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class TodoRepository {

    private final JdbcTemplate jdbcTemplate;

    public List<Todo> findAll() {
        String sql = "SELECT * FROM todos";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(Todo.class));
    }

    public Optional<Todo> findById(Long id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        List<Todo> result = jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(Todo.class), id);
        return result.stream().findFirst();
    }

    public int save(Todo todo) {
        String sql = "INSERT INTO todos (title, completed) VALUES (?, ?)";
        return jdbcTemplate.update(sql, todo.getTitle(), todo.isCompleted());
    }

    public int update(Todo todo) {
        String sql = "UPDATE todos SET title = ?, completed = ? WHERE id = ?";
        return jdbcTemplate.update(sql, todo.getTitle(), todo.isCompleted(), todo.getId());
    }

    public int delete(Long id) {
        String sql = "DELETE FROM todos WHERE id = ?";
        return jdbcTemplate.update(sql, id);
    }
}