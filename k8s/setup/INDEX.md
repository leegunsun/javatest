# kind 멀티 노드 Kubernetes 클러스터 가이드 - 전체 인덱스

## 시작하기 전에

이 디렉토리는 **kind (Kubernetes in Docker)**를 사용하여 로컬 PC에서 **Master 1대 + Worker 2대** 멀티 노드 Kubernetes 클러스터를 구축하고 테스트하는 방법을 제공합니다.

### 왜 멀티 노드 클러스터인가?

```
단일 노드 (Docker Desktop Kubernetes):
┌─────────────────┐
│   All-in-One    │  ← 모든 것이 하나의 노드에
│  Master+Worker  │     실제 프로덕션과 다름
└─────────────────┘

멀티 노드 (kind):
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Master  │  │ Worker 1 │  │ Worker 2 │
│  (관리)  │  │ (실행)   │  │ (실행)   │
└──────────┘  └──────────┘  └──────────┘
  ↑              ↑              ↑
  실제 프로덕션 환경과 유사한 구조
  - Pod 분산 배포
  - 노드 장애 시뮬레이션
  - 스케일링 테스트
```

### 학습 목표

1. **멀티 노드 클러스터 구축**: kind를 사용한 로컬 멀티 노드 환경
2. **Pod 분산 이해**: Pod가 여러 Worker 노드에 분산 배포되는 원리
3. **고가용성 테스트**: 노드 장애 시 Pod 재스케줄링 동작
4. **실전 배포 경험**: 현재 Spring Boot 프로젝트를 멀티 노드에 배포
5. **리소스 관리**: CPU, 메모리 제한 및 모니터링

## 가이드 구조

### 📘 필수 읽기 (순서대로)

| 순서 | 파일명 | 설명 | 소요 시간 |
|------|--------|------|-----------|
| 1 | **README.md** | 전체 설치 가이드 및 개념 설명 | 15-20분 읽기 |
| 2 | **resource-requirements.md** | 시스템 리소스 요구사항 및 최적화 | 10분 읽기 |
| 3 | **deploy-to-multinode.md** | 현재 프로젝트 배포 실습 | 30-40분 실습 |

### 📗 실행 파일

| 파일명 | 용도 | 사용 시점 |
|--------|------|-----------|
| **kind-cluster-config.yaml** | 클러스터 구조 정의 (Master 1 + Worker 2) | 클러스터 생성 시 |
| **install-kind.ps1** | kind 설치 스크립트 | 최초 1회 |
| **manage-cluster.ps1** | 클러스터 생성/삭제/상태 확인 | 클러스터 관리 시 |

### 📙 참조 자료

| 파일명 | 설명 | 사용 방법 |
|--------|------|-----------|
| **quick-reference.md** | 자주 사용하는 명령어 모음 | 작업 중 참조 |
| **INDEX.md** (이 파일) | 전체 가이드 색인 | 네비게이션 |

## 빠른 시작 (5분)

### 전제 조건

- [ ] Docker Desktop 설치 및 실행 중
- [ ] kubectl 설치 확인: `kubectl version --client`
- [ ] PowerShell 5.1 이상
- [ ] RAM 16GB 권장 (최소 8GB)

### 3단계 클러스터 생성

```powershell
# 1. 디렉토리 이동
cd C:\Users\zkvpt\Desktop\javatest\k8s\setup

# 2. 클러스터 생성 (2-3분 소요)
.\manage-cluster.ps1 create

# 3. 노드 확인
kubectl get nodes
# 출력: Master 1개 + Worker 2개 = 총 3개
```

완료! 이제 멀티 노드 클러스터가 준비되었습니다.

## 학습 경로 (권장)

### 초보자 경로 (3-4시간)

```
Day 1: 개념 이해 및 환경 구축 (1-2시간)
├─ README.md 읽기
├─ resource-requirements.md 읽기
├─ kind 설치
└─ 클러스터 생성 및 확인

Day 2: 기본 배포 및 테스트 (1-2시간)
├─ deploy-to-multinode.md Step 1-4 (빌드 및 배포)
├─ Pod 분산 확인
└─ 애플리케이션 접근 테스트

Day 3: 고급 테스트 (1시간)
├─ deploy-to-multinode.md Step 6 (멀티 노드 동작 테스트)
├─ 노드 장애 시뮬레이션
└─ 스케일링 테스트
```

### 경험자 경로 (1-2시간)

```
Step 1: 빠른 구축 (10분)
├─ quick-reference.md의 "5분 빠른 시작" 실행
└─ 클러스터 생성 및 검증

Step 2: 실전 배포 (30-40분)
├─ deploy-to-multinode.md Step 1-5
└─ 애플리케이션 배포 및 접근

Step 3: 고급 테스트 (20-30분)
├─ Pod 분산 확인
├─ 노드 장애 시뮬레이션
└─ HPA 자동 스케일링 테스트
```

## 파일별 상세 설명

### 📘 README.md

**목적**: kind 멀티 노드 클러스터의 전체 개념과 설치 방법

**주요 내용**:
- 멀티 노드 클러스터 개념 (비유와 그림 포함)
- kind 설치 방법 (Chocolatey, winget, 수동)
- 클러스터 생성 단계별 가이드
- 노드 확인 및 검증 방법
- 테스트 Pod 배포 및 분산 확인
- 문제 해결 가이드

**대상**:
- Kubernetes 초보자
- 멀티 노드 환경을 처음 접하는 개발자
- 로컬에서 프로덕션 유사 환경을 구축하고 싶은 사람

**읽는 시간**: 15-20분
**실습 시간**: 30-40분

---

### 📗 resource-requirements.md

**목적**: 시스템 리소스 요구사항 및 최적화 방법

**주요 내용**:
- 하드웨어 최소/권장 사양
- RAM, CPU 배분 계산
- Docker Desktop 리소스 설정
- Pod 리소스 제한 설정 (requests/limits)
- 성능 모니터링 방법
- JVM 힙 메모리 최적화
- 문제 해결 (OOMKilled, CPU 스로틀링 등)

**대상**:
- 리소스가 제한적인 환경에서 작업하는 개발자
- Pod 리소스 관리를 배우고 싶은 사람
- 성능 최적화에 관심 있는 개발자

**읽는 시간**: 10분
**실습 시간**: 설정 조정에 5-10분

---

### 📗 deploy-to-multinode.md

**목적**: 현재 Spring Boot 프로젝트를 멀티 노드 클러스터에 배포

**주요 내용**:
- 전체 배포 흐름 (빌드 → 이미지 생성 → 배포 → 테스트)
- Gradle 빌드 및 Docker 이미지 생성
- kind 클러스터에 이미지 로드
- Kubernetes 리소스 배포 (ConfigMap, Secret, Deployment, Service, HPA, Ingress)
- 애플리케이션 접근 방법 (Port Forward, NodePort, LoadBalancer)
- 멀티 노드 동작 테스트 (Pod 분산, 노드 장애, HPA, 롤링 업데이트)
- 문제 해결 가이드

**대상**:
- 실제 애플리케이션을 배포하고 싶은 개발자
- Kubernetes 리소스 배포 순서를 배우고 싶은 사람
- 멀티 노드 동작을 직접 확인하고 싶은 개발자

**읽는 시간**: 15분
**실습 시간**: 30-40분

---

### 📙 quick-reference.md

**목적**: 자주 사용하는 명령어 빠른 참조

**주요 내용**:
- 5분 빠른 시작 가이드
- 클러스터 관리 명령어
- 노드 관리 명령어
- 애플리케이션 배포 명령어
- Pod, Deployment, Service 관리
- 디버깅 및 모니터링 명령어
- 자주 사용하는 시나리오별 명령어
- 문제 해결 체크리스트
- PowerShell Alias 설정

**대상**:
- 작업 중 명령어를 빠르게 찾고 싶은 개발자
- 자주 사용하는 패턴을 확인하고 싶은 사람

**사용 방법**: 작업 중 필요할 때 참조 (북마크 추천)

---

### 📄 kind-cluster-config.yaml

**목적**: 멀티 노드 클러스터 구조 정의

**구성**:
```yaml
nodes:
  - role: control-plane  # Master 노드 1개
  - role: worker         # Worker 노드 1개
  - role: worker         # Worker 노드 1개
```

**주요 설정**:
- 포트 매핑 (NodePort 접근용)
- 노드 레이블 (worker-id, node-type)
- 네트워킹 설정 (Pod/Service CIDR)

**사용 시점**: `kind create cluster --config=kind-cluster-config.yaml`

---

### 📄 install-kind.ps1

**목적**: kind 설치 안내 스크립트

**설치 방법**:
1. Chocolatey (권장)
2. winget (Windows 11 또는 최신 Windows 10)
3. 수동 다운로드

**사용 시점**: kind를 처음 설치할 때 (최초 1회)

---

### 📄 manage-cluster.ps1

**목적**: 클러스터 생성/삭제/상태 확인 자동화

**명령어**:
```powershell
.\manage-cluster.ps1 create  # 클러스터 생성
.\manage-cluster.ps1 delete  # 클러스터 삭제
.\manage-cluster.ps1 status  # 클러스터 상태 확인
.\manage-cluster.ps1 help    # 도움말
```

**기능**:
- Docker 실행 상태 확인
- kind 설치 확인
- 클러스터 생성 (kind-cluster-config.yaml 사용)
- 노드 및 상태 확인
- 안전한 클러스터 삭제 (확인 메시지)

**사용 시점**: 클러스터를 관리할 때마다

---

## 단계별 실습 가이드

### Phase 1: 환경 구축 (30분)

**목표**: kind 멀티 노드 클러스터 생성

1. **사전 준비 확인**
   ```powershell
   docker --version
   kubectl version --client
   ```

2. **README.md 읽기** (15분)
   - 개념 이해
   - 설치 방법 확인

3. **resource-requirements.md 읽기** (10분)
   - 시스템 리소스 확인
   - Docker Desktop 메모리 설정 (8GB 이상 권장)

4. **kind 설치** (5분)
   - install-kind.ps1 참조
   - Chocolatey 또는 winget 사용

5. **클러스터 생성** (5분)
   ```powershell
   cd C:\Users\zkvpt\Desktop\javatest\k8s\setup
   .\manage-cluster.ps1 create
   kubectl get nodes  # Master 1 + Worker 2 확인
   ```

**체크포인트**:
- [ ] 노드 3개 생성 확인 (Master 1 + Worker 2)
- [ ] 모든 노드 Ready 상태
- [ ] kubectl 명령어 정상 작동

---

### Phase 2: 기본 배포 (40분)

**목표**: 현재 Spring Boot 프로젝트 배포

1. **deploy-to-multinode.md Step 1-2** (15분)
   - Gradle 빌드
   - Docker 이미지 생성
   - kind 클러스터에 이미지 로드

2. **deploy-to-multinode.md Step 3** (15분)
   - Kubernetes 리소스 배포
   - ConfigMap, Secret, Deployment, Service

3. **deploy-to-multinode.md Step 4** (10분)
   - Pod 분산 확인
   - 로그 확인
   - Service 확인

4. **deploy-to-multinode.md Step 5** (10분)
   - Port Forward로 애플리케이션 접근
   - 브라우저에서 http://localhost:8082 확인
   - Swagger UI 접근 테스트

**체크포인트**:
- [ ] Pod가 Worker 노드에 고르게 분산됨
- [ ] 모든 Pod가 Running 상태
- [ ] 애플리케이션 정상 접근 가능
- [ ] Swagger UI 정상 표시

---

### Phase 3: 멀티 노드 테스트 (30분)

**목표**: 멀티 노드 환경의 특성 이해 및 테스트

1. **Pod 분산 테스트** (10분)
   ```powershell
   kubectl scale deployment spring-boot-app --replicas=6
   kubectl get pods -o wide
   # Worker 1과 Worker 2에 고르게 분산 확인
   ```

2. **노드 장애 시뮬레이션** (10분)
   ```powershell
   docker stop spring-boot-cluster-worker
   kubectl get pods -o wide
   # Pod 재스케줄링 확인
   docker start spring-boot-cluster-worker
   ```

3. **HPA 자동 스케일링** (10분)
   - Metrics Server 설치
   - HPA 배포
   - 부하 생성 및 스케일링 확인

**체크포인트**:
- [ ] Pod가 여러 Worker 노드에 분산됨
- [ ] 노드 장애 시 Pod 자동 재배치
- [ ] HPA 자동 스케일링 동작 확인

---

## 문제 해결 인덱스

### Docker Desktop 관련

| 문제 | 해결 방법 | 참조 |
|------|-----------|------|
| Docker가 실행되지 않음 | Docker Desktop 재시작 | README.md |
| 메모리 부족 오류 | Docker Desktop 메모리 증가 (8GB 이상) | resource-requirements.md |
| 디스크 공간 부족 | `docker system prune -a --volumes` | quick-reference.md |

### kind 클러스터 관련

| 문제 | 해결 방법 | 참조 |
|------|-----------|------|
| 클러스터 생성 실패 | Docker 확인 후 재시도 | README.md |
| 노드가 NotReady | 노드 재시작 `docker restart <node-name>` | quick-reference.md |
| 클러스터 삭제 안됨 | `kind delete clusters --all` | manage-cluster.ps1 |

### Pod 관련

| 문제 | 해결 방법 | 참조 |
|------|-----------|------|
| Pod Pending 상태 | 리소스 부족 확인, requests/limits 조정 | deploy-to-multinode.md |
| ImagePullBackOff | `kind load docker-image` 재실행 | deploy-to-multinode.md |
| CrashLoopBackOff | `kubectl logs <pod-name>` 확인 | deploy-to-multinode.md |
| OOMKilled | memory limits 증가 | resource-requirements.md |

### 네트워크 관련

| 문제 | 해결 방법 | 참조 |
|------|-----------|------|
| Service 접근 불가 | Endpoints 확인, 레이블 일치 확인 | deploy-to-multinode.md |
| Port Forward 실패 | Pod가 Running 상태인지 확인 | quick-reference.md |
| NodePort 접근 불가 | kind-cluster-config.yaml 포트 매핑 확인 | README.md |

## 자주 묻는 질문 (FAQ)

### Q1: 8GB RAM에서도 가능한가요?

**A**: 가능하지만 제한적입니다.
- Docker Desktop: 4GB 할당
- 최대 Replica: 2-3개
- IDE, 브라우저 등 최소화 필요
- 권장: 16GB RAM

참조: resource-requirements.md

---

### Q2: Worker 노드를 더 추가할 수 있나요?

**A**: 가능합니다.

kind-cluster-config.yaml 수정:

```yaml
nodes:
  - role: control-plane  # Master
  - role: worker         # Worker 1
  - role: worker         # Worker 2
  - role: worker         # Worker 3 (추가)
  - role: worker         # Worker 4 (추가)
```

참조: README.md

---

### Q3: 프로덕션 환경과 차이점은?

**A**: 주요 차이점:
- 로컬: 모든 노드가 Docker 컨테이너
- 프로덕션: 실제 물리/가상 서버
- 로컬: 리소스 제약 (PC 사양)
- 프로덕션: 대규모 리소스

그러나 **Kubernetes 동작 원리는 동일**합니다!

참조: README.md

---

### Q4: Minikube와 비교하면?

**A**: kind 장점:
- 멀티 노드 구성이 훨씬 쉬움
- YAML 파일로 클러스터 구조 정의
- CI/CD에서 많이 사용
- 리소스 사용량 낮음

Minikube 장점:
- 많은 사용자 (자료 풍부)
- 다양한 드라이버 지원

참조: README.md

---

### Q5: 클러스터를 계속 켜두면 안 되나요?

**A**: 가능하지만 비권장:
- 시스템 리소스 지속 사용
- 배터리 소모 (노트북)
- 필요 없을 때는 삭제 권장

간편 사용:

```powershell
# 사용 시작
.\manage-cluster.ps1 create

# 사용 종료
.\manage-cluster.ps1 delete
```

참조: manage-cluster.ps1

---

### Q6: 실수로 클러스터를 삭제했어요!

**A**: 괜찮습니다! 다시 생성하면 됩니다:

```powershell
.\manage-cluster.ps1 create
kubectl apply -f ../  # k8s 리소스 재배포
```

kind 클러스터는 몇 분 안에 재생성 가능합니다.

참조: quick-reference.md

---

## 추가 학습 자료

### 공식 문서

- **kind**: https://kind.sigs.k8s.io/
- **Kubernetes**: https://kubernetes.io/docs/
- **kubectl**: https://kubernetes.io/docs/reference/kubectl/cheatsheet/

### 권장 학습 순서

1. **Kubernetes 기본 개념**
   - Pod, Deployment, Service
   - ConfigMap, Secret
   - Namespace, Labels

2. **고급 리소스**
   - HPA (Horizontal Pod Autoscaler)
   - Ingress
   - PersistentVolume

3. **운영 실무**
   - 모니터링 (Prometheus + Grafana)
   - 로깅 (EFK Stack)
   - CI/CD (GitHub Actions, Jenkins)

4. **프로덕션 준비**
   - 클라우드 Kubernetes (EKS, GKE, AKS)
   - Helm (패키지 관리)
   - Service Mesh (Istio, Linkerd)

## 피드백 및 개선

이 가이드에 대한 피드백이나 개선 사항은 언제든지 환영합니다!

### 기여 방법

1. 오타나 개선 사항 발견 시 수정
2. 새로운 시나리오 추가
3. 문제 해결 사례 공유
4. 학습 후기 및 팁 공유

---

**마지막 업데이트**: 2024-12-14

**작성자**: Claude Code SuperClaude (Kubernetes Coach)

**라이센스**: 프로젝트 라이센스 준수
