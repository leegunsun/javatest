package com.example.open.common.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.models.Operation;
import jakarta.annotation.PostConstruct;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.method.HandlerMethod;

import java.io.IOException;
import java.util.Map;

@Configuration
public class SwaggerOperationCustomizer implements OperationCustomizer {

    @Value("classpath:api-meta.json")
    private Resource metaFile;

    private Map<String, String> apiDateMap;

    @PostConstruct
    public void init() throws IOException {
        System.out.println("✅ metaFile exists: " + metaFile.exists());
        System.out.println("📁 metaFile path: " + metaFile.getFilename());

        ObjectMapper mapper = new ObjectMapper();
        apiDateMap = mapper.readValue(metaFile.getInputStream(), new TypeReference<>() {});
    }

    @Override
    public Operation customize(Operation operation, HandlerMethod handlerMethod) {
        String key = handlerMethod.getBeanType().getName() + "#" + handlerMethod.getMethod().getName();

        if (apiDateMap.containsKey(key)) {
            String date = apiDateMap.get(key);
            operation.setSummary("🆕 " + operation.getSummary());
            operation.setDescription((operation.getDescription() == null ? "" : operation.getDescription()) + "\n\n📅 생성일: " + date);
        }

        return operation;
    }
}
