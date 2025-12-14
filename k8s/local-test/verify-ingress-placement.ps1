# Ingress Controller 배치 검증 스크립트

Write-Host "=== Ingress Controller 배치 검증 ===" -ForegroundColor Cyan

# 1. Pod 상태 확인
Write-Host "`n[1/4] Pod 상태 조회..." -ForegroundColor Yellow
kubectl get pods -n ingress-nginx -o wide

# 2. 배치된 노드 정보
Write-Host "`n[2/4] 배치 노드 추출..." -ForegroundColor Yellow
$node = kubectl get pods -n ingress-nginx -l app.kubernetes.io/component=controller -o jsonpath='{.items[0].spec.nodeName}'
Write-Host "배치된 노드: $node" -ForegroundColor Green

# 3. 노드 상세 정보
Write-Host "`n[3/4] 노드 상세 정보..." -ForegroundColor Yellow
kubectl describe node $node | Select-String "Name:|Roles:|Taints:|Allocatable:" -Context 0,3

# 4. 스케줄링 이벤트
Write-Host "`n[4/4] 스케줄링 이벤트..." -ForegroundColor Yellow
kubectl get events -n ingress-nginx --sort-by='.lastTimestamp' | Select-String "Scheduled|Pulling|Started"

Write-Host "`n=== 검증 완료 ===" -ForegroundColor Cyan
