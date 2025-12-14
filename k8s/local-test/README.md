# Kind 로컬 테스트 환경 가이드

이 디렉토리에는 Kind(Kubernetes IN Docker)를 사용한 로컬 테스트 환경 설정이 포함되어 있습니다.

## 📚 목차

- [사전 요구사항](#사전-요구사항)
- [빠른 시작](#빠른-시작)
- [파일 구조](#파일-구조)
- [단계별 설정](#단계별-설정)
- [테스트 및 검증](#테스트-및-검증)
- [트러블슈팅](#트러블슈팅)
- [학습 로드맵](#학습-로드맵)
- [참고 자료](#참고-자료)

---

## 사전 요구사항

### 필수 도구

1. **Docker Desktop**
   - Windows: [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
   - 설치 후 실행 중이어야 함
   - WSL2 백엔드 권장

2. **kind**
   ```powershell
   # Chocolatey 사용
   choco install kind

   # 또는 수동 설치 (k8s/setup/install-kind.ps1 실행)
   ```

3. **kubectl**
   ```powershell
   choco install kubernetes-cli
   ```

### 시스템 요구사항

- **메모리**: 최소 8GB (16GB 권장)
- **CPU**: 최소 4 코어
- **디스크**: 최소 20GB 여유 공간

---

## 빠른 시작

### 자동 설정 (추천)

```powershell
# 1. 설정 디렉토리로 이동
cd k8s/setup

# 2. 자동 설정 스크립트 실행
.\setup-local-cluster.ps1
```

이 스크립트는 다음을 자동으로 수행합니다:
- ✅ 환경 검증 (Docker, kind, kubectl)
- ✅ Kind 클러스터 생성
- ✅ Nginx Ingress Controller 설치
- ✅ Docker 이미지 빌드 및 로드
- ✅ Kubernetes 리소스 배포 (선택사항)

### 수동 설정

단계별로 직접 설정하려면 [단계별 설정](#단계별-설정) 섹션을 참고하세요.

---

## 파일 구조

```
k8s/
├── setup/
│   ├── kind-local-test-config.yaml    # Kind 클러스터 설정
│   └── setup-local-cluster.ps1        # 자동 설정 스크립트
│
└── local-test/
    ├── deployment-local.yaml          # Pod 배포 설정
    ├── service-local.yaml             # 네트워크 서비스 설정
    ├── ingress-local.yaml             # 외부 접근 라우팅
    ├── configmap-local.yaml           # 애플리케이션 설정
    └── README.md                      # 이 문서
```

### 각 파일의 역할

| 파일 | 역할 | 학습 포인트 |
|------|------|------------|
| `kind-local-test-config.yaml` | Kind 클러스터 구성 정의 | 멀티 노드, 포트 매핑, 네트워크 설정 |
| `deployment-local.yaml` | Pod 배포 및 관리 | 복제본, 롤링 업데이트, Probe 설정 |
| `service-local.yaml` | Service 네트워크 설정 | ClusterIP, NodePort, 로드 밸런싱 |
| `ingress-local.yaml` | HTTP/HTTPS 라우팅 | 경로 기반 라우팅, TLS, 어노테이션 |
| `configmap-local.yaml` | 애플리케이션 설정 관리 | 환경 변수, 파일 마운트 |

---

## 단계별 설정

### 1단계: Kind 클러스터 생성

```powershell
# k8s/setup 디렉토리에서
kind create cluster --config=kind-local-test-config.yaml

# 클러스터 확인
kubectl cluster-info --context kind-local-test-cluster
kubectl get nodes
```

**예상 출력:**
```
NAME                              STATUS   ROLES           AGE   VERSION
local-test-cluster-control-plane  Ready    control-plane   1m    v1.27.3
local-test-cluster-worker         Ready    <none>          1m    v1.27.3
local-test-cluster-worker2        Ready    <none>          1m    v1.27.3
```

**학습 포인트:**
- Control Plane과 Worker 노드의 역할
- 멀티 노드 클러스터의 이점
- kubectl context 개념

### 2단계: Nginx Ingress Controller 설치

```powershell
# Ingress Controller 매니페스트 적용
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Ingress Controller Pod 준비 대기
kubectl wait --namespace ingress-nginx `
  --for=condition=ready pod `
  --selector=app.kubernetes.io/component=controller `
  --timeout=300s

# 확인
kubectl get pods -n ingress-nginx
```

**학습 포인트:**
- Ingress Controller의 역할
- Namespace 개념
- kubectl wait 명령어 사용

### 3단계: Docker 이미지 빌드 및 로드

```powershell
# 프로젝트 루트 디렉토리로 이동
cd C:\Users\zkvpt\Desktop\javatest

# Docker 이미지 빌드
docker build -t open-green:local-test .

# Kind 클러스터로 이미지 로드
kind load docker-image open-green:local-test --name local-test-cluster

# 확인 (클러스터 내부에서)
docker exec -it local-test-cluster-control-plane crictl images | grep open-green
```

**학습 포인트:**
- Multi-stage Docker 빌드
- Kind 클러스터의 이미지 관리
- Container Runtime (containerd) 이해

### 4단계: Kubernetes 리소스 배포

```powershell
# k8s/local-test 디렉토리로 이동
cd k8s\local-test

# 1. ConfigMap 생성 (설정 파일)
kubectl apply -f configmap-local.yaml

# 2. Secret 생성 (민감한 정보 - 필요시)
# kubectl apply -f secret-local.yaml

# 3. Deployment 생성 (Pod 배포)
kubectl apply -f deployment-local.yaml

# 4. Service 생성 (네트워크)
kubectl apply -f service-local.yaml

# 5. Ingress 생성 (외부 접근)
kubectl apply -f ingress-local.yaml

# Pod 준비 대기
kubectl wait --for=condition=ready pod -l app=open-green --timeout=300s
```

**학습 포인트:**
- Kubernetes 리소스 간 의존성
- 선언적 배포 방식
- Pod 라이프사이클

### 5단계: 배포 확인

```powershell
# 모든 리소스 확인
kubectl get all

# Pod 상태 확인
kubectl get pods -o wide

# Service 확인
kubectl get service

# Ingress 확인
kubectl get ingress

# 상세 정보
kubectl describe deployment open-green-local
kubectl describe pod <pod-name>
```

**예상 출력:**
```
NAME                                    READY   STATUS    RESTARTS   AGE
pod/open-green-local-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
pod/open-green-local-xxxxxxxxxx-xxxxx   1/1     Running   0          2m

NAME                       TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
service/open-green-service ClusterIP   10.96.100.100   <none>        8080/TCP   2m

NAME                               READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/open-green-local   2/2     2            2           2m

NAME                                          CLASS   HOSTS   ADDRESS     PORTS   AGE
ingress.networking.k8s.io/open-green-ingress  nginx   *       localhost   80      2m
```

---

## 테스트 및 검증

### 기본 접속 테스트

```powershell
# 1. Ingress를 통한 접속 (추천)
curl http://localhost/actuator/health

# 2. NodePort를 통한 직접 접속
curl http://localhost:30080/actuator/health

# 3. Port Forward를 통한 접속
kubectl port-forward service/open-green-service 8080:8080
# 다른 터미널에서: curl http://localhost:8080/actuator/health
```

**예상 응답:**
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP"
    },
    "redis": {
      "status": "UP"
    }
  }
}
```

### 로그 확인

```powershell
# 전체 Pod 로그 확인
kubectl logs -l app=open-green --tail=100 -f

# 특정 Pod 로그 확인
kubectl logs <pod-name> -f

# 이전 컨테이너 로그 (재시작된 경우)
kubectl logs <pod-name> --previous
```

### Pod 내부 접근

```powershell
# Pod 내부 쉘 접근
kubectl exec -it <pod-name> -- /bin/sh

# 내부에서 테스트
wget -O- http://localhost:8082/actuator/health
exit
```

### DNS 및 Service 테스트

```powershell
# 임시 디버그 Pod 실행
kubectl run -it --rm debug --image=busybox --restart=Never -- sh

# Pod 내부에서 DNS 테스트
nslookup open-green-service
wget -O- http://open-green-service:8080/actuator/health
exit
```

---

## 트러블슈팅

### Pod가 시작하지 않음

**증상:**
```
NAME                                READY   STATUS             RESTARTS   AGE
open-green-local-xxxxxxxxxx-xxxxx   0/1     CrashLoopBackOff   3          2m
```

**해결 방법:**

1. **로그 확인**
   ```powershell
   kubectl logs <pod-name>
   kubectl describe pod <pod-name>
   ```

2. **일반적인 원인**
   - 이미지가 로드되지 않음
     ```powershell
     kind load docker-image open-green:local-test --name local-test-cluster
     ```
   - ConfigMap/Secret 미생성
     ```powershell
     kubectl get configmap
     kubectl apply -f configmap-local.yaml
     ```
   - 리소스 부족 (메모리/CPU)
     ```powershell
     kubectl top nodes
     kubectl top pods
     ```

### Ingress로 접속 안 됨

**증상:**
```
curl: (7) Failed to connect to localhost port 80: Connection refused
```

**해결 방법:**

1. **Ingress Controller 확인**
   ```powershell
   kubectl get pods -n ingress-nginx
   kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
   ```

2. **Endpoints 확인**
   ```powershell
   kubectl get endpoints open-green-service
   ```
   - Endpoints가 비어있다면: Service selector 확인
   - Pod가 Ready 상태인지 확인

3. **포트 매핑 확인**
   ```powershell
   docker ps | findstr local-test-cluster
   ```
   - 80:80, 443:443 매핑 확인

### 이미지 Pull 실패

**증상:**
```
Failed to pull image "open-green:local-test": rpc error: code = Unknown desc = failed to pull and unpack image
```

**해결 방법:**

1. **이미지 존재 확인**
   ```powershell
   docker images | grep open-green
   ```

2. **이미지 다시 로드**
   ```powershell
   kind load docker-image open-green:local-test --name local-test-cluster
   ```

3. **imagePullPolicy 확인**
   - Deployment에서 `imagePullPolicy: IfNotPresent` 또는 `Never` 사용

### 데이터베이스 연결 실패

**증상:**
```
Connection refused to mysql-service:3306
```

**해결 방법:**

1. **MySQL Pod 확인**
   ```powershell
   kubectl get pods -l app=mysql
   kubectl get service mysql-service
   ```

2. **네트워크 연결 테스트**
   ```powershell
   kubectl run -it --rm debug --image=busybox -- sh
   # 내부에서
   nc -zv mysql-service 3306
   ```

3. **ConfigMap의 DB URL 확인**
   ```powershell
   kubectl get configmap open-green-config -o yaml
   ```

---

## 학습 로드맵

### 초급 (1-2주)

**목표:** Kubernetes 기본 개념 이해 및 로컬 환경 구축

- [ ] Docker 기본 개념 (이미지, 컨테이너)
- [ ] Kind 클러스터 생성 및 관리
- [ ] kubectl 기본 명령어 (get, describe, logs)
- [ ] Pod, Deployment 이해
- [ ] Service와 네트워킹 기본

**실습:**
1. 클러스터 생성 및 삭제
2. 간단한 Nginx Pod 배포
3. Service로 Pod 노출
4. kubectl로 리소스 관리

### 중급 (2-3주)

**목표:** 실전 애플리케이션 배포 및 관리

- [ ] ConfigMap과 Secret 사용
- [ ] Volume과 데이터 영속성
- [ ] Ingress Controller와 라우팅
- [ ] Probe (Liveness, Readiness, Startup)
- [ ] Resource Requests/Limits
- [ ] HPA (자동 스케일링)

**실습:**
1. Spring Boot 앱 배포
2. 외부 DB 연동
3. Ingress로 외부 노출
4. 무중단 배포 (Rolling Update)
5. 자동 스케일링 설정

### 고급 (3-4주)

**목표:** 프로덕션 레벨 운영 기술

- [ ] StatefulSet (상태 유지 애플리케이션)
- [ ] DaemonSet, Job, CronJob
- [ ] RBAC (권한 관리)
- [ ] Network Policy (네트워크 보안)
- [ ] Monitoring (Prometheus, Grafana)
- [ ] Logging (EFK Stack)
- [ ] Helm (패키지 관리)

**실습:**
1. Redis 클러스터 구축 (StatefulSet)
2. 배치 작업 스케줄링 (CronJob)
3. 모니터링 대시보드 구축
4. 중앙 로깅 시스템 구축
5. Helm Chart 작성

---

## 참고 자료

### 공식 문서

- [Kubernetes 공식 문서](https://kubernetes.io/docs/)
- [Kind 공식 문서](https://kind.sigs.k8s.io/)
- [Nginx Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Spring Boot Kubernetes](https://spring.io/guides/gs/spring-boot-kubernetes/)

### 추천 학습 자료

- [Kubernetes By Example](https://kubernetesbyexample.com/)
- [Kubernetes the Hard Way](https://github.com/kelseyhightower/kubernetes-the-hard-way)
- [Kubernetes Patterns](https://www.redhat.com/en/resources/cloud-native-container-design-whitepaper)

### 유용한 도구

- **k9s**: 터미널 기반 Kubernetes 관리 도구
  ```powershell
  choco install k9s
  ```

- **kubectx/kubens**: Context와 Namespace 빠른 전환
  ```powershell
  choco install kubectx kubens
  ```

- **Lens**: Kubernetes IDE (GUI)
  - [다운로드](https://k8slens.dev/)

---

## 다음 단계

1. **데이터베이스 추가**
   - MySQL StatefulSet 배포
   - Persistent Volume 설정

2. **Redis 캐시 추가**
   - Redis 클러스터 구성
   - Spring Boot 연동

3. **모니터링 설정**
   - Prometheus + Grafana
   - Spring Boot Actuator 메트릭

4. **CI/CD 파이프라인**
   - GitHub Actions
   - ArgoCD (GitOps)

5. **프로덕션 환경으로 확장**
   - AWS EKS, GKE, AKS 배포
   - 보안 강화 (Network Policy, RBAC)
   - 고가용성 구성

---

## 문의 및 기여

문제가 발생하거나 개선 사항이 있다면:
- Issue 등록
- Pull Request 제출
- 문서 개선 제안

---

**Happy Learning! 🚀**
