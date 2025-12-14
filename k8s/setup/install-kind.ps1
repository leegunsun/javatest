# kind (Kubernetes in Docker) 설치 스크립트 - Windows용
# PowerShell에서 관리자 권한으로 실행하세요

Write-Host "=== kind 설치 시작 ===" -ForegroundColor Green

# Chocolatey로 설치 (가장 쉬운 방법)
Write-Host "`n[방법 1] Chocolatey 사용 (권장)" -ForegroundColor Cyan
Write-Host "명령어: choco install kind -y"
Write-Host ""

# 또는 수동 다운로드
Write-Host "[방법 2] 수동 다운로드" -ForegroundColor Cyan
Write-Host "1. https://kind.sigs.k8s.io/dl/latest/kind-windows-amd64 다운로드"
Write-Host "2. kind.exe로 이름 변경"
Write-Host "3. C:\Windows\System32\ 또는 PATH에 있는 폴더로 이동"
Write-Host ""

# 또는 winget 사용 (Windows 11 또는 최신 Windows 10)
Write-Host "[방법 3] winget 사용" -ForegroundColor Cyan
Write-Host "명령어: winget install Kubernetes.kind"
Write-Host ""

Write-Host "=== 설치 후 확인 ===" -ForegroundColor Green
Write-Host "명령어: kind version"
Write-Host ""

Write-Host "=== 참고사항 ===" -ForegroundColor Yellow
Write-Host "- Docker Desktop이 설치되어 있어야 합니다"
Write-Host "- Docker Desktop의 Kubernetes는 비활성화해도 됩니다"
Write-Host "- kind는 Docker 컨테이너를 노드로 사용합니다"
