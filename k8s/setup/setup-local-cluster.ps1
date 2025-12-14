# ============================================================================
# Kind 로컬 테스트 클러스터 설정 스크립트 (Windows PowerShell)
# ============================================================================
#
# 이 스크립트의 목적:
# 1. Kind 클러스터 생성
# 2. Nginx Ingress Controller 설치
# 3. 로컬 Docker 이미지를 Kind 클러스터에 로드
# 4. Kubernetes 리소스 배포
# 5. 접속 정보 확인
#
# 사용 방법:
#   .\setup-local-cluster.ps1
#
# 선행 요구사항:
#   - Docker Desktop 실행 중
#   - kind 설치 완료
#   - kubectl 설치 완료
#
# ============================================================================

# PowerShell 에러 발생 시 스크립트 중단
$ErrorActionPreference = "Stop"

# ============================================================================
# 색상 출력 함수 (가독성 향상)
# ============================================================================

function Write-Step {
    param([string]$Message)
    Write-Host "`n===================================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "===================================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# ============================================================================
# 1단계: 환경 검증
# ============================================================================
#
# 스크립트 실행 전 필요한 도구들이 설치되어 있는지 확인
# Docker, kind, kubectl이 없으면 스크립트 실행 불가
#
# ============================================================================

Write-Step "1단계: 환경 검증 중..."

# Docker 확인
# Docker Desktop이 실행 중이어야 Kind 클러스터 생성 가능
Write-Info "Docker 실행 상태 확인 중..."
try {
    docker version | Out-Null
    Write-Success "Docker 실행 중"
} catch {
    Write-Error-Custom "Docker가 실행되지 않았거나 설치되지 않았습니다."
    Write-Info "Docker Desktop을 설치하고 실행한 후 다시 시도하세요."
    exit 1
}

# kind 설치 확인
# Kind는 Kubernetes 클러스터를 생성하는 도구
Write-Info "kind 설치 확인 중..."
try {
    kind version | Out-Null
    Write-Success "kind 설치됨"
} catch {
    Write-Error-Custom "kind가 설치되지 않았습니다."
    Write-Info "설치 방법: choco install kind (또는 k8s\setup\install-kind.ps1 실행)"
    exit 1
}

# kubectl 설치 확인
# kubectl은 Kubernetes 클러스터를 제어하는 CLI 도구
Write-Info "kubectl 설치 확인 중..."
try {
    kubectl version --client | Out-Null
    Write-Success "kubectl 설치됨"
} catch {
    Write-Error-Custom "kubectl이 설치되지 않았습니다."
    Write-Info "설치 방법: choco install kubernetes-cli"
    exit 1
}

# ============================================================================
# 2단계: 기존 클러스터 확인 및 삭제 (선택사항)
# ============================================================================
#
# 동일한 이름의 클러스터가 이미 존재하면 충돌 발생
# 사용자에게 삭제 여부를 물어봄
#
# ============================================================================

Write-Step "2단계: 기존 클러스터 확인 중..."

$clusterName = "local-test-cluster"
$existingCluster = kind get clusters | Where-Object { $_ -eq $clusterName }

if ($existingCluster) {
    Write-Info "클러스터 '$clusterName'가 이미 존재합니다."
    $response = Read-Host "기존 클러스터를 삭제하고 새로 생성하시겠습니까? (y/n)"

    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Info "기존 클러스터 삭제 중..."
        kind delete cluster --name $clusterName
        Write-Success "기존 클러스터 삭제 완료"
    } else {
        Write-Info "스크립트를 종료합니다."
        exit 0
    }
}

# ============================================================================
# 3단계: Kind 클러스터 생성
# ============================================================================
#
# kind-local-test-config.yaml 파일을 사용하여 클러스터 생성
# 이 파일에는 노드 구성, 포트 매핑, 네트워크 설정이 포함됨
#
# 클러스터 생성 과정:
# 1. Docker 컨테이너로 Control Plane 노드 생성
# 2. Docker 컨테이너로 Worker 노드들 생성
# 3. 노드들을 하나의 Kubernetes 클러스터로 구성
# 4. kubeconfig 파일 자동 업데이트 (kubectl 접속 정보)
#
# ============================================================================

Write-Step "3단계: Kind 클러스터 생성 중..."

$configFile = Join-Path $PSScriptRoot "kind-local-test-config.yaml"

if (-not (Test-Path $configFile)) {
    Write-Error-Custom "설정 파일을 찾을 수 없습니다: $configFile"
    exit 1
}

Write-Info "설정 파일: $configFile"
Write-Info "클러스터 생성 중... (약 1-2분 소요)"

# Kind 클러스터 생성 명령어
# --config: 클러스터 설정 파일 경로
# --wait: 클러스터가 완전히 준비될 때까지 대기 (초 단위)
kind create cluster --config=$configFile --wait=300s

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "클러스터 생성 실패"
    exit 1
}

Write-Success "Kind 클러스터 생성 완료"

# ============================================================================
# 4단계: 클러스터 상태 확인
# ============================================================================
#
# 클러스터가 정상적으로 생성되었는지 확인
# 모든 노드가 Ready 상태여야 함
#
# kubectl get nodes 출력 예시:
# NAME                              STATUS   ROLES           AGE   VERSION
# local-test-cluster-control-plane  Ready    control-plane   1m    v1.27.3
# local-test-cluster-worker         Ready    <none>          1m    v1.27.3
# local-test-cluster-worker2        Ready    <none>          1m    v1.27.3
#
# ============================================================================

Write-Step "4단계: 클러스터 상태 확인 중..."

Write-Info "클러스터 정보:"
kubectl cluster-info --context kind-$clusterName

Write-Info "`n노드 목록:"
kubectl get nodes -o wide

# 모든 노드가 Ready 상태인지 확인
$notReadyNodes = kubectl get nodes --no-headers | Where-Object { $_ -notmatch '\sReady\s' }
if ($notReadyNodes) {
    Write-Error-Custom "일부 노드가 Ready 상태가 아닙니다."
    Write-Info "노드가 준비될 때까지 기다리는 중..."
    kubectl wait --for=condition=Ready nodes --all --timeout=300s
}

Write-Success "모든 노드가 Ready 상태입니다."

# ============================================================================
# 5단계: Nginx Ingress Controller 설치
# ============================================================================
#
# Ingress Controller란?
# - 클러스터 외부에서 내부 Service로의 HTTP/HTTPS 라우팅을 담당
# - URL 경로 기반 라우팅 (예: /api -> api-service, /web -> web-service)
# - TLS/SSL 종료 (HTTPS 처리)
# - 로드 밸런싱
#
# Nginx Ingress Controller 선택 이유:
# - 가장 널리 사용되는 Ingress Controller
# - 성능이 우수하고 안정적
# - 다양한 설정 옵션 제공
#
# Kind에서 Ingress 사용 시 주의사항:
# - Kind 전용 매니페스트 파일 사용 필요
# - extraPortMappings 설정이 필수 (이미 kind-local-test-config.yaml에 설정됨)
#
# ============================================================================

Write-Step "5단계: Nginx Ingress Controller 설치 중..."

Write-Info "Nginx Ingress Controller 매니페스트 다운로드 및 적용 중..."

# Kind 전용 Nginx Ingress Controller 매니페스트
# 이 YAML 파일에는 다음이 포함됨:
# - Ingress Controller Deployment
# - Service (LoadBalancer 타입이지만 Kind에서는 NodePort처럼 동작)
# - RBAC 설정 (권한 관리)
# - ConfigMap (Nginx 설정)
$ingressUrl = "https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml"

kubectl apply -f $ingressUrl

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Ingress Controller 설치 실패"
    exit 1
}

Write-Success "Nginx Ingress Controller 매니페스트 적용 완료"

# Ingress Controller Pod가 준비될 때까지 대기
# ingress-nginx 네임스페이스의 모든 Pod가 Ready 상태가 되어야 함
Write-Info "Ingress Controller Pod가 준비될 때까지 대기 중... (약 1-2분 소요)"

kubectl wait --namespace ingress-nginx `
  --for=condition=ready pod `
  --selector=app.kubernetes.io/component=controller `
  --timeout=300s

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Ingress Controller Pod가 준비되지 않았습니다."
    Write-Info "Pod 상태 확인: kubectl get pods -n ingress-nginx"
    exit 1
}

Write-Success "Nginx Ingress Controller 설치 완료"

# ============================================================================
# 6단계: Docker 이미지 빌드 및 Kind로 로드
# ============================================================================
#
# Kind 클러스터는 Docker 컨테이너 안에서 실행됨
# 로컬에서 빌드한 Docker 이미지를 Kind 클러스터에서 사용하려면
# 이미지를 Kind 클러스터로 명시적으로 로드해야 함
#
# 옵션 1: Docker Hub에 푸시하고 클러스터에서 Pull (시간 소요)
# 옵션 2: kind load 명령어로 직접 로드 (빠름, 추천)
#
# ============================================================================

Write-Step "6단계: Docker 이미지 준비 중..."

$imageName = "open-green"
$imageTag = "local-test"
$fullImageName = "${imageName}:${imageTag}"

# 프로젝트 루트 디렉토리로 이동 (Dockerfile이 있는 위치)
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $projectRoot

Write-Info "현재 위치: $projectRoot"

# Docker 이미지가 이미 존재하는지 확인
$existingImage = docker images -q $fullImageName

if ($existingImage) {
    Write-Info "이미지 '$fullImageName'가 이미 존재합니다."
    $response = Read-Host "이미지를 다시 빌드하시겠습니까? (y/n)"

    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Info "Docker 이미지 빌드 중... (약 2-5분 소요)"
        docker build -t $fullImageName .

        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Docker 이미지 빌드 실패"
            exit 1
        }
        Write-Success "Docker 이미지 빌드 완료"
    }
} else {
    Write-Info "Docker 이미지 빌드 중... (약 2-5분 소요)"
    docker build -t $fullImageName .

    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Docker 이미지 빌드 실패"
        exit 1
    }
    Write-Success "Docker 이미지 빌드 완료"
}

# Docker 이미지를 Kind 클러스터로 로드
# 이 작업을 통해 클러스터 내부에서 이미지를 사용할 수 있게 됨
Write-Info "Docker 이미지를 Kind 클러스터로 로드 중..."
kind load docker-image $fullImageName --name $clusterName

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "이미지 로드 실패"
    exit 1
}

Write-Success "Docker 이미지를 Kind 클러스터로 로드 완료"

# ============================================================================
# 7단계: Kubernetes 리소스 배포 (선택사항)
# ============================================================================
#
# 이 단계에서는 실제 애플리케이션을 배포할 수 있습니다.
# 수동으로 배포하고 싶다면 이 섹션을 주석 처리하세요.
#
# ============================================================================

Write-Step "7단계: Kubernetes 리소스 배포 (선택사항)"

$response = Read-Host "Kubernetes 리소스를 지금 배포하시겠습니까? (y/n)"

if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Info "Kubernetes 리소스 배포 중..."

    # k8s 디렉토리로 이동
    $k8sDir = Join-Path $projectRoot "k8s"

    # ConfigMap 생성 (환경 변수 및 설정 파일)
    Write-Info "ConfigMap 생성 중..."
    kubectl apply -f (Join-Path $k8sDir "configmap.yaml")

    # Secret 생성 (민감한 정보: DB 비밀번호 등)
    Write-Info "Secret 생성 중..."
    kubectl apply -f (Join-Path $k8sDir "secret.yaml")

    # Deployment 생성 (애플리케이션 Pod 배포)
    Write-Info "Deployment 생성 중..."
    kubectl apply -f (Join-Path $k8sDir "deployment.yaml")

    # Service 생성 (Pod 간 네트워크 통신)
    Write-Info "Service 생성 중..."
    kubectl apply -f (Join-Path $k8sDir "service.yaml")

    # Ingress 생성 (외부 접근 라우팅)
    Write-Info "Ingress 생성 중..."
    kubectl apply -f (Join-Path $k8sDir "ingress.yaml")

    # HPA 생성 (자동 스케일링) - 선택사항
    $hpaResponse = Read-Host "HPA(자동 스케일링)도 배포하시겠습니까? (y/n)"
    if ($hpaResponse -eq 'y' -or $hpaResponse -eq 'Y') {
        Write-Info "HPA 생성 중..."
        kubectl apply -f (Join-Path $k8sDir "hpa.yaml")
    }

    Write-Success "Kubernetes 리소스 배포 완료"

    # Pod가 준비될 때까지 대기
    Write-Info "Pod가 준비될 때까지 대기 중... (약 1-2분 소요)"
    kubectl wait --for=condition=ready pod -l app=open-green --timeout=300s

    Write-Success "모든 Pod가 Ready 상태입니다."
} else {
    Write-Info "리소스 배포를 건너뜁니다."
    Write-Info "수동 배포 방법:"
    Write-Info "  kubectl apply -f k8s/configmap.yaml"
    Write-Info "  kubectl apply -f k8s/secret.yaml"
    Write-Info "  kubectl apply -f k8s/deployment.yaml"
    Write-Info "  kubectl apply -f k8s/service.yaml"
    Write-Info "  kubectl apply -f k8s/ingress.yaml"
}

# ============================================================================
# 8단계: 접속 정보 출력
# ============================================================================
#
# 클러스터 및 애플리케이션 접속 방법 안내
#
# ============================================================================

Write-Step "설정 완료!"

Write-Host "`n✅ Kind 로컬 테스트 클러스터가 성공적으로 설정되었습니다!" -ForegroundColor Green

Write-Host "`n📋 클러스터 정보:" -ForegroundColor Cyan
Write-Host "  클러스터 이름: $clusterName"
Write-Host "  kubectl 컨텍스트: kind-$clusterName"

Write-Host "`n🔧 유용한 명령어:" -ForegroundColor Cyan
Write-Host "  노드 확인:       kubectl get nodes"
Write-Host "  Pod 확인:        kubectl get pods"
Write-Host "  Service 확인:    kubectl get svc"
Write-Host "  Ingress 확인:    kubectl get ingress"
Write-Host "  전체 리소스:     kubectl get all"

Write-Host "`n🌐 접속 정보:" -ForegroundColor Cyan
Write-Host "  Ingress HTTP:    http://localhost"
Write-Host "  Ingress HTTPS:   https://localhost"
Write-Host "  Direct Access:   http://localhost:8082"

Write-Host "`n🧹 클러스터 삭제:" -ForegroundColor Cyan
Write-Host "  kind delete cluster --name $clusterName"

Write-Host "`n📚 다음 단계:" -ForegroundColor Yellow
Write-Host "  1. kubectl get pods 명령으로 Pod 상태 확인"
Write-Host "  2. kubectl logs <pod-name> 명령으로 로그 확인"
Write-Host "  3. http://localhost 접속하여 애플리케이션 테스트"
Write-Host "  4. kubectl describe pod <pod-name> 명령으로 상세 정보 확인"

Write-Host ""
