# kind 멀티 노드 클러스터 빠른 참조 가이드

## 5분 빠른 시작

### 전제 조건 확인

```powershell
# Docker 실행 확인
docker --version
docker ps

# kubectl 설치 확인
kubectl version --client
```

### 클러스터 생성 (한 번에 실행)

```powershell
# 1. k8s/setup 디렉토리로 이동
cd C:\Users\zkvpt\Desktop\javatest\k8s\setup

# 2. 클러스터 생성 (2-3분 소요)
kind create cluster --config=kind-cluster-config.yaml

# 3. 노드 확인
kubectl get nodes
# 출력: Master 1개 + Worker 2개 = 총 3개

# 4. 테스트 배포
kubectl create deployment nginx-test --image=nginx --replicas=3
kubectl get pods -o wide
# Pod들이 Worker 노드에 분산된 것을 확인

# 5. 테스트 정리
kubectl delete deployment nginx-test
```

## 필수 명령어 모음

### 클러스터 관리

```powershell
# 클러스터 생성
kind create cluster --config=kind-cluster-config.yaml

# 클러스터 목록 보기
kind get clusters

# 클러스터 정보
kubectl cluster-info --context kind-spring-boot-cluster

# 클러스터 삭제
kind delete cluster --name spring-boot-cluster

# 모든 클러스터 삭제
kind delete clusters --all
```

### 노드 관리

```powershell
# 노드 목록
kubectl get nodes

# 노드 상세 정보 (IP, OS, 리소스 등)
kubectl get nodes -o wide

# 노드 레이블 확인
kubectl get nodes --show-labels

# 특정 노드 상세 정보
kubectl describe node spring-boot-cluster-worker

# 노드 리소스 사용량 (Metrics Server 필요)
kubectl top nodes
```

### 애플리케이션 배포

```powershell
# 프로젝트 루트로 이동
cd C:\Users\zkvpt\Desktop\javatest

# Docker 이미지 빌드
docker build -t spring-boot-app:latest .

# kind 클러스터에 이미지 로드
kind load docker-image spring-boot-app:latest --name spring-boot-cluster

# Kubernetes 리소스 배포
kubectl apply -f k8s/

# 배포 확인
kubectl get all
kubectl get pods -o wide

# 로그 확인
kubectl logs -f deployment/spring-boot-app

# 포트 포워딩 (로컬 접근)
kubectl port-forward deployment/spring-boot-app 8082:8082
# 브라우저에서 http://localhost:8082 접근
```

### Pod 관리

```powershell
# Pod 목록 (기본 네임스페이스)
kubectl get pods

# Pod 목록 (모든 네임스페이스)
kubectl get pods -A

# Pod 상세 정보 (어느 노드에 있는지 확인)
kubectl get pods -o wide

# 특정 Pod 상세 정보
kubectl describe pod <pod-name>

# Pod 로그 보기
kubectl logs <pod-name>

# Pod 로그 실시간 보기
kubectl logs -f <pod-name>

# Pod 내부 접속
kubectl exec -it <pod-name> -- /bin/bash

# Pod 삭제
kubectl delete pod <pod-name>

# Deployment의 모든 Pod 삭제 및 재생성
kubectl rollout restart deployment/<deployment-name>
```

### Deployment 관리

```powershell
# Deployment 목록
kubectl get deployments

# Deployment 상세 정보
kubectl describe deployment <deployment-name>

# 스케일 조정 (Replica 수 변경)
kubectl scale deployment <deployment-name> --replicas=5

# 이미지 업데이트
kubectl set image deployment/<deployment-name> <container-name>=<new-image>

# 롤아웃 상태 확인
kubectl rollout status deployment/<deployment-name>

# 롤아웃 이력 확인
kubectl rollout history deployment/<deployment-name>

# 롤백 (이전 버전으로)
kubectl rollout undo deployment/<deployment-name>

# Deployment 삭제
kubectl delete deployment <deployment-name>
```

### Service 관리

```powershell
# Service 목록
kubectl get svc

# Service 상세 정보
kubectl describe svc <service-name>

# Service 엔드포인트 확인
kubectl get endpoints <service-name>

# Service 삭제
kubectl delete svc <service-name>
```

### 디버깅 및 문제 해결

```powershell
# 이벤트 확인 (최근 발생 순)
kubectl get events --sort-by='.lastTimestamp'

# 특정 Pod의 이벤트
kubectl describe pod <pod-name> | Select-String "Events" -Context 0,20

# 리소스 상태 확인
kubectl get all

# Pod 상태 Watch (실시간 업데이트)
kubectl get pods --watch

# Pod 재시작 이유 확인
kubectl describe pod <pod-name> | Select-String "Reason"

# ConfigMap 확인
kubectl get configmap
kubectl describe configmap <configmap-name>

# Secret 확인
kubectl get secrets
kubectl describe secret <secret-name>
```

### 리소스 모니터링

```powershell
# Docker 컨테이너 (노드) 확인
docker ps --filter "name=spring-boot-cluster"

# Docker 컨테이너 리소스 사용량 실시간
docker stats --filter "name=spring-boot-cluster"

# 노드 리소스 사용량 (Metrics Server 필요)
kubectl top nodes

# Pod 리소스 사용량
kubectl top pods

# 전체 리소스 사용량
kubectl top pods -A
```

### 컨텍스트 관리

```powershell
# 현재 컨텍스트 확인
kubectl config current-context

# 모든 컨텍스트 보기
kubectl config get-contexts

# 컨텍스트 전환
kubectl config use-context kind-spring-boot-cluster

# 컨텍스트 삭제
kubectl config delete-context <context-name>
```

## 자주 사용하는 시나리오

### 시나리오 1: 새 버전 배포

```powershell
# 1. 새 이미지 빌드
docker build -t spring-boot-app:v2 .

# 2. kind 클러스터에 로드
kind load docker-image spring-boot-app:v2 --name spring-boot-cluster

# 3. Deployment 업데이트
kubectl set image deployment/spring-boot-app spring-boot-app=spring-boot-app:v2

# 4. 롤아웃 상태 확인
kubectl rollout status deployment/spring-boot-app

# 5. Pod 확인
kubectl get pods -o wide
```

### 시나리오 2: 스케일링 테스트

```powershell
# 1. 현재 Replica 수 확인
kubectl get deployment spring-boot-app

# 2. 스케일 증가 (예: 6개)
kubectl scale deployment spring-boot-app --replicas=6

# 3. Pod 분산 확인 (Worker 노드별)
kubectl get pods -o wide | Select-String "spring-boot-app"

# 4. 리소스 사용량 확인
kubectl top pods
kubectl top nodes
```

### 시나리오 3: 롤링 업데이트 및 롤백

```powershell
# 1. 새 버전 배포
kubectl set image deployment/spring-boot-app spring-boot-app=spring-boot-app:v2

# 2. 롤아웃 진행 상황 확인
kubectl rollout status deployment/spring-boot-app

# 3. 문제 발생 시 롤백
kubectl rollout undo deployment/spring-boot-app

# 4. 특정 버전으로 롤백
kubectl rollout history deployment/spring-boot-app
kubectl rollout undo deployment/spring-boot-app --to-revision=2
```

### 시나리오 4: 노드 장애 시뮬레이션

```powershell
# 1. 현재 Pod 분산 확인
kubectl get pods -o wide

# 2. Worker 노드 중단 (Docker 컨테이너 중지)
docker stop spring-boot-cluster-worker

# 3. Pod 재스케줄링 확인 (1-2분 대기)
kubectl get pods -o wide
# 중단된 노드의 Pod들이 다른 Worker로 이동

# 4. 노드 복구
docker start spring-boot-cluster-worker

# 5. 노드 상태 확인
kubectl get nodes
```

### 시나리오 5: 특정 Worker에 Pod 배포

deployment.yaml에 nodeSelector 추가:

```yaml
spec:
  template:
    spec:
      nodeSelector:
        worker-id: "1"  # Worker 1에만 배포
```

적용:

```powershell
# 1. Deployment 업데이트
kubectl apply -f k8s/deployment.yaml

# 2. Pod 배포 위치 확인
kubectl get pods -o wide
# worker-id=1 노드에만 배포됨

# 3. nodeSelector 제거 (다시 분산)
# deployment.yaml에서 nodeSelector 삭제 후
kubectl apply -f k8s/deployment.yaml
```

## 문제 해결 체크리스트

### Pod가 시작되지 않음 (Pending)

```powershell
# 1. Pod 상태 확인
kubectl describe pod <pod-name>

# 2. 이벤트 확인
kubectl get events --sort-by='.lastTimestamp' | Select-String "<pod-name>"

# 3. 리소스 부족 확인
kubectl top nodes

# 해결 방법:
# - 리소스 부족: Pod의 requests/limits 감소
# - 이미지 없음: kind load docker-image 실행
# - nodeSelector 불일치: 레이블 확인
```

### Pod가 계속 재시작됨 (CrashLoopBackOff)

```powershell
# 1. Pod 로그 확인
kubectl logs <pod-name>
kubectl logs <pod-name> --previous  # 이전 실행 로그

# 2. Pod 상세 정보
kubectl describe pod <pod-name>

# 3. 리소스 확인 (OOMKilled?)
kubectl describe pod <pod-name> | Select-String "OOM"

# 해결 방법:
# - 애플리케이션 오류: 로그 확인 및 수정
# - OOMKilled: memory limits 증가
# - Liveness probe 실패: probe 설정 조정
```

### 이미지를 가져올 수 없음 (ImagePullBackOff)

```powershell
# 1. 이미지가 kind 클러스터에 로드되었는지 확인
docker exec -it spring-boot-cluster-worker crictl images | Select-String "spring-boot-app"

# 2. 이미지 로드
kind load docker-image spring-boot-app:latest --name spring-boot-cluster

# 3. Pod 재생성
kubectl delete pod <pod-name>
```

### Service로 접근 불가

```powershell
# 1. Service 확인
kubectl get svc
kubectl describe svc <service-name>

# 2. Endpoints 확인 (Pod가 연결되었는지)
kubectl get endpoints <service-name>

# 3. Service 레이블 셀렉터와 Pod 레이블 일치 확인
kubectl get pods --show-labels
kubectl describe svc <service-name> | Select-String "Selector"

# 4. 포트 포워딩으로 직접 테스트
kubectl port-forward svc/<service-name> 8082:8082
```

## 유용한 Alias (PowerShell)

PowerShell Profile에 추가 (`notepad $PROFILE`):

```powershell
# kubectl 단축 명령
function k { kubectl $args }
function kgp { kubectl get pods $args }
function kgn { kubectl get nodes $args }
function kgs { kubectl get svc $args }
function kgd { kubectl get deployments $args }
function kd { kubectl describe $args }
function kl { kubectl logs $args }
function ke { kubectl exec -it $args }
function kdel { kubectl delete $args }

# kind 단축 명령
function kind-start { kind create cluster --config=C:\Users\zkvpt\Desktop\javatest\k8s\setup\kind-cluster-config.yaml }
function kind-stop { kind delete cluster --name spring-boot-cluster }
function kind-status { kubectl get nodes; kubectl get pods -A }

# Docker 단축 명령
function dk { docker $args }
function dkps { docker ps $args }
function dkimg { docker images $args }
```

사용 예시:

```powershell
# 기존
kubectl get pods

# Alias 사용
kgp

# 기존
kubectl describe pod my-pod

# Alias 사용
kd pod my-pod
```

## 정리 명령어

### 임시 정리 (클러스터 유지)

```powershell
# 특정 Deployment만 삭제
kubectl delete deployment <deployment-name>

# 네임스페이스의 모든 리소스 삭제
kubectl delete all --all -n default

# 특정 리소스 타입 전체 삭제
kubectl delete deployments --all
kubectl delete services --all
kubectl delete configmaps --all
```

### 완전 정리 (클러스터 삭제)

```powershell
# 클러스터 삭제
kind delete cluster --name spring-boot-cluster

# 모든 kind 클러스터 삭제
kind delete clusters --all

# Docker 이미지 정리 (선택)
docker image prune -a

# Docker 시스템 전체 정리 (주의!)
docker system prune -a --volumes
```

## 다음 단계

1. **README.md**: 전체 설치 가이드 및 상세 설명
2. **resource-requirements.md**: 시스템 리소스 요구사항 및 최적화
3. **공식 문서**: https://kind.sigs.k8s.io/

## 도움말

문제가 해결되지 않으면:

1. **로그 확인**: `kubectl logs`, `kubectl describe`
2. **이벤트 확인**: `kubectl get events`
3. **리소스 확인**: `kubectl top nodes`, `kubectl top pods`
4. **공식 문서**: https://kind.sigs.k8s.io/docs/user/quick-start/
5. **Kubernetes 문서**: https://kubernetes.io/docs/
