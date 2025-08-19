package com.example.open.common.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {

    @Bean
    public DataSource dataSource () {
        HikariDataSource dataSource = new HikariDataSource();

        dataSource.setDriverClassName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
        dataSource.setJdbcUrl("jdbc:sqlserver://localhost:1433;databaseName=testdb;trustServerCertificate=true");
        dataSource.setUsername("sa");
        dataSource.setPassword("YourStrong!Passw0rd");
        return dataSource;
    }
}
