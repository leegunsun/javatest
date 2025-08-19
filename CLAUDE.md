# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Spring Boot 3.4.2 application using Java 17 with a multi-domain architecture. The project implements a TODO management system with WebSocket messaging, Redis session management, API documentation generation, and Kafka integration.

## Build and Development Commands

### Basic Operations
- **Build**: `./gradlew build`
- **Run**: `./gradlew bootRun`
- **Test**: `./gradlew test`
- **Clean**: `./gradlew clean`

### API Documentation Generation
The project has a custom API meta generation system:
- **Generate API meta**: `./gradlew generateApiMeta` (runs automatically during build unless `GENERATE_API_META=prod`)
- **View Swagger UI**: Visit `http://localhost:8082/swagger-ui/index.html` (custom implementation)
- **API Groups**: Multiple grouped APIs available at `/v3/api-docs/swagger-config`

### Database Operations
- Uses H2 for development and MySQL for production
- Flyway migrations in `src/main/resources/db/migration/`
- Database URL: `jdbc:mysql://localhost:3306/todo` (production)

### Docker Operations
- **Build image**: `docker build -t javatest .`
- **Run with Docker Compose**: `docker-compose up`
- **Redis cluster**: Configured for `localhost:31971`

## Architecture Structure

### Package Organization
- **Base package**: `com.example.open`
- **Domain-driven structure**: Each domain (todo, user, order) has its own controller/service/repository/entity layers
- **Common components**: Shared utilities, configurations, and DTOs in `common` package

### Key Domain Areas

#### Todo Management (`domain.todo`)
- CRUD operations for todo items
- Custom session management with Redis
- Payment polymorphism example (Card/KakaoPayment DTOs)

#### User Management (`domain.user`)
- User entity with Role and Status enums
- Standard CRUD with custom ApiResponse wrapper

#### Order/Kafka Integration (`domain.order.kafka`)
- Kafka producer/consumer setup
- Order entity and service layer
- Asynchronous message processing

#### WebSocket Messaging (`common.message` & `domain`)
- STOMP protocol implementation with SockJS
- Group chat manager and room-based messaging
- Custom handshake handlers

### Configuration Highlights

#### Swagger/OpenAPI
- Multiple API groups configured in `SwaggerConfig`
- Custom Swagger UI with status tracking
- Auto-generates API metadata with git blame integration
- **Note**: springdoc swagger-ui is disabled in favor of custom implementation

#### Security & CORS
- Spring Security configured but minimal setup
- CORS enabled for cross-origin requests
- Session timeout: 60 seconds

#### Database & Persistence
- JPA with Hibernate
- HikariCP connection pooling
- Flyway migrations (currently commented out)
- Show SQL enabled for development

### Key Files and Patterns

#### Custom API Documentation System
- `generateApiMeta.gradle`: Generates API metadata from controller annotations using git blame
- `ApiWorkStateLabel`: Labels for API development status (WORKING, UPDATE, OK)
- Custom Swagger UI in `static/swagger-ui/` with JavaScript modules

#### Error Handling
- `GlobalExceptionHandler` for centralized exception management
- Multiple CustomErrorCode classes (appears to be experimentation)
- `ApiResponse` wrapper for consistent response format

#### Session & Caching
- Redis-based session store with namespace "testgunsun"
- HttpSessionConfig for Redis integration
- Custom WebSocket session management

## Development Notes

### Port Configuration
- Application runs on port `8082`
- Redis cluster on port `31971`

### Active Profile
- Default profile: `dev`
- Application name: `open-green`

### Testing
- Uses JUnit Platform
- Basic test structure in place
- Test configuration follows Spring Boot conventions

### API Status Tracking
The project includes a unique API status tracking system that:
- Uses git blame to track when API endpoints were last modified
- Generates JSON metadata for Swagger UI integration
- Provides visual indicators for API development status

This system runs automatically during build unless in production (`GENERATE_API_META=prod`).