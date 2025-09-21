package com.example.open.common.redis;

import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class RedisBatchJob {

    @Scheduled(cron = "0 0/1 * * * *", zone = "Asia/Seoul") // 1분마다 실행
    @SchedulerLock(name = "redisBatchJobLock", lockAtLeastFor = "30s", lockAtMostFor = "5m")
    public void executeJob() {
        System.out.println(">>> 배치 실행 시작: " + LocalDateTime.now());

        try {
            Thread.sleep(5000); // 작업 시뮬레이션 (5초)
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        System.out.println(">>> 배치 실행 완료: " + LocalDateTime.now());
    }

    // 새로운 배치 추가
    // lockAtLeastFor : 작업이 매우 짧고 스케줄이 빈번할 때(예: 1초마다 트리거) 다른 인스턴스의 즉시 재시작을 방지하려는 경우 사용.
    // lockAtMostFor : 락을 획득한 프로세스가 비정상 종료되어도 락이 영구적으로 남지 않도록 보장(데드락 방지).
    @Scheduled(cron = "0 0/5 * * * *", zone = "Asia/Seoul") // 5분마다 실행
    @SchedulerLock(name = "redisNewBatchJobLock", lockAtLeastFor = "1m", lockAtMostFor = "10m")
    public void executeNewJob() {
        System.out.println(">>> 새로운 배치 시작: " + LocalDateTime.now());

        try {
            Thread.sleep(3000); // 시뮬레이션
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        System.out.println(">>> 새로운 배치 완료: " + LocalDateTime.now());
    }
}
