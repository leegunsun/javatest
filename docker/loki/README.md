# open-green Loki Stack - 로컬 개발 환경

로컬 개발 환경에서 로그를 수집하고 시각화하기 위한 Loki 스택입니다.

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    로컬 개발 환경                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │               Spring Boot App                       │    │
│  │                (./gradlew bootRun)                  │    │
│  │                                                     │    │
│  │   logs/                                             │    │
│  │   ├── appLogs/app.json    (INFO, DEBUG, WARN)      │    │
│  │   ├── errorLogs/error.json (ERROR)                 │    │
│  │   └── console.log         (Plain text)             │    │
│  └───────────────────┬─────────────────────────────────┘    │
│                      │                                      │
│                      ▼                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Docker Compose Stack                   │    │
│  │                                                     │    │
│  │   ┌───────────┐   ┌───────────┐   ┌───────────┐   │    │
│  │   │ Promtail  │──▶│   Loki    │◀──│  Grafana  │   │    │
│  │   │  :9080    │   │   :3100   │   │   :3001   │   │    │
│  │   └───────────┘   └───────────┘   └───────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 빠른 시작

### 1. Loki 스택 실행

```bash
cd docker/loki
docker-compose up -d
```

### 2. Spring Boot 애플리케이션 실행

```bash
# 프로젝트 루트에서
./gradlew bootRun
```

### 3. Grafana 접속

- URL: http://localhost:3001
- 계정: admin / admin

## 접속 URL

| 서비스 | URL | 설명 |
|--------|-----|------|
| Grafana | http://localhost:3001 | 로그 시각화 대시보드 |
| Loki | http://localhost:3100 | 로그 저장/쿼리 엔진 |
| Promtail | http://localhost:9080 | 로그 수집 상태 |

## 로그 쿼리 예시

Grafana > Explore에서 다음 쿼리를 사용할 수 있습니다:

```logql
# 모든 로그
{job="open-green"}

# 에러 로그만
{job="open-green", log_type="error"}

# 특정 레벨 로그
{job="open-green"} | level="INFO"

# 특정 키워드 검색
{job="open-green"} |= "exception"

# JSON 필드 파싱 후 필터
{job="open-green"} | json | level="ERROR"
```

## 로그 파일 구조

Spring Boot 앱에서 생성하는 로그 파일:

```
logs/
├── appLogs/
│   └── app.json          # INFO, DEBUG, WARN 로그 (JSON)
├── errorLogs/
│   └── error.json        # ERROR 로그 (JSON)
└── console.log           # 전체 로그 (Plain text)
```

## 파일 설명

| 파일 | 설명 |
|------|------|
| `docker-compose.yml` | Loki, Promtail, Grafana 서비스 정의 |
| `loki-config.yml` | Loki 설정 (저장소, 보존기간 등) |
| `promtail-config.yml` | Promtail 설정 (로그 수집 경로, 파싱 규칙) |
| `provisioning/datasources/loki.yml` | Grafana 데이터소스 자동 설정 |

## 명령어

```bash
# 스택 시작
docker-compose up -d

# 스택 중지
docker-compose down

# 로그 확인
docker-compose logs -f

# 상태 확인
docker-compose ps

# 볼륨 포함 삭제 (데이터 초기화)
docker-compose down -v
```

## 상태 확인

```bash
# Loki 상태
curl http://localhost:3100/ready

# Promtail 타겟 상태
curl http://localhost:9080/targets

# Loki 라벨 확인
curl http://localhost:3100/loki/api/v1/labels
```

## 문제 해결

### Promtail이 로그를 수집하지 않음

1. 로그 파일 존재 확인:
```bash
ls -la ../../logs/appLogs/
ls -la ../../logs/errorLogs/
```

2. Promtail 타겟 확인:
```bash
curl http://localhost:9080/targets
```

3. 애플리케이션이 로그를 생성하는지 확인 (Spring Boot 실행 후)

### Grafana에서 로그가 보이지 않음

1. Loki 상태 확인:
```bash
curl http://localhost:3100/ready
```

2. 데이터소스 연결 확인:
   - Grafana > Configuration > Data Sources > Loki > Test

### 컨테이너 재시작

```bash
docker-compose restart promtail
docker-compose restart loki
docker-compose restart grafana
```

## 설정 커스터마이징

### 로그 보존 기간 변경

`loki-config.yml`에서 수정:
```yaml
limits_config:
  retention_period: 168h  # 7일 → 원하는 기간으로 변경
```

### 로그 수집 경로 변경

`promtail-config.yml`에서 수정:
```yaml
scrape_configs:
  - job_name: open-green-app
    static_configs:
      - targets:
          - localhost
        labels:
          __path__: /var/log/open-green/appLogs/*.json  # 경로 변경
```

## 프로덕션 배포

프로덕션 환경에서는 별도의 설정 파일을 사용하세요:
- `loki-config-prod.yml` (S3 저장소, 높은 보존 기간)
- `promtail-config-prod.yml` (환경변수 기반 설정)
- `docker-compose-prod.yml` (리소스 제한, 보안 설정)
