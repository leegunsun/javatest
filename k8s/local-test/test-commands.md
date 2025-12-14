# Kubernetes 로컬 테스트 명령어 모음

이 문서는 로컬 Kind 클러스터에서 Spring Boot 애플리케이션을 테스트할 때 유용한 명령어들을 정리한 것입니다.

## 📑 목차

- [클러스터 관리](#클러스터-관리)
- [리소스 배포](#리소스-배포)
- [상태 확인](#상태-확인)
- [로그 및 디버깅](#로그-및-디버깅)
- [네트워킹 테스트](#네트워킹-테스트)
- [스케일링 및 업데이트](#스케일링-및-업데이트)
- [트러블슈팅](#트러블슈팅)

---

## 클러스터 관리

### 클러스터 생성 및 삭제

```powershell
# 클러스터 생성
kind create cluster --config=k8s/setup/kind-local-test-config.yaml

# 클러스터 목록 확인
kind get clusters

# 클러스터 삭제
kind delete cluster --name local-test-cluster

# 모든 클러스터 삭제
kind delete clusters --all
```

### Context 관리

```powershell
# 현재 context 확인
kubectl config current-context

# 사용 가능한 context 목록
kubectl config get-contexts

# Context 전환
kubectl config use-context kind-local-test-cluster

# Cluster 정보 확인
kubectl cluster-info
kubectl cluster-info dump  # 상세 정보
```

### 노드 관리

```powershell
# 노드 목록
kubectl get nodes
kubectl get nodes -o wide

# 노드 상세 정보
kubectl describe node local-test-cluster-control-plane
kubectl describe node local-test-cluster-worker

# 노드 리소스 사용량
kubectl top nodes

# 노드 레이블 확인
kubectl get nodes --show-labels

# 노드에 레이블 추가
kubectl label node local-test-cluster-worker disktype=ssd

# 노드 Drain (유지보수 모드)
kubectl drain local-test-cluster-worker --ignore-daemonsets

# 노드 다시 활성화
kubectl uncordon local-test-cluster-worker
```

---

## 리소스 배포

### 기본 배포

```powershell
# 단일 파일 배포
kubectl apply -f k8s/local-test/deployment-local.yaml

# 디렉토리 전체 배포
kubectl apply -f k8s/local-test/

# 특정 리소스만 배포
kubectl apply -f k8s/local-test/configmap-local.yaml
kubectl apply -f k8s/local-test/deployment-local.yaml
kubectl apply -f k8s/local-test/service-local.yaml
kubectl apply -f k8s/local-test/ingress-local.yaml

# URL에서 직접 배포
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# 배포 순서 (권장)
kubectl apply -f k8s/local-test/configmap-local.yaml
kubectl apply -f k8s/local-test/secret-local.yaml  # 있는 경우
kubectl apply -f k8s/local-test/deployment-local.yaml
kubectl apply -f k8s/local-test/service-local.yaml
kubectl apply -f k8s/local-test/ingress-local.yaml
```

### 리소스 삭제

```powershell
# 단일 리소스 삭제
kubectl delete -f k8s/local-test/deployment-local.yaml

# 디렉토리 전체 삭제
kubectl delete -f k8s/local-test/

# 이름으로 삭제
kubectl delete deployment open-green-local
kubectl delete service open-green-service
kubectl delete ingress open-green-ingress

# 레이블로 삭제
kubectl delete pods -l app=open-green

# 모든 리소스 삭제 (주의!)
kubectl delete all --all

# 네임스페이스 전체 삭제
kubectl delete namespace default  # 주의: default는 재생성됨
```

### Docker 이미지 관리

```powershell
# Docker 이미지 빌드
docker build -t open-green:local-test .

# 빌드 인자와 함께 빌드
docker build --build-arg JAR_FILE=build/libs/*.jar -t open-green:local-test .

# 캐시 없이 빌드
docker build --no-cache -t open-green:local-test .

# Kind 클러스터로 이미지 로드
kind load docker-image open-green:local-test --name local-test-cluster

# 클러스터 내부 이미지 확인
docker exec -it local-test-cluster-control-plane crictl images

# 클러스터 내부 이미지 삭제
docker exec -it local-test-cluster-control-plane crictl rmi open-green:local-test
```

---

## 상태 확인

### 전체 리소스 확인

```powershell
# 모든 리소스 확인
kubectl get all

# 네임스페이스 포함
kubectl get all --all-namespaces
kubectl get all -A  # 축약형

# 특정 네임스페이스
kubectl get all -n ingress-nginx

# 레이블로 필터링
kubectl get all -l app=open-green

# 출력 형식 지정
kubectl get all -o wide        # 상세 정보
kubectl get all -o yaml        # YAML 형식
kubectl get all -o json        # JSON 형식
kubectl get all -o name        # 이름만
```

### Pod 확인

```powershell
# Pod 목록
kubectl get pods
kubectl get pods -o wide
kubectl get po  # 축약형

# Pod 상태 실시간 확인
kubectl get pods --watch
kubectl get pods -w  # 축약형

# 특정 Pod 상세 정보
kubectl describe pod <pod-name>

# Pod 이벤트만 확인
kubectl get events --field-selector involvedObject.name=<pod-name>

# Pod 리소스 사용량
kubectl top pod <pod-name>
kubectl top pods  # 모든 Pod

# Pod의 컨테이너 목록
kubectl get pod <pod-name> -o jsonpath='{.spec.containers[*].name}'

# Pod IP 확인
kubectl get pod <pod-name> -o jsonpath='{.status.podIP}'

# 종료된 Pod 포함 조회
kubectl get pods --show-all
```

### Deployment 확인

```powershell
# Deployment 목록
kubectl get deployments
kubectl get deploy  # 축약형

# Deployment 상세 정보
kubectl describe deployment open-green-local

# Deployment 이벤트
kubectl get events --field-selector involvedObject.name=open-green-local

# Deployment 상태 확인
kubectl rollout status deployment/open-green-local

# Deployment 히스토리
kubectl rollout history deployment/open-green-local

# 특정 리비전 상세 정보
kubectl rollout history deployment/open-green-local --revision=2

# ReplicaSet 확인 (Deployment가 관리)
kubectl get replicaset
kubectl get rs  # 축약형
```

### Service 확인

```powershell
# Service 목록
kubectl get services
kubectl get svc  # 축약형

# Service 상세 정보
kubectl describe service open-green-service

# Endpoints 확인 (Service가 라우팅하는 Pod IP)
kubectl get endpoints open-green-service
kubectl get ep open-green-service  # 축약형

# Service의 ClusterIP 확인
kubectl get service open-green-service -o jsonpath='{.spec.clusterIP}'

# Service의 모든 포트 확인
kubectl get service open-green-service -o jsonpath='{.spec.ports[*].port}'
```

### Ingress 확인

```powershell
# Ingress 목록
kubectl get ingress
kubectl get ing  # 축약형

# Ingress 상세 정보
kubectl describe ingress open-green-ingress

# Ingress 주소 확인
kubectl get ingress open-green-ingress -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

# Ingress 규칙 확인
kubectl get ingress open-green-ingress -o yaml

# Ingress Controller 확인
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

### ConfigMap/Secret 확인

```powershell
# ConfigMap 목록
kubectl get configmap
kubectl get cm  # 축약형

# ConfigMap 내용 확인
kubectl describe configmap open-green-config
kubectl get configmap open-green-config -o yaml

# 특정 키 값만 확인
kubectl get configmap open-green-config -o jsonpath='{.data.server\.port}'

# Secret 목록
kubectl get secret

# Secret 내용 확인 (Base64 인코딩됨)
kubectl get secret open-green-secret -o yaml

# Secret 디코딩
kubectl get secret open-green-secret -o jsonpath='{.data.db\.password}' | base64 --decode
```

---

## 로그 및 디버깅

### Pod 로그 확인

```powershell
# 기본 로그 확인
kubectl logs <pod-name>

# 실시간 로그 스트리밍
kubectl logs <pod-name> -f
kubectl logs <pod-name> --follow

# 최근 로그만 확인
kubectl logs <pod-name> --tail=100

# 타임스탬프 포함
kubectl logs <pod-name> --timestamps

# 이전 컨테이너 로그 (재시작된 경우)
kubectl logs <pod-name> --previous
kubectl logs <pod-name> -p

# 여러 Pod 로그 동시 확인 (레이블 사용)
kubectl logs -l app=open-green --tail=50 -f

# 특정 컨테이너 로그 (Pod에 여러 컨테이너가 있을 때)
kubectl logs <pod-name> -c <container-name>

# 로그를 파일로 저장
kubectl logs <pod-name> > app.log
```

### Pod 내부 접근

```powershell
# 쉘 접근 (sh)
kubectl exec -it <pod-name> -- /bin/sh

# Bash 접근 (있는 경우)
kubectl exec -it <pod-name> -- /bin/bash

# 단일 명령 실행
kubectl exec <pod-name> -- ls -la /app
kubectl exec <pod-name> -- env
kubectl exec <pod-name> -- cat /app/config/application.yml

# 파일 복사 (Pod -> 로컬)
kubectl cp <pod-name>:/app/logs/app.log ./app.log

# 파일 복사 (로컬 -> Pod)
kubectl cp ./config.yml <pod-name>:/app/config/config.yml

# 네트워크 테스트
kubectl exec <pod-name> -- wget -O- http://localhost:8082/actuator/health
kubectl exec <pod-name> -- curl http://localhost:8082/actuator/info
```

### 임시 디버그 Pod 실행

```powershell
# BusyBox (경량 디버깅 도구)
kubectl run -it --rm debug --image=busybox --restart=Never -- sh

# Alpine Linux
kubectl run -it --rm debug --image=alpine --restart=Never -- sh

# Ubuntu
kubectl run -it --rm debug --image=ubuntu --restart=Never -- bash

# Curl 테스트용
kubectl run -it --rm curl --image=curlimages/curl --restart=Never -- sh

# 디버그 Pod 내부에서 테스트 예시
# nslookup open-green-service
# wget -O- http://open-green-service:8080/actuator/health
# nc -zv open-green-service 8080
```

### 이벤트 확인

```powershell
# 모든 이벤트
kubectl get events

# 최근 이벤트만
kubectl get events --sort-by='.lastTimestamp'

# Warning 이벤트만
kubectl get events --field-selector type=Warning

# 특정 리소스 이벤트
kubectl get events --field-selector involvedObject.name=open-green-local

# 이벤트 실시간 확인
kubectl get events --watch
```

### 리소스 사용량 모니터링

```powershell
# Metrics Server 설치 (필요시)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# 노드 리소스 사용량
kubectl top nodes

# Pod 리소스 사용량
kubectl top pods

# 특정 Pod 리소스 사용량
kubectl top pod <pod-name>

# 컨테이너별 리소스 사용량
kubectl top pod <pod-name> --containers
```

---

## 네트워킹 테스트

### Service 연결 테스트

```powershell
# Port Forward로 로컬 접속
kubectl port-forward service/open-green-service 8080:8080

# 특정 Pod로 Port Forward
kubectl port-forward pod/<pod-name> 8080:8082

# 백그라운드 실행
Start-Job -ScriptBlock { kubectl port-forward service/open-green-service 8080:8080 }

# Port Forward 중지
Get-Job | Stop-Job
Get-Job | Remove-Job
```

### Ingress 테스트

```powershell
# 기본 접속
curl http://localhost/actuator/health

# 특정 경로 테스트
curl http://localhost/api/v1/todos

# POST 요청 테스트
curl -X POST http://localhost/api/v1/todos `
  -H "Content-Type: application/json" `
  -d '{"title":"Test Todo","completed":false}'

# 헤더 포함 요청
curl -H "Host: api.local.example.com" http://localhost/api

# HTTPS 테스트 (TLS 설정 시)
curl -k https://localhost/actuator/health

# 상세 정보 포함
curl -v http://localhost/actuator/health

# 응답 시간 측정
Measure-Command { curl http://localhost/actuator/health }
```

### DNS 테스트

```powershell
# 임시 Pod에서 DNS 테스트
kubectl run -it --rm debug --image=busybox --restart=Never -- sh

# Pod 내부에서:
nslookup open-green-service
nslookup open-green-service.default
nslookup open-green-service.default.svc.cluster.local

# 외부 DNS 테스트
nslookup google.com
```

### 네트워크 연결 테스트

```powershell
# 임시 Pod에서 네트워크 테스트
kubectl run -it --rm netshoot --image=nicolaka/netshoot --restart=Never -- bash

# Pod 내부에서:
# TCP 연결 테스트
nc -zv open-green-service 8080

# HTTP 요청
curl http://open-green-service:8080/actuator/health

# 트레이스라우트
traceroute open-green-service

# 패킷 캡처
tcpdump -i any port 8080
```

---

## 스케일링 및 업데이트

### 수동 스케일링

```powershell
# 복제본 수 변경
kubectl scale deployment open-green-local --replicas=3

# 스케일링 확인
kubectl get deployment open-green-local
kubectl get pods -l app=open-green

# 0으로 스케일 다운 (일시 중지)
kubectl scale deployment open-green-local --replicas=0

# 다시 시작
kubectl scale deployment open-green-local --replicas=2
```

### 롤링 업데이트

```powershell
# 이미지 업데이트
kubectl set image deployment/open-green-local app=open-green:v2

# 환경 변수 업데이트
kubectl set env deployment/open-green-local SPRING_PROFILES_ACTIVE=test

# 업데이트 상태 확인
kubectl rollout status deployment/open-green-local

# 업데이트 일시 중지
kubectl rollout pause deployment/open-green-local

# 업데이트 재개
kubectl rollout resume deployment/open-green-local

# 업데이트 히스토리
kubectl rollout history deployment/open-green-local
```

### 롤백

```powershell
# 이전 버전으로 롤백
kubectl rollout undo deployment/open-green-local

# 특정 리비전으로 롤백
kubectl rollout undo deployment/open-green-local --to-revision=2

# 롤백 상태 확인
kubectl rollout status deployment/open-green-local
```

### 재시작

```powershell
# Deployment 재시작 (모든 Pod 재생성)
kubectl rollout restart deployment/open-green-local

# 특정 Pod만 삭제 (자동 재생성)
kubectl delete pod <pod-name>

# 레이블로 Pod 삭제
kubectl delete pods -l app=open-green
```

### HPA (자동 스케일링)

```powershell
# HPA 생성
kubectl autoscale deployment open-green-local --min=2 --max=10 --cpu-percent=70

# HPA 상태 확인
kubectl get hpa
kubectl describe hpa open-green-local

# HPA 삭제
kubectl delete hpa open-green-local

# YAML로 HPA 적용
kubectl apply -f k8s/local-test/hpa-local.yaml
```

---

## 트러블슈팅

### Pod 문제 진단

```powershell
# Pod 상태가 Pending일 때
kubectl describe pod <pod-name>
# 확인 사항: 리소스 부족, PersistentVolume 미생성

# Pod 상태가 CrashLoopBackOff일 때
kubectl logs <pod-name>
kubectl logs <pod-name> --previous
# 확인 사항: 애플리케이션 오류, 환경 변수 누락

# Pod 상태가 ImagePullBackOff일 때
kubectl describe pod <pod-name>
# 확인 사항: 이미지 이름 오타, kind load 누락

# Pod가 Ready 되지 않을 때
kubectl describe pod <pod-name>
kubectl logs <pod-name>
# 확인 사항: Readiness Probe 실패, 포트 불일치
```

### Service 문제 진단

```powershell
# Service가 작동하지 않을 때
kubectl get endpoints open-green-service

# Endpoints가 비어있다면:
# 1. Selector 확인
kubectl get service open-green-service -o yaml
kubectl get pods --show-labels

# 2. Pod 상태 확인
kubectl get pods -l app=open-green

# 3. Port 확인
kubectl describe service open-green-service
```

### Ingress 문제 진단

```powershell
# Ingress Controller 로그 확인
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller -f

# Ingress 설정 확인
kubectl describe ingress open-green-ingress

# Ingress Controller ConfigMap 확인
kubectl get configmap -n ingress-nginx

# 502 Bad Gateway 발생 시:
# 1. Backend Pod 확인
kubectl get pods -l app=open-green
kubectl logs <pod-name>

# 2. Service Endpoints 확인
kubectl get endpoints open-green-service

# 3. Pod Readiness 확인
kubectl describe pod <pod-name>
```

### 리소스 정리

```powershell
# Evicted Pod 정리
kubectl get pods --field-selector=status.phase=Failed -o name | ForEach-Object { kubectl delete $_ }

# Completed Job 정리
kubectl delete jobs --field-selector status.successful=1

# 오래된 ReplicaSet 정리
kubectl delete replicaset --all

# 사용하지 않는 이미지 정리 (클러스터 내부)
docker exec -it local-test-cluster-control-plane crictl rmi --prune
```

### 전체 재시작

```powershell
# 모든 리소스 삭제 후 재배포
kubectl delete -f k8s/local-test/
kubectl apply -f k8s/local-test/

# 또는
kubectl delete deployment,service,ingress,configmap -l app=open-green
kubectl apply -f k8s/local-test/
```

---

## 유용한 별칭 (Alias) 설정

PowerShell 프로파일에 추가하면 편리합니다:

```powershell
# PowerShell 프로파일 열기
notepad $PROFILE

# 다음 내용 추가:
function k { kubectl $args }
function kgp { kubectl get pods $args }
function kgs { kubectl get services $args }
function kgd { kubectl get deployments $args }
function kgi { kubectl get ingress $args }
function kdp { kubectl describe pod $args }
function kl { kubectl logs $args }
function klf { kubectl logs -f $args }
function kex { kubectl exec -it $args }
function kpf { kubectl port-forward $args }

# 저장 후 프로파일 다시 로드
. $PROFILE
```

사용 예:
```powershell
k get pods          # kubectl get pods
kgp -w              # kubectl get pods --watch
kl <pod-name> -f    # kubectl logs <pod-name> -f
kex <pod-name> sh   # kubectl exec -it <pod-name> sh
```

---

이 명령어들을 숙지하면 Kubernetes 환경에서 효율적으로 작업할 수 있습니다! 🚀
