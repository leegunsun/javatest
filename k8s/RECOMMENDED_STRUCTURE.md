# Kubernetes 디렉토리 구조 권장안

## 권장 구조: Base + Overlay 패턴

```
k8s/
├── base/                       # 공통 기본 설정
│   ├── kustomization.yaml
│   ├── deployment.yaml         # 모든 환경의 기본 Deployment
│   ├── service.yaml            # 기본 Service 설정
│   ├── configmap.yaml          # 공통 ConfigMap (로깅 설정 등)
│   ├── secret.yaml             # Secret 템플릿
│   └── hpa.yaml                # 기본 HPA 설정
│
├── overlays/
│   ├── local/                  # 로컬 개발 환경 (Kind 클러스터)
│   │   ├── kustomization.yaml  # base 참조 + 로컬 패치
│   │   ├── configmap-patch.yaml
│   │   ├── deployment-patch.yaml
│   │   ├── ingress.yaml        # 로컬 전용 Ingress
│   │   └── service-patch.yaml
│   │
│   ├── dev/                    # 개발 서버 (클라우드 또는 온프레미스)
│   │   ├── kustomization.yaml
│   │   ├── deployment-patch.yaml
│   │   ├── ingress.yaml
│   │   └── secret.yaml         # 환경별 시크릿
│   │
│   └── prod/                   # 프로덕션 (향후 추가)
│       ├── kustomization.yaml
│       ├── deployment-patch.yaml
│       ├── ingress.yaml
│       ├── sealed-secret.yaml  # SealedSecrets 사용
│       └── hpa-patch.yaml      # 프로덕션용 스케일링
│
├── setup/
│   ├── kind-cluster-config.yaml
│   ├── kind-local-test-config.yaml
│   └── namespace.yaml
│
└── README.md
```

---

## 각 환경별 배포 명령어

### 1. 로컬 환경 배포
```bash
# Kind 클러스터 생성
kind create cluster --config k8s/setup/kind-local-test-config.yaml

# 네임스페이스 생성
kubectl create namespace spring-boot-ns

# 로컬 환경 배포
kubectl apply -k k8s/overlays/local/

# 확인
kubectl get all -n spring-boot-ns
```

### 2. 개발 서버 배포
```bash
# 개발 환경 배포
kubectl apply -k k8s/overlays/dev/

# 확인
kubectl get all -n spring-boot-ns -o wide
```

### 3. 프로덕션 배포 (향후)
```bash
# 프로덕션 배포 (ArgoCD 또는 수동)
kubectl apply -k k8s/overlays/prod/
```

---

## base/kustomization.yaml 예시

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

# 공통 리소스 (모든 환경에서 사용)
resources:
  - configmap.yaml
  - secret.yaml
  - deployment.yaml
  - service.yaml
  - hpa.yaml

# 공통 라벨 (모든 환경 공통)
labels:
  - pairs:
      app.kubernetes.io/name: spring-boot-app
      app.kubernetes.io/managed-by: kustomize

# 공통 어노테이션
commonAnnotations:
  description: "Spring Boot Application - Base Configuration"
```

---

## overlays/local/kustomization.yaml 예시

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

# base 설정 참조
bases:
  - ../../base

# 네임스페이스 지정
namespace: spring-boot-ns

# 로컬 전용 리소스 추가
resources:
  - ingress.yaml              # 로컬 전용 Ingress (localhost)

# 환경별 라벨 추가
labels:
  - pairs:
      environment: local
      tier: development

# base 리소스 패치 (로컬 환경 커스터마이징)
patchesStrategicMerge:
  - deployment-patch.yaml     # replica: 1, resources 축소
  - configmap-patch.yaml      # 로컬 DB 설정
  - service-patch.yaml        # NodePort 30080

# 이미지 태그 오버라이드
images:
  - name: your-registry/spring-boot-app
    newName: spring-boot-app  # 로컬 이미지
    newTag: local

# replica 수 오버라이드
replicas:
  - name: spring-boot-app-deployment
    count: 1                  # 로컬은 1개만
```

---

## overlays/local/deployment-patch.yaml 예시

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spring-boot-app-deployment
spec:
  replicas: 1  # 로컬은 1개만
  template:
    spec:
      containers:
      - name: spring-boot-app
        # 로컬 환경용 리소스 제한 (낮춤)
        resources:
          requests:
            cpu: "100m"
            memory: "256Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        # 로컬 환경 변수 추가
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "local"
        - name: LOG_LEVEL
          value: "DEBUG"
```

---

## overlays/dev/kustomization.yaml 예시

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

bases:
  - ../../base

namespace: spring-boot-ns

resources:
  - ingress.yaml              # 개발 서버용 Ingress (dev.example.com)
  - secret.yaml               # 개발 서버 Secret

labels:
  - pairs:
      environment: dev
      tier: development

patchesStrategicMerge:
  - deployment-patch.yaml     # replica: 2, resources 중간

images:
  - name: your-registry/spring-boot-app
    newName: your-registry/spring-boot-app
    newTag: dev-latest        # CI/CD에서 자동 업데이트

replicas:
  - name: spring-boot-app-deployment
    count: 2                  # 개발 서버는 2개
```

---

## 장점

### 1. 중복 제거
- 공통 설정은 `base/`에만 작성
- 환경별 차이만 `overlays/`에서 관리
- 코드 유지보수성 향상

### 2. 일관성 보장
- 모든 환경이 `base/`를 참조하므로 일관된 구조 유지
- 라벨, 어노테이션 자동 적용

### 3. 환경별 명확한 분리
- `local/`, `dev/`, `prod/` 디렉토리로 환경 구분
- 각 환경의 설정을 독립적으로 관리

### 4. 배포 순서 보장
- `kustomization.yaml`의 `resources` 섹션 순서대로 생성
- ConfigMap → Deployment → Service → Ingress 순서 자동 보장

### 5. CI/CD 통합 용이
- 이미지 태그를 동적으로 변경 가능
- GitOps 도구(ArgoCD, Flux)와 쉽게 통합

---

## 현재 구조와의 비교

### 현재 구조 (문제점)
```
k8s/
├── kustomization.yaml          # base인지 prod인지 불명확
├── deployment.yaml
├── service.yaml
├── ...
└── local-test/                 # ❌ kustomization.yaml 없음
    ├── deployment-local.yaml   # ❌ 파일 중복
    ├── service-local.yaml      # ❌ 파일 중복
    └── ...
```

- `k8s/` 디렉토리가 어떤 환경용인지 불명확
- `local-test/`에 kustomization.yaml 없어서 순서 보장 안 됨
- deployment, service 등 파일 중복
- 환경 추가 시 모든 파일 복사 필요

### 권장 구조 (개선점)
```
k8s/
├── base/                       # ✅ 공통 설정 명확
│   ├── kustomization.yaml
│   ├── deployment.yaml         # ✅ 한 곳에만 정의
│   └── service.yaml
└── overlays/
    ├── local/                  # ✅ 로컬 환경 명확
    │   ├── kustomization.yaml  # ✅ base 참조 + 패치
    │   └── deployment-patch.yaml  # ✅ 차이만 정의
    └── dev/
```

- 환경별 역할이 명확
- 파일 중복 없음
- 새로운 환경 추가 시 `overlays/` 하위에 디렉토리만 추가

---

## 마이그레이션 가이드

### 1단계: base/ 디렉토리 생성
```bash
mkdir -p k8s/base
```

### 2단계: 공통 파일 이동
```bash
# 기존 파일을 base/로 이동
mv k8s/deployment.yaml k8s/base/
mv k8s/service.yaml k8s/base/
mv k8s/configmap.yaml k8s/base/
mv k8s/secret.yaml k8s/base/
mv k8s/hpa.yaml k8s/base/
```

### 3단계: base/kustomization.yaml 생성
```bash
cat > k8s/base/kustomization.yaml << 'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - configmap.yaml
  - secret.yaml
  - deployment.yaml
  - service.yaml
  - hpa.yaml

labels:
  - pairs:
      app.kubernetes.io/name: spring-boot-app
      app.kubernetes.io/managed-by: kustomize
EOF
```

### 4단계: overlays/local/ 디렉토리 생성
```bash
mkdir -p k8s/overlays/local
mv k8s/local-test/* k8s/overlays/local/
```

### 5단계: overlays/local/kustomization.yaml 생성
```bash
cat > k8s/overlays/local/kustomization.yaml << 'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

bases:
  - ../../base

namespace: spring-boot-ns

resources:
  - ingress-local.yaml

labels:
  - pairs:
      environment: local

patchesStrategicMerge:
  - deployment-local.yaml
  - configmap-local.yaml
  - service-local.yaml

replicas:
  - name: spring-boot-app-deployment
    count: 1
EOF
```

### 6단계: 기존 디렉토리 제거
```bash
rm -rf k8s/local-test
```

### 7단계: 테스트
```bash
# 생성될 매니페스트 미리보기
kubectl kustomize k8s/overlays/local/

# 로컬 환경 배포
kubectl apply -k k8s/overlays/local/

# 확인
kubectl get all -n spring-boot-ns
```

---

## 참고 자료

- Kustomize 공식 문서: https://kustomize.io/
- Kubernetes Kustomize 가이드: https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/
- Best Practices: https://kubectl.docs.kubernetes.io/references/kustomize/
