# Kubernetes kubectl 실행 원리와 아키텍처

## 핵심 질문에 대한 답변

**Q1. EC2 3대 운영 환경에서 어느 컴퓨터에서 명령어를 실행해야 하나요?**

**A1. kubectl은 "어디서든" 실행 가능합니다!**
- 필요 조건: kubeconfig 파일 + 네트워크 접근 권한
- 실행 가능 위치: 로컬 PC, Bastion Host, CI/CD 서버, Master Node, Worker Node 등

**Q2. 명령어의 결과로 어디에 설치될까요?**

**A2. Worker Node의 컨테이너(Pod)로 설치됩니다!**
- kubectl은 명령만 전달하는 클라이언트 도구
- 실제 Pod는 Scheduler가 선택한 Worker Node에서 kubelet이 생성

---

## 1. 현재 로컬 환경 (Kind) 아키텍처

```
┌───────────────────────────────────────────────────────────────────┐
│                    개인 컴퓨터 (Windows)                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  kubectl 명령어 실행                                        │  │
│  │  $ kubectl apply -f ingress-nginx.yaml                     │  │
│  └────────────────┬───────────────────────────────────────────┘  │
│                   │                                               │
│                   │ HTTPS 통신 (localhost:6443)                  │
│                   ▼                                               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │         Kind Cluster (Docker Container)                     │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  API Server (Kubernetes Master)                      │  │  │
│  │  │  - 모든 kubectl 명령 수신                            │  │  │
│  │  │  - 인증/인가 검증                                     │  │  │
│  │  │  - etcd에 상태 저장                                  │  │  │
│  │  └────────────┬─────────────────────────────────────────┘  │  │
│  │               │                                             │  │
│  │               ▼                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  Scheduler                                           │  │  │
│  │  │  - "어느 Worker Node에 배치할까?" 결정              │  │  │
│  │  └────────────┬─────────────────────────────────────────┘  │  │
│  │               │                                             │  │
│  │               ▼                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  Worker Node (kubelet)                               │  │  │
│  │  │  ┌────────────────────────────────────────────────┐  │  │  │
│  │  │  │  Ingress Controller Pod                         │  │  │  │
│  │  │  │  ← 실제로 여기 설치됩니다!                      │  │  │  │
│  │  │  └────────────────────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘

핵심:
- kubectl 실행 위치: 개인 컴퓨터
- Ingress 설치 위치: Kind Cluster 내부 Worker Node의 Pod
```

---

## 2. EC2 3대 운영 환경 아키텍처

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           AWS VPC (10.0.0.0/16)                           │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Public Subnet (10.0.1.0/24)                                     │    │
│  │  ┌────────────────────────────────────────────────────────────┐  │    │
│  │  │  EC2 #1: Master Node (Control Plane)                       │  │    │
│  │  │  ┌──────────────────────────────────────────────────────┐  │  │    │
│  │  │  │  API Server (포트 6443)                              │  │  │    │
│  │  │  │  - kubectl 명령 수신                                │  │  │    │
│  │  │  │  - 인증/인가 검증                                    │  │  │    │
│  │  │  └──────────────────────────────────────────────────────┘  │  │    │
│  │  │  ┌──────────────────────────────────────────────────────┐  │  │    │
│  │  │  │  Scheduler                                           │  │  │    │
│  │  │  │  - Pod 배치 Worker Node 결정                        │  │  │    │
│  │  │  └──────────────────────────────────────────────────────┘  │  │    │
│  │  │  ┌──────────────────────────────────────────────────────┐  │  │    │
│  │  │  │  Controller Manager                                  │  │  │    │
│  │  │  │  - 리소스 상태 관리                                  │  │  │    │
│  │  │  └──────────────────────────────────────────────────────┘  │  │    │
│  │  │  ┌──────────────────────────────────────────────────────┐  │  │    │
│  │  │  │  etcd                                                │  │  │    │
│  │  │  │  - 클러스터 상태 저장소                              │  │  │    │
│  │  │  └──────────────────────────────────────────────────────┘  │  │    │
│  │  │                                                             │  │    │
│  │  │  Public IP: 54.123.45.67                                   │  │    │
│  │  └────────────────▲───────────────────────────────────────────┘  │    │
│  │                   │                                               │    │
│  │                   │ kubectl 명령 전송 (HTTPS 6443)               │    │
│  └───────────────────┼───────────────────────────────────────────────┘    │
│                      │                                                     │
│  ┌───────────────────┼───────────────────────────────────────────────┐   │
│  │  Private Subnet (10.0.2.0/24)                                     │   │
│  │  ┌────────────────┴────────────────────────────────────────────┐  │   │
│  │  │  EC2 #2: Worker Node 1                                      │  │   │
│  │  │  ┌──────────────────────────────────────────────────────┐   │  │   │
│  │  │  │  kubelet                                             │   │  │   │
│  │  │  │  - API Server와 통신                                 │   │  │   │
│  │  │  │  - Pod 생성/삭제 실행                                │   │  │   │
│  │  │  └──────────────────────────────────────────────────────┘   │  │   │
│  │  │  ┌──────────────────────────────────────────────────────┐   │  │   │
│  │  │  │  Container Runtime (containerd)                      │   │  │   │
│  │  │  │  ┌────────────────────────────────────────────────┐  │   │  │   │
│  │  │  │  │  Pods                                           │  │   │  │   │
│  │  │  │  │  ├─ Ingress Controller Pod  ← 여기 설치!       │  │   │  │   │
│  │  │  │  │  ├─ Spring Boot App Pod                        │  │   │  │   │
│  │  │  │  │  └─ MySQL Pod                                  │  │   │  │   │
│  │  │  │  └────────────────────────────────────────────────┘  │   │  │   │
│  │  │  └──────────────────────────────────────────────────────┘   │  │   │
│  │  └─────────────────────────────────────────────────────────────┘  │   │
│  │                                                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐  │   │
│  │  │  EC2 #3: Worker Node 2                                      │  │   │
│  │  │  ┌──────────────────────────────────────────────────────┐   │  │   │
│  │  │  │  kubelet                                             │   │  │   │
│  │  │  └──────────────────────────────────────────────────────┘   │  │   │
│  │  │  ┌──────────────────────────────────────────────────────┐   │  │   │
│  │  │  │  Container Runtime                                   │   │  │   │
│  │  │  │  ┌────────────────────────────────────────────────┐  │   │  │   │
│  │  │  │  │  Pods                                           │  │   │  │   │
│  │  │  │  │  ├─ Ingress Controller Pod  ← 여기도 설치 가능 │  │   │  │   │
│  │  │  │  │  └─ Spring Boot App Pod (Replica)              │  │   │  │   │
│  │  │  │  └────────────────────────────────────────────────┘  │   │  │   │
│  │  │  └──────────────────────────────────────────────────────┘   │  │   │
│  │  └─────────────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘

                    ▲
                    │
                    │ HTTPS (kubectl 명령)
                    │
         ┌──────────┴──────────┐
         │  개발자 로컬 PC      │
         │  (집 또는 사무실)    │
         │                      │
         │  $ kubectl apply -f  │
         │    ingress.yaml      │
         └──────────────────────┘
```

---

## 3. kubectl 실행 위치 5가지 옵션

### Option 1: 개발자 로컬 PC (가장 흔함)

```
┌─────────────────────────────────────────────────────────┐
│  장점                                                    │
├─────────────────────────────────────────────────────────┤
│  ✅ 가장 편리함                                          │
│  ✅ 로컬 파일 직접 사용 가능                             │
│  ✅ IDE와 통합 가능                                      │
│  ✅ 빠른 피드백                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  단점                                                    │
├─────────────────────────────────────────────────────────┤
│  ❌ 네트워크 차단 시 접근 불가                           │
│  ❌ 보안 리스크 (kubeconfig 유출 위험)                  │
│  ❌ 여러 개발자가 동시 작업 시 충돌 가능                │
└─────────────────────────────────────────────────────────┘

실행 방법:
1. kubeconfig 파일 설정
   Windows: C:\Users\사용자\.kube\config
   Mac/Linux: ~/.kube/config

2. kubectl 명령 실행
   kubectl apply -f k8s/ingress.yaml
```

### Option 2: Bastion Host (프로덕션 권장)

```
┌─────────────────────────────────────────────────────────┐
│  장점                                                    │
├─────────────────────────────────────────────────────────┤
│  ✅ 보안 강화 (중앙 집중식 접근)                         │
│  ✅ 모든 kubectl 명령 감사 로그 기록                    │
│  ✅ 네트워크 안정성                                      │
│  ✅ 권한 관리 용이                                       │
└─────────────────────────────────────────────────────────┘

실행 방법:
1. Bastion Host에 SSH 접속
   ssh -i key.pem ec2-user@bastion.example.com

2. kubectl 명령 실행
   kubectl apply -f /opt/k8s/ingress.yaml

3. 접속 종료
   exit
```

### Option 3: CI/CD 파이프라인 (자동화)

```
┌─────────────────────────────────────────────────────────┐
│  장점                                                    │
├─────────────────────────────────────────────────────────┤
│  ✅ 완전 자동화                                          │
│  ✅ 배포 이력 관리                                       │
│  ✅ 롤백 용이                                            │
│  ✅ 사람의 실수 방지                                     │
└─────────────────────────────────────────────────────────┘

GitHub Actions 예시:
name: Deploy to K8s
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up kubectl
        run: |
          echo "${{ secrets.KUBECONFIG }}" > kubeconfig
          export KUBECONFIG=kubeconfig
      - name: Deploy
        run: kubectl apply -k k8s/overlays/prod/
```

### Option 4: Master Node 직접 접속 (비권장)

```
┌─────────────────────────────────────────────────────────┐
│  주의사항                                                │
├─────────────────────────────────────────────────────────┤
│  ⚠️ Master Node 부하 증가                               │
│  ⚠️ 보안 위험 (Master Node 직접 노출)                   │
│  ⚠️ 긴급 상황 전용으로만 사용                           │
└─────────────────────────────────────────────────────────┘

실행 방법:
ssh -i key.pem ec2-user@54.123.45.67
kubectl apply -f ingress.yaml
```

### Option 5: Worker Node 접속 (거의 사용 안 함)

```
┌─────────────────────────────────────────────────────────┐
│  언제 사용?                                              │
├─────────────────────────────────────────────────────────┤
│  - Master Node 장애 시 긴급 복구                        │
│  - 네트워크 문제로 다른 방법 불가 시                    │
└─────────────────────────────────────────────────────────┘

주의: Worker Node에는 kubectl이 설치되지 않을 수도 있음
```

---

## 4. kubectl 명령 실행 흐름 (상세)

### Step 1: kubectl 명령 실행

```
개발자 로컬 PC (Windows)
┌─────────────────────────────────────────────────────┐
│  $ kubectl apply -f ingress-nginx.yaml              │
│                                                      │
│  실행되는 일:                                        │
│  ① ~/.kube/config 파일 읽기                         │
│  ② 클러스터 API Server 주소 확인                    │
│     server: https://54.123.45.67:6443              │
│  ③ 인증 정보 로드                                    │
│     - 클라이언트 인증서                              │
│     - 토큰                                           │
│  ④ YAML 파일 읽고 JSON으로 변환                     │
│  ⑤ HTTPS 요청 생성                                   │
└───────────────┬─────────────────────────────────────┘
                │
                │ HTTPS POST 요청
                │ URL: https://54.123.45.67:6443/apis/apps/v1/deployments
                │ Header: Authorization: Bearer <token>
                │ Body: { "apiVersion": "apps/v1", "kind": "Deployment", ... }
                │
                ▼
```

### Step 2: API Server 수신 및 검증

```
EC2 Master Node - API Server
┌─────────────────────────────────────────────────────┐
│  API Server 처리 순서:                              │
│                                                      │
│  ① Authentication (인증)                            │
│     - 클라이언트 인증서 검증                         │
│     - "이 사용자가 누구인가?"                       │
│     - 실패 시: 401 Unauthorized                     │
│                                                      │
│  ② Authorization (인가 - RBAC)                      │
│     - 권한 확인                                      │
│     - "이 사용자가 Deployment를 생성할 수 있나?"    │
│     - 실패 시: 403 Forbidden                        │
│                                                      │
│  ③ Admission Control                                │
│     - 리소스 제한 확인                               │
│     - 네임스페이스 존재 여부 확인                   │
│     - 정책 위반 검사                                 │
│     - 실패 시: 400 Bad Request                      │
│                                                      │
│  ④ etcd에 Desired State 저장                        │
│     - "Ingress Controller Deployment를 생성해야 함" │
│     - Pod.status = Pending                          │
└───────────────┬─────────────────────────────────────┘
                │
                │ 저장 완료
                │
                ▼
```

### Step 3: Scheduler의 Pod 배치 결정

```
EC2 Master Node - Scheduler
┌─────────────────────────────────────────────────────┐
│  Scheduler가 하는 일:                                │
│                                                      │
│  ① Watch API Server                                 │
│     - etcd를 지속 감시                               │
│     - "Pod.spec.nodeName이 없는 Pod 발견!"         │
│     - ingress-controller Pod 발견                  │
│                                                      │
│  ② 모든 Worker Node 평가                            │
│     ┌───────────────────────────────────────────┐  │
│     │  Worker Node 1 평가:                      │  │
│     │  - CPU 사용률: 30%                        │  │
│     │  - 메모리 사용률: 50%                     │  │
│     │  - 디스크 공간: 충분                      │  │
│     │  - Node Selector 매칭: ✅                 │  │
│     │  - Taint 없음: ✅                          │  │
│     │  점수: 85점                                │  │
│     └───────────────────────────────────────────┘  │
│     ┌───────────────────────────────────────────┐  │
│     │  Worker Node 2 평가:                      │  │
│     │  - CPU 사용률: 70%                        │  │
│     │  - 메모리 사용률: 80%                     │  │
│     │  점수: 45점                                │  │
│     └───────────────────────────────────────────┘  │
│                                                      │
│  ③ 최적 Node 선택                                   │
│     결정: Worker Node 1 선택!                       │
│                                                      │
│  ④ etcd 업데이트                                     │
│     Pod.spec.nodeName = "worker-node-1"            │
└───────────────┬─────────────────────────────────────┘
                │
                │ 배치 명령
                │
                ▼
```

### Step 4: kubelet이 Pod 생성 (실제 설치!)

```
EC2 Worker Node 1 - kubelet
┌─────────────────────────────────────────────────────┐
│  kubelet 동작 순서:                                  │
│                                                      │
│  ① API Server Watch                                 │
│     - "내게 할당된 새 Pod 있나?"                    │
│     - ingress-controller Pod 발견                  │
│                                                      │
│  ② 컨테이너 이미지 다운로드                         │
│     $ containerd pull registry.k8s.io/              │
│       ingress-nginx/controller:v1.9.0              │
│     (Docker Hub에서 다운로드)                        │
│                                                      │
│  ③ 컨테이너 실행                                     │
│     $ containerd run \                              │
│       --name ingress-nginx \                        │
│       --cpu 200m \                                  │
│       --memory 512Mi \                              │
│       registry.k8s.io/ingress-nginx/controller     │
│                                                      │
│  ④ Health Check 시작                                │
│     - Liveness Probe: HTTP GET /healthz            │
│     - Readiness Probe: HTTP GET /ready             │
│                                                      │
│  ⑤ 상태를 API Server에 보고                         │
│     POST https://54.123.45.67:6443/api/v1/pods/... │
│     Body: { "status": "Running" }                  │
└─────────────────────────────────────────────────────┘

결과:
✅ Ingress Controller가 Worker Node 1의 Pod로 실행됩니다!
✅ kubectl get pods로 확인 가능
```

### 전체 흐름 요약

```
┌──────────────┐  ① HTTPS 요청   ┌──────────────┐
│  개발자 PC   │ ─────────────→  │  API Server  │
│  (kubectl)   │                  │  (Master)    │
└──────────────┘                  └──────┬───────┘
                                         │
                                         │ ② etcd 저장
                                         ▼
                                  ┌──────────────┐
                                  │  Scheduler   │
                                  │  (Master)    │
                                  └──────┬───────┘
                                         │
                                         │ ③ Node 할당
                                         ▼
                                  ┌──────────────┐
                                  │  kubelet     │
                                  │  (Worker 1)  │
                                  └──────┬───────┘
                                         │
                                         │ ④ Pod 생성
                                         ▼
                                  ┌──────────────┐
                                  │  Ingress Pod │
                                  │  (Worker 1)  │
                                  └──────────────┘
```

---

## 5. kubeconfig 파일 구조

### kubeconfig 파일 위치

```
Windows: C:\Users\사용자\.kube\config
Mac/Linux: ~/.kube/config
```

### kubeconfig 파일 예시

```yaml
apiVersion: v1
kind: Config
current-context: production-cluster

# 클러스터 정보 (어느 Kubernetes 클러스터?)
clusters:
- cluster:
    # API Server 주소 (Master Node의 Public IP + 포트)
    server: https://54.123.45.67:6443
    # TLS 인증서 (안전한 통신)
    certificate-authority-data: LS0tLS1CRUdJTi...
  name: production-cluster

# 사용자 인증 정보 (누가 접속?)
users:
- name: admin-user
  user:
    # 클라이언트 인증서
    client-certificate-data: LS0tLS1CRUdJTi...
    # 개인 키
    client-key-data: LS0tLS1CRUdJTi...

# 컨텍스트 (클러스터 + 사용자 + 네임스페이스 조합)
contexts:
- context:
    cluster: production-cluster
    user: admin-user
    namespace: default
  name: production-cluster

# 현재 활성 컨텍스트
current-context: production-cluster
```

### kubeconfig 획득 방법

```bash
# 방법 1: Master Node에서 복사 (수동)
# Master Node SSH 접속
ssh -i key.pem ec2-user@54.123.45.67

# kubeconfig 파일 내용 출력
sudo cat /etc/kubernetes/admin.conf

# 복사해서 로컬 PC에 저장
# Windows: C:\Users\사용자\.kube\config
# Mac/Linux: ~/.kube/config


# 방법 2: kubeadm 클러스터 생성 시 자동 생성
kubeadm init

# 출력:
# Your Kubernetes control-plane has initialized successfully!
# To start using your cluster, you need to run the following:
#
#   mkdir -p $HOME/.kube
#   sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
#   sudo chown $(id -u):$(id -g) $HOME/.kube/config


# 방법 3: 클라우드 제공자 CLI (EKS 예시)
aws eks update-kubeconfig \
  --name my-cluster \
  --region ap-northeast-2
```

---

## 6. 보안 고려사항

### 네트워크 보안 계층

```
┌───────────────────────────────────────────────────────────┐
│  보안 계층 1: VPC Security Group                          │
├───────────────────────────────────────────────────────────┤
│  Master Node Security Group:                              │
│  - Inbound Rule                                           │
│    ├─ Port 6443 (API Server)                             │
│    │  Source: 회사 공인 IP만 허용 (123.45.67.0/24)       │
│    └─ Port 22 (SSH)                                       │
│       Source: Bastion Host만 허용                         │
│                                                            │
│  Worker Node Security Group:                              │
│  - Inbound Rule                                           │
│    ├─ All traffic from Master Node                       │
│    └─ Port 22: Bastion Host만 허용                        │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│  보안 계층 2: TLS 암호화                                   │
├───────────────────────────────────────────────────────────┤
│  - kubectl ↔ API Server: HTTPS (TLS 1.3)                │
│  - 인증서 기반 상호 인증                                   │
│  - 중간자 공격 방지                                        │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│  보안 계층 3: 인증 (Authentication)                        │
├───────────────────────────────────────────────────────────┤
│  지원되는 인증 방식:                                       │
│  ① 클라이언트 인증서 (X.509) ← 가장 흔함                 │
│  ② Bearer Token                                           │
│  ③ OIDC (Google, GitHub 등)                              │
│  ④ Webhook Token                                          │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│  보안 계층 4: 인가 (Authorization - RBAC)                 │
├───────────────────────────────────────────────────────────┤
│  Role: 권한 정의                                           │
│  - get, list, create, update, delete                     │
│                                                            │
│  RoleBinding: 사용자-권한 매핑                            │
│  - admin-user → cluster-admin Role                       │
│                                                            │
│  최소 권한 원칙 (Principle of Least Privilege)            │
│  - 필요한 최소 권한만 부여                                │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│  보안 계층 5: 감사 로그 (Audit Log)                       │
├───────────────────────────────────────────────────────────┤
│  모든 kubectl 명령 기록:                                  │
│  - 누가 (user)                                            │
│  - 언제 (timestamp)                                       │
│  - 무엇을 (resource)                                      │
│  - 어떻게 했는지 (verb: create, update, delete)          │
└───────────────────────────────────────────────────────────┘
```

### RBAC 설정 예시

```yaml
# 읽기 전용 사용자 생성
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: default
subjects:
- kind: User
  name: junior-dev
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

---

## 7. 프로덕션 배포 Best Practice

### Best Practice 1: Bastion Host 사용

```
┌─────────────────────────────────────────────────────────┐
│  Bastion Host 아키텍처                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  개발자 PC                                               │
│      │                                                   │
│      │ SSH (포트 22)                                     │
│      ▼                                                   │
│  Bastion Host (AWS Public Subnet)                       │
│      │                                                   │
│      │ kubectl 명령 실행                                 │
│      ▼                                                   │
│  API Server (Master Node, AWS Private Subnet)           │
│                                                          │
└─────────────────────────────────────────────────────────┘

장점:
✅ 모든 kubectl 명령 중앙 집중화
✅ 감사 로그 통합 관리
✅ Security Group 규칙 단순화
✅ VPN 없이도 안전한 접근

설정 방법:
1. Bastion Host EC2 인스턴스 생성
   - AMI: Amazon Linux 2
   - Instance Type: t3.micro (소형)
   - Security Group: SSH 22번만 회사 IP에 개방

2. kubectl, helm, git 설치
   sudo yum install -y kubectl helm git

3. kubeconfig 저장
   mkdir -p ~/.kube
   vi ~/.kube/config  # Master Node에서 복사

4. 개발자에게 SSH 키 배포
   ssh-keygen -t rsa -b 4096

5. 사용
   ssh -i bastion-key.pem ec2-user@bastion.example.com
   kubectl apply -f /opt/k8s/ingress.yaml
```

### Best Practice 2: CI/CD 파이프라인 자동 배포

```yaml
# GitHub Actions 예시
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up kubectl
        run: |
          echo "${{ secrets.KUBECONFIG }}" > kubeconfig
          export KUBECONFIG=kubeconfig

      - name: Deploy to Kubernetes
        run: |
          kubectl apply -k k8s/overlays/prod/

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/spring-boot-app \
            -n spring-boot-ns --timeout=5m

      - name: Verify deployment
        run: |
          kubectl get pods -n spring-boot-ns
```

### Best Practice 3: 다중 환경 kubeconfig 관리

```bash
# 여러 클러스터 관리
kubectl config get-contexts

# 출력:
# CURRENT   NAME           CLUSTER        AUTHINFO       NAMESPACE
# *         production     prod-cluster   admin          default
#           staging        stage-cluster  admin          default
#           local-kind     kind-cluster   kind-user      default

# 컨텍스트 전환
kubectl config use-context staging

# 현재 컨텍스트 확인
kubectl config current-context

# 특정 컨텍스트로 일회성 명령 실행
kubectl --context=production get pods
```

---

## 8. 로컬(Kind) vs 운영(EC2) 차이점 비교

### 비교표

| 항목 | 로컬 (Kind) | 운영 (EC2 3대) |
|------|-------------|----------------|
| **kubectl 실행 위치** | 로컬 PC | 로컬 PC, Bastion Host, CI/CD |
| **API Server 위치** | Docker Container 내부 | EC2 Master Node (Public IP) |
| **Worker Node** | Docker Container (가상) | EC2 인스턴스 (물리적 서버) |
| **네트워크** | localhost (루프백) | 인터넷 (VPC) |
| **보안** | 불필요 | TLS, RBAC, Security Group |
| **고가용성** | 없음 | Master Node 다중화 가능 |
| **스케일링** | 제한적 (로컬 리소스) | Auto Scaling 가능 |
| **비용** | 무료 | EC2 인스턴스 비용 발생 |

### 공통점 (핵심!)

```
둘 다 원리는 동일합니다!

kubectl → API Server → Scheduler → kubelet → Pod 생성

차이점은 물리적 배치뿐입니다:
- Kind: 모든 것이 로컬 Docker 내부
- EC2: Master/Worker가 물리적으로 분리된 서버
```

---

## 9. 실습 예시

### 로컬 PC에서 운영 클러스터에 Ingress 설치

```bash
# 1. kubeconfig 확인
cat ~/.kube/config

# 2. 연결 테스트
kubectl cluster-info
# 출력:
# Kubernetes control plane is running at https://54.123.45.67:6443

# 3. 현재 노드 확인
kubectl get nodes
# 출력:
# NAME            STATUS   ROLES           AGE   VERSION
# master-node     Ready    control-plane   10d   v1.28.0
# worker-node-1   Ready    <none>          10d   v1.28.0
# worker-node-2   Ready    <none>          10d   v1.28.0

# 4. Ingress Controller 설치
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.0/deploy/static/provider/cloud/deploy.yaml

# 5. 설치 확인 (어느 Worker Node에 배치되었는지 확인)
kubectl get pods -n ingress-nginx -o wide
# 출력:
# NAME                             READY   STATUS    NODE
# ingress-nginx-controller-xxx     1/1     Running   worker-node-1

# 결과: worker-node-1에 설치됨!
```

---

## 10. 요약

### Q1. 어느 컴퓨터에서 명령어를 실행해야 하나요?

**A1. kubectl은 어디서든 실행 가능합니다!**

조건:
- kubeconfig 파일 보유
- API Server에 네트워크 접근 가능

권장 순서:
1. CI/CD 파이프라인 (자동화, 감사 로그)
2. Bastion Host (보안, 중앙 집중)
3. 로컬 PC (개발 편의성)

### Q2. 명령어의 결과로 어디에 설치될까요?

**A2. Worker Node의 Pod로 설치됩니다!**

설치 위치 결정 과정:
1. kubectl → API Server (명령 전달)
2. Scheduler → 최적 Worker Node 선택
3. kubelet → 해당 Worker Node에서 컨테이너 실행

결과:
- EC2 Worker Node 1 또는 2의 Pod로 실행
- `kubectl get pods -o wide`로 확인 가능

### 핵심 원리

```
kubectl은 "원격 제어기"입니다

- 실행 위치: 어디든 가능 (인증만 되면)
- 통신 대상: Master Node의 API Server
- 실제 작업: Worker Node의 kubelet이 수행

로컬(Kind)과 차이점:
- Kind: 모든 것이 로컬 Docker 내부
- EC2: Master/Worker가 물리적으로 분리된 서버

하지만 원리는 동일:
kubectl → API Server → Scheduler → kubelet → Pod 생성
```
