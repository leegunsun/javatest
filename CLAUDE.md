# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Spring Boot 3.4.2 application using Java 17 with a microservices-oriented architecture. The project implements a todo management system with WebSocket messaging, Kafka integration, and comprehensive API documentation through Swagger.

## Build Commands

- **Build project**: `./gradlew build`
- **Run application**: `./gradlew bootRun`  
- **Run tests**: `./gradlew test`
- **Clean build**: `./gradlew clean build`

The build process includes automatic API metadata generation for Swagger documentation via `generateApiMeta.gradle`, which uses git blame to track API changes and creation dates.

## Development Server

- **Default port**: 8082
- **Application name**: open-green
- **Active profile**: dev

## Architecture

### Domain Structure
The codebase follows a domain-driven design pattern with the following main domains:

- **`domain/todo/`**: Todo management with CRUD operations
- **`domain/user/`**: User management with Role and Status entities
- **`domain/order/`**: Order processing with Kafka integration for async messaging
- **`common/`**: Shared utilities, configurations, and cross-cutting concerns

### Key Technical Components

**WebSocket Messaging**: 
- STOMP protocol with `/ws` endpoint
- Supports both 1:1 (`/queue`) and group (`/topic`) messaging
- Custom handshake handler for connection management

**Kafka Integration**:
- Order processing with producer/consumer pattern
- Async order state management

**Database**:
- MySQL primary database with Flyway migrations in `src/main/resources/db/migration/`
- H2 for testing
- JPA with Hibernate for ORM

**API Documentation**:
- Custom Swagger configuration with multiple API groups
- Automatic metadata generation tracking API creation/modification dates
- Custom UI at `/swagger-ui/` with enhanced status tracking

### Configuration Files

- **`application.yml`**: Main configuration including database, Redis, WebSocket settings
- **`build.gradle`**: Dependencies and build configuration
- **`generateApiMeta.gradle`**: Custom task for API documentation metadata

### Custom Features

**API Status Tracking**: 
- `ApiWorkStateLabel` enum for marking API development status (WORKING, UPDATE, OK)
- Git blame integration for tracking API modification history
- Custom Swagger UI enhancements in `src/main/resources/static/swagger-ui/`

**Error Handling**:
- Global exception handler in `common/exception/`
- Custom error codes and registry system

## Testing

- Uses JUnit Platform with Spring Boot Test
- Test files located in `src/test/java/`
- Run single test: `./gradlew test --tests "ClassName.methodName"`