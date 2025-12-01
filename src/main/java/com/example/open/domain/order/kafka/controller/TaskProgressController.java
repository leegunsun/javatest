package com.example.open.domain.order.kafka.controller;

import com.example.open.domain.order.kafka.service.TaskProgressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Tag(name = "Task Progress", description = "Kafka 작업 진행률 SSE API")
@RestController
@RequestMapping("/api/progress")
public class TaskProgressController {

    private final TaskProgressService taskProgressService;

    public TaskProgressController(TaskProgressService taskProgressService) {
        this.taskProgressService = taskProgressService;
    }

    @Operation(summary = "SSE 연결", description = "Kafka 작업 진행률을 실시간으로 수신하기 위한 SSE 연결")
    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@RequestParam String userId) {
        return taskProgressService.createEmitter(userId);
    }
}
