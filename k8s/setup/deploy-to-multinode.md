# 현재 프로젝트를 멀티 노드 클러스터에 배포하기

## 개요

이 가이드는 `C:\Users\zkvpt\Desktop\javatest` 프로젝트를 kind 멀티 노드 클러스터에 배포하는 방법을 설명합니다.

## 전체 배포 흐름

```
1. 클러스터 준비
   └─ kind 멀티 노드 클러스터 생성

2. 애플리케이션 준비
   ├─ Gradle 빌드
   └─ Docker 이미지 생성

3. 이미지 배포
   └─ kind 클러스터에 이미지 로드

4. Kubernetes 리소스 배포
   ├─ ConfigMap
   ├─ Secret
   ├─ Deployment
   ├─ Service
   ├─ HPA (선택)
   └─ Ingress (선택)

5. 검증 및 테스트
   ├─ Pod 분산 확인
   ├─ 애플리케이션 접근 테스트
   └─ 스케일링 테스트
```

## 사전 준비

### 1. 클러스터 생성 확인

```powershell
# k8s/setup 디렉토리로 이동
cd C:\Users\zkvpt\Desktop\javatest\k8s\setup

# 클러스터가 이미 있는지 확인
kind get clusters

# 없으면 생성
.\manage-cluster.ps1 create

# 노드 확인 (Master 1 + Worker 2 = 총 3개)
kubectl get nodes

# 출력 예시:
# NAME                                STATUS   ROLES           AGE   VERSION
# spring-boot-cluster-control-plane   Ready    control-plane   5m    v1.27.3
# spring-boot-cluster-worker          Ready    <none>          5m    v1.27.3
# spring-boot-cluster-worker2         Ready    <none>          5m    v1.27.3
```

### 2. Docker Desktop 실행 확인

```powershell
docker ps
# 정상 실행되면 컨테이너 목록 표시
```

## Step 1: 애플리케이션 빌드

### Gradle 빌드

```powershell
# 프로젝트 루트로 이동
cd C:\Users\zkvpt\Desktop\javatest

# Clean 빌드 (기존 빌드 결과 삭제)
.\gradlew clean build

# 또는 테스트 제외 빌드 (빠른 빌드)
.\gradlew clean build -x test
```

빌드 성공 시:
```
BUILD SUCCESSFUL in XXs
```

빌드 결과물 확인:
```powershell
ls build\libs\

# 출력 예시:
# open-0.0.1-SNAPSHOT.jar
```

### Docker 이미지 빌드

```powershell
# Dockerfile이 있는 프로젝트 루트에서 실행
docker build -t spring-boot-app:latest .

# 또는 버전 태그 사용
docker build -t spring-boot-app:1.0.0 .

# 빌드 진행 확인 (멀티 스테이지 빌드)
# Step 1/X: FROM ...
# Step 2/X: COPY ...
# ...
# Successfully built xxxxx
# Successfully tagged spring-boot-app:latest
```

이미지 확인:

```powershell
docker images | Select-String "spring-boot-app"

# 출력 예시:
# spring-boot-app   latest   xxxxx   2 minutes ago   350MB
# spring-boot-app   1.0.0    xxxxx   2 minutes ago   350MB
```

## Step 2: kind 클러스터에 이미지 로드

kind는 외부 Docker Registry를 사용하지 않으므로, 로컬 이미지를 클러스터에 직접 로드해야 합니다.

```powershell
# 이미지 로드 (1-2분 소요)
kind load docker-image spring-boot-app:latest --name spring-boot-cluster

# 출력:
# Image: "spring-boot-app:latest" with ID "sha256:xxxxx" not yet present on node "spring-boot-cluster-worker", loading...
# Image: "spring-boot-app:latest" with ID "sha256:xxxxx" not yet present on node "spring-boot-cluster-worker2", loading...
# Image: "spring-boot-app:latest" with ID "sha256:xxxxx" not yet present on node "spring-boot-cluster-control-plane", loading...
```

이미지 로드 확인:

```powershell
# Worker 노드에서 이미지 확인
docker exec -it spring-boot-cluster-worker crictl images | Select-String "spring-boot-app"

# 출력 예시:
# localhost/spring-boot-app   latest   xxxxx   350MB
```

## Step 3: Kubernetes 리소스 배포

### 배포 순서

1. **ConfigMap** (애플리케이션 설정)
2. **Secret** (민감 정보)
3. **Deployment** (애플리케이션 Pod)
4. **Service** (네트워크 접근)
5. **HPA** (자동 스케일링, 선택)
6. **Ingress** (외부 접근, 선택)

### 방법 1: 개별 리소스 배포 (권장, 학습용)

```powershell
# k8s 디렉토리로 이동
cd C:\Users\zkvpt\Desktop\javatest\k8s

# 1. ConfigMap 배포
kubectl apply -f configmap.yaml
# 출력: configmap/spring-boot-config created

# ConfigMap 확인
kubectl get configmap
kubectl describe configmap spring-boot-config

# 2. Secret 배포
kubectl apply -f secret.yaml
# 출력: secret/spring-boot-secret created

# Secret 확인 (값은 암호화되어 표시)
kubectl get secret
kubectl describe secret spring-boot-secret

# 3. Deployment 배포
kubectl apply -f deployment.yaml
# 출력: deployment.apps/spring-boot-app created

# Deployment 확인
kubectl get deployments
kubectl get pods

# Pod 생성 과정 Watch (실시간 확인)
kubectl get pods --watch
# Ctrl+C로 종료

# 4. Service 배포
kubectl apply -f service.yaml
# 출력: service/spring-boot-app created

# Service 확인
kubectl get svc
kubectl describe svc spring-boot-app

# 5. HPA 배포 (선택, Metrics Server 필요)
kubectl apply -f hpa.yaml
# 출력: horizontalpodautoscaler.autoscaling/spring-boot-hpa created

# HPA 확인
kubectl get hpa

# 6. Ingress 배포 (선택, Ingress Controller 필요)
kubectl apply -f ingress.yaml
# 출력: ingress.networking.k8s.io/spring-boot-ingress created

# Ingress 확인
kubectl get ingress
```

### 방법 2: 한 번에 배포 (프로덕션 방식)

```powershell
# k8s 디렉토리의 모든 YAML 파일 배포
cd C:\Users\zkvpt\Desktop\javatest
kubectl apply -f k8s/

# 출력:
# configmap/spring-boot-config created
# secret/spring-boot-secret created
# deployment.apps/spring-boot-app created
# service/spring-boot-app created
# horizontalpodautoscaler.autoscaling/spring-boot-hpa created
# ingress.networking.k8s.io/spring-boot-ingress created
```

### 방법 3: Kustomize 사용 (고급)

```powershell
# kustomization.yaml이 있는 경우
kubectl apply -k k8s/

# 또는
kubectl kustomize k8s/ | kubectl apply -f -
```

## Step 4: 배포 확인

### Pod 상태 확인

```powershell
# Pod 목록 (기본 정보)
kubectl get pods

# 출력 예시:
# NAME                              READY   STATUS    RESTARTS   AGE
# spring-boot-app-xxxxxxxxx-xxxxx   1/1     Running   0          2m
# spring-boot-app-xxxxxxxxx-yyyyy   1/1     Running   0          2m
# spring-boot-app-xxxxxxxxx-zzzzz   1/1     Running   0          2m
```

**Pod 분산 확인 (멀티 노드 핵심!)**

```powershell
# Pod가 어느 Worker 노드에 배포되었는지 확인
kubectl get pods -o wide

# 출력 예시:
# NAME                              READY   STATUS    NODE                            IP
# spring-boot-app-xxxxxxxxx-xxxxx   1/1     Running   spring-boot-cluster-worker      10.244.1.2
# spring-boot-app-xxxxxxxxx-yyyyy   1/1     Running   spring-boot-cluster-worker2     10.244.2.2
# spring-boot-app-xxxxxxxxx-zzzzz   1/1     Running   spring-boot-cluster-worker      10.244.1.3
```

보시다시피 Pod들이 **Worker 1**과 **Worker 2**에 **고르게 분산**되어 있습니다!

### 노드별 Pod 수 집계

```powershell
# Worker 노드별 Pod 수 확인
kubectl get pods -o wide | Select-String "worker" | Group-Object { ($_ -split '\s+')[6] }

# 또는 간단하게
kubectl get pods -o wide
```

### 애플리케이션 로그 확인

```powershell
# 특정 Pod 로그
kubectl logs spring-boot-app-xxxxxxxxx-xxxxx

# Deployment의 모든 Pod 로그 (실시간)
kubectl logs -f deployment/spring-boot-app

# 최근 100줄만 보기
kubectl logs --tail=100 spring-boot-app-xxxxxxxxx-xxxxx

# 타임스탬프 포함
kubectl logs --timestamps spring-boot-app-xxxxxxxxx-xxxxx
```

### Service 확인

```powershell
# Service 정보
kubectl get svc spring-boot-app

# 출력 예시:
# NAME              TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
# spring-boot-app   NodePort   10.96.123.456   <none>        8082:30080/TCP   5m

# Service 상세 정보
kubectl describe svc spring-boot-app

# Endpoints 확인 (Service가 연결된 Pod IP들)
kubectl get endpoints spring-boot-app

# 출력 예시:
# NAME              ENDPOINTS                                      AGE
# spring-boot-app   10.244.1.2:8082,10.244.1.3:8082,10.244.2.2:8082   5m
```

## Step 5: 애플리케이션 접근

### 방법 1: Port Forward (가장 쉬움)

```powershell
# 로컬 8082 포트를 Pod의 8082 포트로 포워딩
kubectl port-forward deployment/spring-boot-app 8082:8082

# 출력:
# Forwarding from 127.0.0.1:8082 -> 8082
# Forwarding from [::1]:8082 -> 8082

# 브라우저에서 접근
# http://localhost:8082
# http://localhost:8082/swagger-ui/
# http://localhost:8082/actuator/health
```

다른 PowerShell 창에서 테스트:

```powershell
# curl로 테스트
curl http://localhost:8082/actuator/health

# 또는 Invoke-WebRequest
Invoke-WebRequest -Uri http://localhost:8082/actuator/health
```

종료: Ctrl+C

### 방법 2: NodePort Service (멀티 노드 테스트에 적합)

kind-cluster-config.yaml에서 설정한 포트 매핑 사용:

```yaml
# kind-cluster-config.yaml에서 설정한 부분
extraPortMappings:
  - containerPort: 30080
    hostPort: 30080
```

service.yaml에서 NodePort 설정:

```yaml
spec:
  type: NodePort
  ports:
    - port: 8082
      targetPort: 8082
      nodePort: 30080  # 30000-32767 범위
```

접근:

```powershell
# 브라우저에서
# http://localhost:30080
# http://localhost:30080/swagger-ui/
# http://localhost:30080/actuator/health

# curl로 테스트
curl http://localhost:30080/actuator/health
```

### 방법 3: LoadBalancer (MetalLB 필요, 고급)

kind에서 LoadBalancer를 사용하려면 MetalLB 설치 필요:

```powershell
# MetalLB 설치
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.13.12/config/manifests/metallb-native.yaml

# 설정은 별도 가이드 참조
```

## Step 6: 멀티 노드 동작 테스트

### 테스트 1: Pod 분산 확인

```powershell
# Replica 수 증가
kubectl scale deployment spring-boot-app --replicas=6

# Pod 분산 확인
kubectl get pods -o wide

# 출력 예시:
# NAME                              NODE
# spring-boot-app-xxx-aaa           spring-boot-cluster-worker
# spring-boot-app-xxx-bbb           spring-boot-cluster-worker2
# spring-boot-app-xxx-ccc           spring-boot-cluster-worker
# spring-boot-app-xxx-ddd           spring-boot-cluster-worker2
# spring-boot-app-xxx-eee           spring-boot-cluster-worker
# spring-boot-app-xxx-fff           spring-boot-cluster-worker2

# 각 노드당 3개씩 고르게 분산됨!
```

### 테스트 2: 노드 장애 시뮬레이션

```powershell
# 1. 현재 Pod 분산 확인
kubectl get pods -o wide | Select-String "spring-boot-app"

# 2. Worker 노드 1 중단
docker stop spring-boot-cluster-worker

# 3. 노드 상태 확인 (NotReady로 변경됨)
kubectl get nodes
# NAME                                STATUS     ROLES
# spring-boot-cluster-worker          NotReady   <none>

# 4. Pod 재스케줄링 확인 (1-2분 대기)
kubectl get pods -o wide
# Worker 1의 Pod들이 Worker 2로 이동

# 5. 노드 복구
docker start spring-boot-cluster-worker

# 6. 노드 상태 확인 (다시 Ready)
kubectl get nodes
```

### 테스트 3: 특정 노드에 Pod 배포 (Node Affinity)

deployment.yaml 수정:

```yaml
spec:
  template:
    spec:
      # 방법 1: nodeSelector (간단)
      nodeSelector:
        worker-id: "1"  # Worker 1에만 배포

      # 방법 2: nodeAffinity (고급)
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: worker-id
                operator: In
                values:
                - "1"
```

적용:

```powershell
# Deployment 업데이트
kubectl apply -f k8s/deployment.yaml

# Pod 배포 위치 확인
kubectl get pods -o wide
# 모든 Pod가 worker-id=1 노드에만 배포됨
```

### 테스트 4: Pod 간 통신 (Service Discovery)

```powershell
# Pod 내부 접속
kubectl exec -it <pod-name> -- /bin/bash

# Pod 내부에서 Service DNS 테스트
curl http://spring-boot-app:8082/actuator/health

# 다른 Pod 접근 테스트 (Pod IP 사용)
curl http://10.244.1.2:8082/actuator/health

# DNS 확인
nslookup spring-boot-app

# 종료
exit
```

### 테스트 5: HPA 자동 스케일링 (Metrics Server 필요)

Metrics Server 설치:

```powershell
# Metrics Server 배포
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# kind 환경 설정 (TLS 검증 비활성화)
kubectl patch deployment metrics-server -n kube-system --type='json' -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'

# 1-2분 대기 후 확인
kubectl top nodes
kubectl top pods
```

HPA 테스트:

```powershell
# 현재 HPA 상태
kubectl get hpa

# 출력 예시:
# NAME               REFERENCE                    TARGETS   MINPODS   MAXPODS   REPLICAS
# spring-boot-hpa    Deployment/spring-boot-app   20%/80%   3         10        3

# 부하 생성 (별도 PowerShell 창)
kubectl run -it load-generator --rm --image=busybox --restart=Never -- /bin/sh -c "while true; do wget -q -O- http://spring-boot-app:8082/actuator/health; done"

# HPA Watch (실시간 확인)
kubectl get hpa --watch

# CPU 사용률이 80%를 넘으면 자동으로 Replica 증가!
# Pod가 여러 Worker 노드에 분산 배포됨
```

## Step 7: 롤링 업데이트 테스트

### 새 버전 배포

```powershell
# 1. 코드 수정 후 새 이미지 빌드
docker build -t spring-boot-app:v2 .

# 2. kind 클러스터에 로드
kind load docker-image spring-boot-app:v2 --name spring-boot-cluster

# 3. Deployment 이미지 업데이트
kubectl set image deployment/spring-boot-app spring-boot-app=spring-boot-app:v2

# 4. 롤아웃 상태 확인
kubectl rollout status deployment/spring-boot-app

# 출력:
# Waiting for deployment "spring-boot-app" rollout to finish: 1 out of 3 new replicas have been updated...
# Waiting for deployment "spring-boot-app" rollout to finish: 2 out of 3 new replicas have been updated...
# Waiting for deployment "spring-boot-app" rollout to finish: 3 old replicas are pending termination...
# deployment "spring-boot-app" successfully rolled out
```

실시간 Pod 변화 확인:

```powershell
# 별도 PowerShell 창에서
kubectl get pods --watch

# 출력 예시 (롤링 업데이트 진행):
# spring-boot-app-old-xxx   1/1   Running       0   5m
# spring-boot-app-new-aaa   0/1   Pending       0   0s
# spring-boot-app-new-aaa   0/1   ContainerCreating   0   1s
# spring-boot-app-new-aaa   1/1   Running       0   10s
# spring-boot-app-old-xxx   1/1   Terminating   0   5m
# ...
```

### 롤백 테스트

```powershell
# 문제 발생 시 롤백
kubectl rollout undo deployment/spring-boot-app

# 롤백 상태 확인
kubectl rollout status deployment/spring-boot-app

# 특정 버전으로 롤백
kubectl rollout history deployment/spring-boot-app
kubectl rollout undo deployment/spring-boot-app --to-revision=2
```

## 문제 해결

### Pod가 Pending 상태

```powershell
# Pod 상세 정보 확인
kubectl describe pod <pod-name>

# 이벤트 섹션에서 원인 확인:
# - Insufficient memory: 노드 메모리 부족 → Pod requests 감소
# - Insufficient cpu: 노드 CPU 부족 → Pod requests 감소
# - 0/3 nodes are available: nodeSelector 불일치 → 레이블 확인
```

### ImagePullBackOff 오류

```powershell
# 이미지가 kind 클러스터에 로드되었는지 확인
docker exec -it spring-boot-cluster-worker crictl images | Select-String "spring-boot-app"

# 없으면 다시 로드
kind load docker-image spring-boot-app:latest --name spring-boot-cluster

# Pod 재생성
kubectl delete pod <pod-name>
```

### CrashLoopBackOff 오류

```powershell
# Pod 로그 확인
kubectl logs <pod-name>
kubectl logs <pod-name> --previous  # 이전 실행 로그

# 애플리케이션 오류 확인
kubectl describe pod <pod-name>

# ConfigMap/Secret 확인
kubectl get configmap
kubectl get secret
kubectl describe configmap spring-boot-config
```

### Service로 접근 불가

```powershell
# Service와 Pod 연결 확인
kubectl get endpoints spring-boot-app

# 출력이 비어있으면 레이블 불일치
kubectl get pods --show-labels
kubectl describe svc spring-boot-app | Select-String "Selector"

# 레이블 수동 추가
kubectl label pod <pod-name> app=spring-boot-app
```

## 정리 (Cleanup)

### 임시 정리 (클러스터 유지)

```powershell
# k8s 리소스만 삭제
kubectl delete -f k8s/

# 또는 개별 삭제
kubectl delete deployment spring-boot-app
kubectl delete service spring-boot-app
kubectl delete configmap spring-boot-config
kubectl delete secret spring-boot-secret
kubectl delete hpa spring-boot-hpa
kubectl delete ingress spring-boot-ingress
```

### 완전 정리 (클러스터 삭제)

```powershell
# 클러스터 삭제
cd C:\Users\zkvpt\Desktop\javatest\k8s\setup
.\manage-cluster.ps1 delete

# 또는 직접 삭제
kind delete cluster --name spring-boot-cluster
```

## 다음 단계

1. **Ingress Controller 설치**
   - nginx-ingress 또는 traefik
   - 도메인 기반 라우팅 테스트

2. **Monitoring 구축**
   - Prometheus + Grafana
   - 리소스 사용량 대시보드

3. **로깅 시스템**
   - Fluentd + Elasticsearch + Kibana (EFK)
   - 중앙 집중식 로그 수집

4. **CI/CD 파이프라인**
   - GitHub Actions
   - 자동 빌드 및 배포

5. **고급 네트워킹**
   - Network Policy
   - Service Mesh (Istio, Linkerd)

## 참고 자료

- **프로젝트 k8s README**: `k8s/README.md`
- **kind 공식 문서**: https://kind.sigs.k8s.io/
- **Kubernetes 공식 문서**: https://kubernetes.io/docs/
- **kubectl Cheat Sheet**: https://kubernetes.io/docs/reference/kubectl/cheatsheet/
