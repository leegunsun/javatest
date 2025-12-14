# 멀티 노드 Kubernetes 클러스터 리소스 요구사항

## 시스템 리소스 이해하기

### 비유로 이해하기

```
실제 서버 환경 (프로덕션):
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Master     │  │  Worker 1   │  │  Worker 2   │
│  서버       │  │  서버       │  │  서버       │
│  (물리 PC)  │  │  (물리 PC)  │  │  (물리 PC)  │
└─────────────┘  └─────────────┘  └─────────────┘
  비용: 매우 높음 (수백만원 이상)


로컬 개발 환경 (kind):
┌────────────────────────────────────────────────┐
│         당신의 PC (1대)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Master   │  │ Worker1  │  │ Worker2  │    │
│  │(컨테이너)│  │(컨테이너)│  │(컨테이너)│    │
│  └──────────┘  └──────────┘  └──────────┘    │
└────────────────────────────────────────────────┘
  비용: 0원 (기존 PC 활용)
```

## 최소 요구사항

### 하드웨어

| 구성 요소 | 최소 사양 | 권장 사양 | 이상적 |
|-----------|-----------|-----------|--------|
| **CPU** | 4코어 | 6코어 | 8코어 이상 |
| **RAM** | 8GB | 16GB | 32GB |
| **디스크** | 20GB 여유 | 50GB 여유 | 100GB SSD |
| **네트워크** | 인터넷 연결 | 안정적 연결 | 고속 연결 |

### 운영체제

- Windows 10/11 (64-bit)
- WSL2 지원 (Docker Desktop 사용 시)
- Hyper-V 또는 WSL2 활성화

## 리소스 배분 계산

### RAM 8GB 시스템 (최소 사양)

```
총 RAM: 8GB
├─ Windows OS: 3GB
├─ Docker Desktop: 4GB
│  ├─ Master Node: 1GB
│  ├─ Worker Node 1: 1.5GB
│  └─ Worker Node 2: 1.5GB
└─ 기타 앱: 1GB

⚠️ 주의: 최소 사양에서는 성능 저하 가능
       크롬 브라우저, IDE 등을 동시에 실행하면 느려질 수 있음
```

### RAM 16GB 시스템 (권장 사양)

```
총 RAM: 16GB
├─ Windows OS: 4GB
├─ Docker Desktop: 8GB ⭐ 최적
│  ├─ Master Node: 2GB
│  ├─ Worker Node 1: 3GB
│  └─ Worker Node 2: 3GB
├─ IDE (IntelliJ/VSCode): 2GB
└─ 기타 앱 (브라우저 등): 2GB

✅ 권장: 편안한 개발 환경
```

### RAM 32GB 시스템 (이상적)

```
총 RAM: 32GB
├─ Windows OS: 6GB
├─ Docker Desktop: 16GB
│  ├─ Master Node: 4GB
│  ├─ Worker Node 1: 6GB
│  └─ Worker Node 2: 6GB
├─ IDE + 개발 도구: 4GB
├─ 브라우저 + 기타: 4GB
└─ 여유: 2GB

✨ 이상적: 프로덕션 유사 환경 테스트 가능
```

## CPU 코어 배분

### 4코어 시스템 (최소)

```
총 CPU: 4코어
├─ Windows OS: 1코어
├─ Master Node: 1코어
├─ Worker Node 1: 1코어
├─ Worker Node 2: 1코어
└─ 기타 프로세스: 공유

⚠️ 주의: CPU 사용률이 높을 때 느려질 수 있음
```

### 6코어 이상 시스템 (권장)

```
총 CPU: 6코어 이상
├─ Windows OS: 1-2코어
├─ Master Node: 1코어
├─ Worker Node 1: 2코어
├─ Worker Node 2: 2코어
└─ 여유: 충분

✅ 권장: 멀티태스킹 시에도 안정적
```

## Docker Desktop 리소스 설정

### 설정 방법 (Windows)

1. **Docker Desktop 열기**
   - 시스템 트레이의 Docker 아이콘 클릭

2. **Settings → Resources 이동**

3. **리소스 할당 조정**

#### 8GB RAM 시스템
```
Memory: 4GB (4096 MB)
CPUs: 2-3개
Swap: 1GB
Disk image size: 30GB
```

#### 16GB RAM 시스템 (권장)
```
Memory: 8GB (8192 MB) ⭐
CPUs: 4개
Swap: 2GB
Disk image size: 50GB
```

#### 32GB RAM 시스템
```
Memory: 16GB (16384 MB)
CPUs: 6-8개
Swap: 4GB
Disk image size: 100GB
```

4. **Apply & Restart 클릭**

### PowerShell로 현재 설정 확인

```powershell
# Docker 시스템 정보
docker system info

# 리소스 사용량 확인
docker stats

# kind 노드 리소스 확인
docker stats --filter "name=spring-boot-cluster"
```

## Pod 리소스 제한 설정

### 왜 필요한가?

Pod에 리소스 제한이 없으면:
- 한 Pod가 메모리를 독점할 수 있음
- 노드 전체가 다운될 수 있음
- 다른 Pod가 실행되지 못할 수 있음

### deployment.yaml 예시

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spring-boot-app
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: spring-boot-app
        image: spring-boot-app:latest
        resources:
          # 요청 리소스 (최소 보장)
          requests:
            memory: "512Mi"   # 512MB 보장
            cpu: "250m"       # 0.25 코어 보장
          # 제한 리소스 (최대 사용 가능)
          limits:
            memory: "1Gi"     # 1GB 최대
            cpu: "500m"       # 0.5 코어 최대
```

### 리소스 단위 설명

**CPU**:
- `1` = 1 CPU 코어
- `1000m` = 1 CPU 코어 (m = milli-core)
- `500m` = 0.5 CPU 코어
- `250m` = 0.25 CPU 코어

**메모리**:
- `1Gi` = 1 기가바이트 (1024 MiB)
- `512Mi` = 512 메가바이트
- `1G` = 1,000,000,000 바이트 (Gi와 다름!)
- `1M` = 1,000,000 바이트

### 시스템별 권장 Pod 리소스

#### 8GB RAM 시스템 (최소 사양)
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "200m"
```
- 최대 Replica: 2-3개
- 가벼운 테스트용

#### 16GB RAM 시스템 (권장 사양)
```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "500m"
```
- 최대 Replica: 6-8개
- 일반 개발 및 테스트용

#### 32GB RAM 시스템 (이상적)
```yaml
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "1000m"
```
- 최대 Replica: 10개 이상
- 프로덕션 유사 환경 테스트

## 성능 모니터링

### 리소스 사용량 확인

```powershell
# 노드별 리소스 사용량 (Metrics Server 필요)
kubectl top nodes

# 출력 예시:
# NAME                                CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
# spring-boot-cluster-control-plane   150m         7%     800Mi           40%
# spring-boot-cluster-worker          200m         10%    1200Mi          40%
# spring-boot-cluster-worker2         180m         9%     1100Mi          36%
```

```powershell
# Pod별 리소스 사용량
kubectl top pods

# 출력 예시:
# NAME                               CPU(cores)   MEMORY(bytes)
# spring-boot-app-xxx                50m          450Mi
# spring-boot-app-yyy                60m          480Mi
```

```powershell
# Docker 컨테이너 (노드) 리소스 실시간 모니터링
docker stats --filter "name=spring-boot-cluster"

# 출력 예시:
# CONTAINER           CPU %     MEM USAGE / LIMIT     MEM %
# ...control-plane    5.00%     800MiB / 2GiB         40%
# ...worker           7.50%     1.2GiB / 3GiB         40%
# ...worker2          6.80%     1.1GiB / 3GiB         36%
```

### Metrics Server 설치

```powershell
# Metrics Server 배포 (리소스 모니터링 필수)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# kind 환경에서는 TLS 검증 비활성화 필요
kubectl patch deployment metrics-server -n kube-system --type='json' -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'

# 확인 (1-2분 대기 후)
kubectl top nodes
```

## 성능 최적화 팁

### 1. JVM 힙 메모리 최적화

Spring Boot application.yml:

```yaml
# 8GB RAM 시스템
java:
  opts: "-Xms256m -Xmx512m"

# 16GB RAM 시스템 (권장)
java:
  opts: "-Xms512m -Xmx1g"

# 32GB RAM 시스템
java:
  opts: "-Xms1g -Xmx2g"
```

Dockerfile:

```dockerfile
# JVM 메모리 설정
ENV JAVA_OPTS="-Xms512m -Xmx1g -XX:+UseG1GC"
ENTRYPOINT ["java", "${JAVA_OPTS}", "-jar", "app.jar"]
```

### 2. Docker 이미지 경량화

```dockerfile
# 멀티 스테이지 빌드 사용
FROM eclipse-temurin:17-jre-alpine  # JDK 대신 JRE 사용

# 불필요한 파일 제거
RUN apk del ...

# 레이어 캐싱 활용
COPY build/libs/*.jar app.jar
```

### 3. Pod 우선순위 설정

```yaml
# 중요한 Pod는 우선순위 높게
apiVersion: v1
kind: Pod
metadata:
  name: important-app
spec:
  priorityClassName: high-priority
```

### 4. 리소스 쿼터 설정 (네임스페이스 단위)

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: dev-quota
  namespace: default
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    pods: "20"
```

## 문제 해결

### 메모리 부족 (OOMKilled)

**증상**:
```
Pod가 계속 재시작됨
kubectl get pods 시 "OOMKilled" 표시
```

**해결**:
1. Pod의 memory limits 증가
2. Docker Desktop 메모리 할당 증가
3. Replica 수 감소
4. JVM 힙 메모리 감소

```powershell
# Pod 재시작 이유 확인
kubectl describe pod <pod-name> | findstr -i "oom"
```

### CPU 스로틀링

**증상**:
```
애플리케이션이 느려짐
kubectl top pods에서 CPU 사용률이 limits에 도달
```

**해결**:
1. CPU limits 증가
2. 불필요한 백그라운드 프로세스 종료
3. Docker Desktop CPU 할당 증가

### 디스크 부족

**증상**:
```
Docker 이미지 빌드 실패
"no space left on device" 에러
```

**해결**:
```powershell
# 사용하지 않는 Docker 리소스 정리
docker system prune -a --volumes

# 디스크 사용량 확인
docker system df
```

## 벤치마크 참고

### 일반적인 Spring Boot 앱 리소스 사용량

| 앱 유형 | 메모리 | CPU | Replica |
|---------|--------|-----|---------|
| 간단한 REST API | 256-512Mi | 100-200m | 3 |
| 중간 규모 앱 | 512Mi-1Gi | 200-500m | 3-5 |
| 대규모 앱 (DB 연결 등) | 1-2Gi | 500m-1000m | 5-10 |

### kind 클러스터 오버헤드

```
기본 오버헤드 (시스템 Pod 포함):
├─ Master Node: 약 500Mi-1Gi
├─ Worker Node 1: 약 300-500Mi
└─ Worker Node 2: 약 300-500Mi

총 기본 오버헤드: 약 1.5-2.5Gi
```

## 요약 및 권장사항

### 시스템별 추천 구성

#### 8GB RAM 시스템
```
✅ 가능하지만 제한적
- Docker: 4GB 할당
- Replica: 최대 2-3개
- 용도: 기본 학습 및 가벼운 테스트
- 권장 작업: 브라우저, IDE 등 최소화
```

#### 16GB RAM 시스템 ⭐ 권장
```
✅ 권장 사양
- Docker: 8GB 할당
- Replica: 최대 6-8개
- 용도: 일반 개발, 테스트, 학습
- 권장 작업: 편안한 멀티태스킹 가능
```

#### 32GB RAM 시스템
```
✅ 이상적
- Docker: 16GB 할당
- Replica: 10개 이상
- 용도: 프로덕션 유사 환경, 성능 테스트
- 권장 작업: 모든 작업 동시 수행 가능
```

### 최종 체크리스트

- [ ] 시스템 리소스 확인 (RAM, CPU)
- [ ] Docker Desktop 리소스 할당 조정
- [ ] Pod 리소스 제한 설정
- [ ] Metrics Server 설치
- [ ] 리소스 모니터링 도구 확인
- [ ] 성능 테스트 실행
- [ ] 필요시 리소스 조정

**다음 단계**: README.md를 참고하여 클러스터를 구축하세요!
