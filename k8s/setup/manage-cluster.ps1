# kind 클러스터 관리 스크립트
# PowerShell에서 실행하세요

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('create', 'delete', 'status', 'help')]
    [string]$Action = 'help'
)

$ClusterName = "spring-boot-cluster"
$ConfigFile = "kind-cluster-config.yaml"

function Show-Help {
    Write-Host "=== kind 클러스터 관리 도구 ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "사용법:" -ForegroundColor Cyan
    Write-Host "  .\manage-cluster.ps1 create  - 클러스터 생성"
    Write-Host "  .\manage-cluster.ps1 delete  - 클러스터 삭제"
    Write-Host "  .\manage-cluster.ps1 status  - 클러스터 상태 확인"
    Write-Host "  .\manage-cluster.ps1 help    - 도움말 표시"
    Write-Host ""
}

function Create-Cluster {
    Write-Host "=== kind 클러스터 생성 시작 ===" -ForegroundColor Green
    Write-Host "클러스터 이름: $ClusterName" -ForegroundColor Cyan
    Write-Host "설정 파일: $ConfigFile" -ForegroundColor Cyan
    Write-Host ""

    # Docker 실행 확인
    Write-Host "Docker 상태 확인 중..." -ForegroundColor Yellow
    docker info > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "오류: Docker가 실행되지 않았습니다!" -ForegroundColor Red
        Write-Host "Docker Desktop을 실행한 후 다시 시도하세요." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "Docker 정상 실행 중 ✓" -ForegroundColor Green
    Write-Host ""

    # kind 설치 확인
    Write-Host "kind 설치 확인 중..." -ForegroundColor Yellow
    kind version > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "오류: kind가 설치되지 않았습니다!" -ForegroundColor Red
        Write-Host "install-kind.ps1을 참고하여 설치하세요." -ForegroundColor Yellow
        exit 1
    }
    $kindVersion = kind version
    Write-Host "kind 설치 확인 ✓ ($kindVersion)" -ForegroundColor Green
    Write-Host ""

    # 클러스터 생성
    Write-Host "클러스터 생성 중... (2-3분 소요)" -ForegroundColor Yellow
    kind create cluster --config=$ConfigFile

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=== 클러스터 생성 완료! ===" -ForegroundColor Green
        Write-Host ""
        Write-Host "다음 명령어로 노드를 확인하세요:" -ForegroundColor Cyan
        Write-Host "  kubectl get nodes -o wide"
        Write-Host ""
        Write-Host "클러스터 정보:" -ForegroundColor Cyan
        Write-Host "  kubectl cluster-info --context kind-$ClusterName"
    } else {
        Write-Host ""
        Write-Host "클러스터 생성 실패!" -ForegroundColor Red
        exit 1
    }
}

function Delete-Cluster {
    Write-Host "=== kind 클러스터 삭제 ===" -ForegroundColor Yellow
    Write-Host "클러스터 이름: $ClusterName" -ForegroundColor Cyan
    Write-Host ""

    $confirmation = Read-Host "정말 삭제하시겠습니까? (y/N)"
    if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
        kind delete cluster --name=$ClusterName
        Write-Host ""
        Write-Host "클러스터 삭제 완료!" -ForegroundColor Green
    } else {
        Write-Host "삭제 취소됨" -ForegroundColor Yellow
    }
}

function Show-Status {
    Write-Host "=== 클러스터 상태 ===" -ForegroundColor Green
    Write-Host ""

    # 모든 kind 클러스터 목록
    Write-Host "[1] kind 클러스터 목록:" -ForegroundColor Cyan
    kind get clusters
    Write-Host ""

    # kubectl 컨텍스트
    Write-Host "[2] kubectl 컨텍스트:" -ForegroundColor Cyan
    kubectl config current-context 2>$null
    Write-Host ""

    # 노드 상태
    Write-Host "[3] 노드 상태:" -ForegroundColor Cyan
    kubectl get nodes -o wide 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "클러스터가 없거나 연결할 수 없습니다." -ForegroundColor Yellow
    }
    Write-Host ""

    # Docker 컨테이너 (kind 노드)
    Write-Host "[4] Docker 컨테이너 (kind 노드):" -ForegroundColor Cyan
    docker ps --filter "name=spring-boot-cluster" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>$null
    Write-Host ""
}

# 메인 로직
switch ($Action) {
    'create' { Create-Cluster }
    'delete' { Delete-Cluster }
    'status' { Show-Status }
    'help'   { Show-Help }
    default  { Show-Help }
}
