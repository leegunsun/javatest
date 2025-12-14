# kind 멀티 노드 클러스터 구축 가이드

## 전체 구조 이해하기

```
┌─────────────────────────────────────────────────────────────┐
│  Windows 로컬 PC (당신의 컴퓨터)                              │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Docker Desktop                                        │  │
│  │                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│  │
│  │  │ Master Node  │  │ Worker Node1 │  │ Worker Node2 ││  │
│  │  │  (컨테이너)  │  │  (컨테이너)  │  │  (컨테이너)  ││  │
│  │  │              │  │              │  │              ││  │
│  │  │  Control     │  │   Pod 실행   │  │   Pod 실행   ││  │
│  │  │  Plane       │  │   공간       │  │   공간       ││  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘│  │
│  │                                                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  kubectl 명령어로 관리                                        │
└─────────────────────────────────────────────────────────────┘
```

## 사전 준비

### 필수 요구사항

1. **Docker Desktop** 설치 및 실행
   - 다운로드: https://www.docker.com/products/docker-desktop
   - 설치 후 Docker Desktop을 실행하세요
   - Docker Desktop의 Kubernetes는 비활성화해도 됩니다

2. **kubectl** 설치
   - Docker Desktop 설치 시 자동 포함
   - 확인: `kubectl version --client`

3. **시스템 리소스**
   - RAM: 최소 8GB (권장 16GB)
   - CPU: 최소 4코어 (권장 6코어 이상)
   - 디스크: 여유 공간 10GB 이상

### 리소스 배분 예시

```
총 RAM 16GB 시스템 기준:
- Windows OS: 4GB
- Docker Desktop: 8GB (설정 필요)
  ├─ Master Node: 2GB
  ├─ Worker Node1: 3GB
  └─ Worker Node2: 3GB
- 기타 애플리케이션: 4GB
```

Docker Desktop 메모리 설정:
1. Docker Desktop → Settings → Resources
2. Memory를 8GB 이상으로 설정
3. Apply & Restart

## 설치 단계

### 1단계: kind 설치

#### 방법 1: Chocolatey 사용 (권장)

PowerShell을 **관리자 권한**으로 실행:

```powershell
# Chocolatey 설치 (아직 없다면)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# kind 설치
choco install kind -y
```

#### 방법 2: winget 사용 (Windows 11 또는 최신 Windows 10)

```powershell
winget install Kubernetes.kind
```

#### 방법 3: 수동 다운로드

1. https://kind.sigs.k8s.io/dl/latest/kind-windows-amd64 다운로드
2. `kind.exe`로 이름 변경
3. `C:\Windows\System32\` 또는 PATH에 있는 폴더로 이동

#### 설치 확인

```powershell
kind version
# 출력 예시: kind v0.20.0 go1.21.0 windows/amd64
```

### 2단계: 클러스터 생성

PowerShell에서 k8s/setup 디렉토리로 이동:

```powershell
cd C:\Users\zkvpt\Desktop\javatest\k8s\setup
```

#### 방법 1: 관리 스크립트 사용 (권장)

```powershell
# 클러스터 생성
.\manage-cluster.ps1 create

# 상태 확인
.\manage-cluster.ps1 status

# 클러스터 삭제 (필요시)
.\manage-cluster.ps1 delete
```

#### 방법 2: 직접 명령어 사용

```powershell
# 클러스터 생성 (2-3분 소요)
kind create cluster --config=kind-cluster-config.yaml

# 생성 중 출력 예시:
# Creating cluster "spring-boot-cluster" ...
#  ✓ Ensuring node image (kindest/node:v1.27.3) 🖼
#  ✓ Preparing nodes 📦 📦 📦
#  ✓ Writing configuration 📜
#  ✓ Starting control-plane 🕹️
#  ✓ Installing CNI 🔌
#  ✓ Installing StorageClass 💾
#  ✓ Joining worker nodes 🚜
# Set kubectl context to "kind-spring-boot-cluster"
```

### 3단계: 클러스터 확인

```powershell
# 노드 확인 (Master 1 + Worker 2 = 총 3개)
kubectl get nodes

# 출력 예시:
# NAME                                STATUS   ROLES           AGE   VERSION
# spring-boot-cluster-control-plane   Ready    control-plane   2m    v1.27.3
# spring-boot-cluster-worker          Ready    <none>          2m    v1.27.3
# spring-boot-cluster-worker2         Ready    <none>          2m    v1.27.3
```

```powershell
# 노드 상세 정보 (IP, OS 등)
kubectl get nodes -o wide

# 노드 레이블 확인
kubectl get nodes --show-labels
```

```powershell
# Docker 컨테이너로 확인 (kind 노드는 실제로 Docker 컨테이너)
docker ps --filter "name=spring-boot-cluster"

# 출력 예시:
# CONTAINER ID   IMAGE                  NAMES
# xxxxxxxxxxxx   kindest/node:v1.27.3   spring-boot-cluster-worker2
# xxxxxxxxxxxx   kindest/node:v1.27.3   spring-boot-cluster-worker
# xxxxxxxxxxxx   kindest/node:v1.27.3   spring-boot-cluster-control-plane
```

### 4단계: kubectl 컨텍스트 확인

```powershell
# 현재 컨텍스트 확인
kubectl config current-context
# 출력: kind-spring-boot-cluster

# 모든 컨텍스트 보기
kubectl config get-contexts

# kind 클러스터로 전환 (필요시)
kubectl config use-context kind-spring-boot-cluster
```

## 클러스터 테스트

### 테스트 Pod 배포

```powershell
# nginx Pod 3개 배포
kubectl create deployment nginx-test --image=nginx --replicas=3

# Pod 상태 확인 (어느 노드에 배포되었는지 확인)
kubectl get pods -o wide

# 출력 예시:
# NAME                          READY   STATUS    NODE
# nginx-test-7d8b49c9d9-abcde   1/1     Running   spring-boot-cluster-worker
# nginx-test-7d8b49c9d9-fghij   1/1     Running   spring-boot-cluster-worker2
# nginx-test-7d8b49c9d9-klmno   1/1     Running   spring-boot-cluster-worker
```

보시다시피 Pod들이 **Worker 노드들에 분산 배포**됩니다!

### 테스트 정리

```powershell
kubectl delete deployment nginx-test
```

## 현재 프로젝트 배포하기

### Spring Boot 애플리케이션 Docker 이미지 빌드

```powershell
# 프로젝트 루트로 이동
cd C:\Users\zkvpt\Desktop\javatest

# Docker 이미지 빌드
docker build -t spring-boot-app:latest .

# kind 클러스터에 이미지 로드
kind load docker-image spring-boot-app:latest --name spring-boot-cluster
```

### Kubernetes 리소스 배포

```powershell
# k8s 디렉토리로 이동
cd k8s

# ConfigMap 및 Secret 배포
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml

# Deployment 배포
kubectl apply -f deployment.yaml

# Service 배포
kubectl apply -f service.yaml

# (선택) Ingress 배포
kubectl apply -f ingress.yaml
```

### 배포 확인

```powershell
# Pod 확인 (어느 Worker 노드에 배포되었는지 확인)
kubectl get pods -o wide

# Service 확인
kubectl get svc

# 애플리케이션 로그 확인
kubectl logs -f deployment/spring-boot-app
```

### 애플리케이션 접근

NodePort 서비스를 사용하는 경우:

```powershell
# Service 포트 확인
kubectl get svc spring-boot-app

# 브라우저에서 접근
# http://localhost:30080 (kind-cluster-config.yaml에서 설정한 포트)
```

Port Forward를 사용하는 경우:

```powershell
# 포트 포워딩 (로컬 8082 → Pod 8082)
kubectl port-forward deployment/spring-boot-app 8082:8082

# 브라우저에서 접근
# http://localhost:8082
```

## 멀티 노드 동작 확인

### Pod가 여러 Worker에 분산되는지 확인

```powershell
# Deployment 스케일 증가
kubectl scale deployment spring-boot-app --replicas=6

# Pod 배포 위치 확인
kubectl get pods -o wide | findstr spring-boot-app

# 출력 예시:
# spring-boot-app-xxx   1/1   Running   spring-boot-cluster-worker
# spring-boot-app-yyy   1/1   Running   spring-boot-cluster-worker2
# spring-boot-app-zzz   1/1   Running   spring-boot-cluster-worker
# spring-boot-app-aaa   1/1   Running   spring-boot-cluster-worker2
# spring-boot-app-bbb   1/1   Running   spring-boot-cluster-worker
# spring-boot-app-ccc   1/1   Running   spring-boot-cluster-worker2
```

Worker1과 Worker2에 고르게 분산된 것을 확인할 수 있습니다!

### 노드별 Pod 수 확인

```powershell
# 각 노드에서 실행 중인 Pod 수
kubectl get pods -A -o wide | findstr worker | Measure-Object -Line
kubectl get pods -A -o wide | findstr worker2 | Measure-Object -Line
```

### 특정 노드에 Pod 배포하기 (Node Selector 테스트)

deployment.yaml에 nodeSelector 추가:

```yaml
spec:
  template:
    spec:
      nodeSelector:
        worker-id: "1"  # Worker 1에만 배포
```

적용 후 확인:

```powershell
kubectl apply -f deployment.yaml
kubectl get pods -o wide
# 모든 Pod가 worker-id=1 레이블을 가진 노드에만 배포됨
```

## 문제 해결

### 클러스터 생성 실패

**증상**: `Creating cluster "spring-boot-cluster" ...` 에서 멈춤

**해결**:
1. Docker Desktop이 실행 중인지 확인
2. Docker Desktop 재시작
3. kind 클러스터 삭제 후 재생성

```powershell
kind delete cluster --name spring-boot-cluster
kind create cluster --config=kind-cluster-config.yaml
```

### kubectl 명령어가 작동하지 않음

**증상**: `The connection to the server localhost:8080 was refused`

**해결**:
```powershell
# 컨텍스트 확인 및 전환
kubectl config get-contexts
kubectl config use-context kind-spring-boot-cluster
```

### Docker 이미지를 찾을 수 없음

**증상**: `ErrImagePull` 또는 `ImagePullBackOff`

**해결**:
```powershell
# 이미지를 kind 클러스터에 로드
kind load docker-image spring-boot-app:latest --name spring-boot-cluster

# 이미지가 로드되었는지 확인
docker exec -it spring-boot-cluster-worker crictl images | findstr spring-boot-app
```

### 메모리 부족 (OOM)

**증상**: Pod가 자꾸 재시작됨, `OOMKilled` 상태

**해결**:
1. Docker Desktop 메모리 증가 (Settings → Resources → Memory)
2. Pod의 resource limits 조정
3. 클러스터 재시작

```powershell
# 클러스터 삭제 및 재생성
kind delete cluster --name spring-boot-cluster
# Docker Desktop 메모리 설정 변경 후
kind create cluster --config=kind-cluster-config.yaml
```

## 유용한 명령어 모음

```powershell
# 클러스터 정보
kubectl cluster-info --context kind-spring-boot-cluster

# 모든 리소스 확인
kubectl get all -A

# 특정 네임스페이스의 모든 리소스
kubectl get all -n default

# Pod 로그 실시간 보기
kubectl logs -f <pod-name>

# Pod 내부 접속
kubectl exec -it <pod-name> -- /bin/bash

# 리소스 사용량 확인 (Metrics Server 설치 필요)
kubectl top nodes
kubectl top pods

# 이벤트 확인 (문제 진단에 유용)
kubectl get events --sort-by='.lastTimestamp'

# YAML 출력 (현재 설정 확인)
kubectl get deployment spring-boot-app -o yaml

# 리소스 삭제
kubectl delete -f deployment.yaml
kubectl delete all --all  # 모든 리소스 삭제 (주의!)
```

## 클러스터 정리

### 임시 정리 (클러스터 유지)

```powershell
# 애플리케이션만 삭제
kubectl delete -f k8s/

# 또는 네임스페이스 전체 정리
kubectl delete all --all -n default
```

### 완전 정리 (클러스터 삭제)

```powershell
# 방법 1: 스크립트 사용
.\manage-cluster.ps1 delete

# 방법 2: 직접 삭제
kind delete cluster --name spring-boot-cluster

# 모든 kind 클러스터 삭제
kind delete clusters --all
```

## 다음 단계

1. **Ingress Controller 설치** (외부 접근 관리)
   - nginx-ingress, traefik 등

2. **Monitoring 구축** (시스템 관찰)
   - Prometheus + Grafana

3. **로깅 시스템 구축** (로그 수집)
   - EFK Stack (Elasticsearch, Fluentd, Kibana)

4. **CI/CD 연동** (자동 배포)
   - Jenkins, GitHub Actions

5. **HPA 테스트** (자동 스케일링)
   - Horizontal Pod Autoscaler

## 참고 자료

- kind 공식 문서: https://kind.sigs.k8s.io/
- Kubernetes 공식 문서: https://kubernetes.io/docs/
- kubectl Cheat Sheet: https://kubernetes.io/docs/reference/kubectl/cheatsheet/
