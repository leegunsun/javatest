# Kubernetes 배포 가이드 (open-green)

이 문서는 Spring Boot 애플리케이션 `open-green`을 Kubernetes에 배포하는 방법을 설명합니다.

## 파일 구조

```
javatest/
├── Dockerfile                     # 컨테이너 이미지 빌드용
├── src/main/resources/
│   ├── application.yml            # 기본 설정
│   └── application-k8s.yml        # Kubernetes 환경 전용 설정
└── k8s/
    ├── configmap.yaml             # 비민감 설정값
    ├── secret.yaml                # 민감한 인증 정보
    ├── deployment.yaml            # Pod 배포 설정
    ├── service.yaml               # 내부 네트워킹
    ├── ingress.yaml               # 외부 접근 설정
    └── hpa.yaml                   # 자동 스케일링
```

## 사전 요구사항

### 1. 로컬 환경 준비

**Windows:**
```powershell
# Docker Desktop 설치 (Kubernetes 포함)
# https://www.docker.com/products/docker-desktop/

# Docker Desktop 설정에서 Kubernetes 활성화
# Settings > Kubernetes > Enable Kubernetes

# kubectl 확인
kubectl version --client
```

**macOS:**
```bash
# Docker Desktop 또는 minikube 설치
brew install --cask docker
# 또는
brew install minikube

# minikube 시작
minikube start
```

### 2. 필수 애드온 설치

```bash
# Metrics Server (HPA 사용 시 필수)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Ingress Controller (외부 접근 시 필수)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# 설치 확인
kubectl get pods -n kube-system | grep metrics-server
kubectl get pods -n ingress-nginx
```

## 배포 순서

### Step 1: Docker 이미지 빌드

```bash
# 프로젝트 루트 디렉토리에서 실행
cd C:\Users\zkvpt\Desktop\javatest

# 이미지 빌드
docker build -t open-green:latest .

# 빌드 확인
docker images | grep open-green
```

### Step 2: ConfigMap 및 Secret 생성

```bash
# 디렉토리 이동
cd k8s

# ConfigMap 생성 (비민감 설정)
kubectl apply -f configmap.yaml

# Secret 생성 (민감 정보)
# 주의: secret.yaml의 비밀번호를 실제 값으로 변경하세요!
kubectl apply -f secret.yaml

# 확인
kubectl get configmaps
kubectl get secrets
```

### Step 3: Deployment 및 Service 생성

```bash
# Deployment 생성
kubectl apply -f deployment.yaml

# Service 생성
kubectl apply -f service.yaml

# 상태 확인
kubectl get deployments
kubectl get pods -l app=open-green
kubectl get services
```

### Step 4: (선택) Ingress 및 HPA 생성

```bash
# Ingress 생성 (외부 접근 필요 시)
kubectl apply -f ingress.yaml

# HPA 생성 (자동 스케일링 필요 시)
kubectl apply -f hpa.yaml

# 확인
kubectl get ingress
kubectl get hpa
```

## 빠른 배포 (한 번에)

### 방법 1: Kustomize 사용 (권장)

```bash
# Kustomize를 사용한 배포 (순서 보장, 공통 라벨 자동 추가)
kubectl apply -k k8s/

# 배포 전 미리보기
kubectl kustomize k8s/

# 삭제
kubectl delete -k k8s/
```

**Kustomize 장점:**
- ✅ 배포 순서 자동 보장 (ConfigMap/Secret → Deployment → Service → Ingress → HPA)
- ✅ 공통 라벨/어노테이션 자동 추가
- ✅ 환경별 설정 관리 용이 (base/overlay 패턴)
- ✅ kubectl에 내장되어 별도 설치 불필요

### 방법 2: 개별 파일 적용

```bash
# 모든 리소스 한 번에 배포 (순서 보장 안됨)
kubectl apply -f k8s/

# 또는 순서대로 (수동)
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

## 접근 방법

### 1. 포트 포워딩 (개발용, 가장 간단)

```bash
# Service를 통해 포트 포워딩
kubectl port-forward service/open-green-service 8082:80

# 브라우저에서 접근
# http://localhost:8082/actuator/health
```

### 2. NodePort (개발/테스트용)

```bash
# NodePort Service가 생성되어 있다면
kubectl get service open-green-nodeport

# 접근 (Docker Desktop의 경우)
# http://localhost:30082/actuator/health
```

### 3. Ingress (프로덕션 권장)

```bash
# hosts 파일 수정 (관리자 권한 필요)
# Windows: C:\Windows\System32\drivers\etc\hosts
# Linux/Mac: /etc/hosts

# 추가:
# 127.0.0.1 open-green.local

# Ingress Controller 확인
kubectl get svc -n ingress-nginx

# 접근
# http://open-green.local/actuator/health
```

## 상태 확인 명령어

```bash
# Pod 상태
kubectl get pods -l app=open-green
kubectl describe pod -l app=open-green

# Pod 로그
kubectl logs -l app=open-green --tail=100 -f

# 이벤트 확인
kubectl get events --sort-by=.metadata.creationTimestamp

# 리소스 사용량
kubectl top pods -l app=open-green

# HPA 상태
kubectl get hpa -w

# Deployment 롤아웃 상태
kubectl rollout status deployment/open-green-deployment
```

## 트러블슈팅

### Pod이 시작되지 않는 경우

```bash
# Pod 상태 확인
kubectl describe pod -l app=open-green

# 이벤트 확인
kubectl get events --field-selector involvedObject.name=<pod-name>

# 로그 확인
kubectl logs <pod-name> --previous  # 이전 컨테이너 로그
```

### 일반적인 문제들

1. **ImagePullBackOff**: 이미지를 찾을 수 없음
   - 이미지 이름/태그 확인
   - 로컬 이미지인 경우 `imagePullPolicy: Never` 또는 `IfNotPresent` 설정

2. **CrashLoopBackOff**: 컨테이너가 계속 재시작
   - 로그 확인: `kubectl logs <pod-name>`
   - 환경변수 확인: ConfigMap/Secret 키 이름 확인

3. **Pending**: 리소스 부족
   - 노드 리소스 확인: `kubectl describe nodes`
   - requests/limits 조정

4. **Ready 상태가 0/1**: Readiness Probe 실패
   - 애플리케이션 시작 시간 확인
   - `initialDelaySeconds` 증가
   - health 엔드포인트 확인

## 정리 (삭제)

```bash
# 모든 리소스 삭제
kubectl delete -f k8s/

# 또는 개별 삭제
kubectl delete -f k8s/hpa.yaml
kubectl delete -f k8s/ingress.yaml
kubectl delete -f k8s/service.yaml
kubectl delete -f k8s/deployment.yaml
kubectl delete -f k8s/secret.yaml
kubectl delete -f k8s/configmap.yaml
```

## Kustomize 고급 활용

### 환경별 설정 분리 (base/overlay 패턴)

프로덕션 환경에서는 dev, staging, prod 환경별로 다른 설정을 사용합니다.

**디렉토리 구조:**
```
k8s/
├── base/                          # 공통 기본 설정
│   ├── kustomization.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ...
├── overlays/
│   ├── dev/                       # 개발 환경
│   │   ├── kustomization.yaml     # Dev 전용 설정
│   │   └── patches/
│   │       └── replica-patch.yaml # 1개의 replica
│   ├── staging/                   # 스테이징 환경
│   │   ├── kustomization.yaml
│   │   └── patches/
│   │       └── replica-patch.yaml # 2개의 replica
│   └── prod/                      # 프로덕션 환경
│       ├── kustomization.yaml
│       └── patches/
│           ├── replica-patch.yaml # 5개의 replica
│           └── resource-patch.yaml # 더 많은 CPU/메모리
```

**overlays/prod/kustomization.yaml 예시:**
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

# base 디렉토리 참조
bases:
  - ../../base

# 프로덕션 환경 라벨
commonLabels:
  environment: production

# 네임스페이스 오버라이드
namespace: prod

# 이미지 태그 변경
images:
  - name: open-green
    newTag: v1.0.0

# replica 수 변경
replicas:
  - name: open-green-deployment
    count: 5

# 리소스 패치
patchesStrategicMerge:
  - patches/resource-patch.yaml
```

**배포 방법:**
```bash
# 개발 환경 배포
kubectl apply -k k8s/overlays/dev/

# 스테이징 환경 배포
kubectl apply -k k8s/overlays/staging/

# 프로덕션 환경 배포
kubectl apply -k k8s/overlays/prod/
```

### ConfigMap/Secret 자동 생성

파일이나 리터럴 값으로부터 ConfigMap/Secret을 자동 생성할 수 있습니다.

**kustomization.yaml:**
```yaml
configMapGenerator:
  - name: app-config
    files:
      - configs/application.yml
      - configs/logback.xml
    literals:
      - LOG_LEVEL=INFO
      - SPRING_PROFILES_ACTIVE=prod

secretGenerator:
  - name: db-credentials
    literals:
      - MYSQL_PASSWORD=secure-password
      - MYSQL_ROOT_PASSWORD=root-password
```

내용이 변경되면 자동으로 해시가 추가되어 무중단 롤링 업데이트가 가능합니다.

### 이미지 태그 변경 (CI/CD 통합)

```bash
# CLI로 이미지 태그 변경
cd k8s
kustomize edit set image open-green=your-registry/open-green:v2.0.0

# 변경사항 확인
cat kustomization.yaml

# 배포
kubectl apply -k .
```

## 다음 단계 학습

1. **Namespace로 환경 분리**: dev, staging, prod
2. **Kustomize overlay 패턴**: 환경별 설정 관리
3. **Helm Chart 작성**: 재사용 가능한 패키지
4. **CI/CD 파이프라인**: GitHub Actions, Jenkins
5. **모니터링**: Prometheus + Grafana
6. **로깅**: EFK Stack (Elasticsearch, Fluentd, Kibana)
7. **서비스 메시**: Istio, Linkerd
