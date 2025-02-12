package com.example.open.domain.user.repository;

import com.example.open.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.stereotype.Repository;

import java.sql.Types;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class UserRepository {

    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    public List<User> findAll() {
        String sql = "SELECT * FROM users";
        return namedParameterJdbcTemplate.query(sql, new BeanPropertyRowMapper<>(User.class));
    }

    public Optional<User> findById(String id) {
        String sql = "SELECT * FROM users WHERE id = :id";

        SqlParameterSource param = new MapSqlParameterSource().addValue("id", id, Types.VARCHAR);
        List<User> users = namedParameterJdbcTemplate.query(sql, param, new BeanPropertyRowMapper<>(User.class));
        return users.stream().findFirst();
    }

    public int save(User user) {

        String checkSql = "SELECT EXISTS(SELECT 1 FROM users WHERE id = :id)";
        SqlParameterSource _params = new MapSqlParameterSource()
                .addValue("id", user.getId());

        Boolean exists = namedParameterJdbcTemplate.queryForObject(checkSql, _params, Boolean.class);

        if (Boolean.TRUE.equals(exists)) {
            throw new IllegalArgumentException("중복된 유저가 있습니다.");
        }


        String sql = "INSERT INTO users (username, password, email, phone_number, role, status) " +
                "VALUES (:username, :password, :email, :phoneNumber, :role, :status)";

        SqlParameterSource parameterSource = new MapSqlParameterSource()
                .addValue("username", user.getUsername(), Types.VARCHAR)
                .addValue("password", user.getPassword(), Types.VARCHAR)
                .addValue("email", user.getEmail(), Types.VARCHAR)
                .addValue("phoneNumber", user.getPhone_number(), Types.VARCHAR)
                .addValue("role", user.getRole().name(), Types.VARCHAR)
                .addValue("status", user.getStatus().name(), Types.VARCHAR);

//        SqlParameterSource parameterSource = new BeanPropertySqlParameterSource(user);

        return namedParameterJdbcTemplate.update(sql, parameterSource);
    }

    public int update (Long id, User user) {
        String checkSql = "SELECT EXISTS(SELECT 1 FROM users WHERE id = :id)";
        SqlParameterSource _param = new MapSqlParameterSource().addValue("id" , id);
        Integer count = namedParameterJdbcTemplate.queryForObject(checkSql, _param, Integer.class);

        if(count == null || count == 0) {
            throw new IllegalArgumentException("해당 ID를 가진 유저가 존재하지 않습니다: " + id);
        }

        String sql = "UPDATE users SET username = :username, password = :password, email = :email, phone_number = :phone_number, role = :role, status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id";
        SqlParameterSource param = new MapSqlParameterSource()
                .addValue("username", user.getUsername())
                .addValue("password", user.getPassword())
                .addValue("email", user.getEmail())
                .addValue("phone_number", user.getPhone_number())
                .addValue("role", user.getRole().name())
                .addValue("status", user.getStatus().name())
                .addValue("id", user.getId());

        return namedParameterJdbcTemplate.update(sql, param);
    }

    public int delete (Long id) {
        String sql = "DELETE FROM user WHERE id = :id";
        SqlParameterSource param = new MapSqlParameterSource("id", id);
        return namedParameterJdbcTemplate.update(sql, param);
    }

}
