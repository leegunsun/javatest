package com.example.open.domain.order.kafka.dto;

public record TaskProgress(
        String taskId,
        String userId,
        int currentStep,
        int totalSteps,
        int percentage,
        String stepName,
        String status // PROCESSING, COMPLETED, FAILED
) {
    public static TaskProgress of(String taskId, String userId, int currentStep, int totalSteps, String stepName) {
        int percentage = (int) ((currentStep / (double) totalSteps) * 100);
        return new TaskProgress(taskId, userId, currentStep, totalSteps, percentage, stepName, "PROCESSING");
    }

    public static TaskProgress completed(String taskId, String userId) {
        return new TaskProgress(taskId, userId, 4, 4, 100, "완료", "COMPLETED");
    }

    public static TaskProgress failed(String taskId, String userId, String stepName) {
        return new TaskProgress(taskId, userId, 0, 4, 0, stepName, "FAILED");
    }
}
