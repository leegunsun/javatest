# Kubernetes Node 확인 명령어 가이드

## 1. 기본 Node 확인

### 모든 Node 목록 보기
```bash
kubectl get nodes

# 출력 예시:
# NAME           STATUS   ROLES           AGE   VERSION
# minikube       Ready    control-plane   5d    v1.28.3
# worker-node-1  Ready    <none>          5d    v1.28.3
# worker-node-2  Ready    <none>          5d    v1.28.3
```

**컬럼 설명**:
- `NAME`: Node 이름
- `STATUS`: Ready (정상), NotReady (문제 있음)
- `ROLES`: control-plane (Master), <none> (Worker)
- `AGE`: Node가 클러스터에 추가된 지 얼마나 됐는지
- `VERSION`: Kubernetes 버전

---

## 2. 상세 Node 정보 보기

### 특정 Node의 상세 정보
```bash
kubectl describe node minikube

# 출력에 포함되는 주요 정보:
# - CPU, 메모리 용량 및 사용량
# - 실행 중인 Pod 목록
# - Node 상태 (메모리 부족, 디스크 부족 등)
# - Labels (Node에 붙은 태그)
```

### Node 리소스 사용량 확인
```bash
kubectl top nodes

# 출력 예시:
# NAME      CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
# minikube  250m         12%    1500Mi          37%
```

**단위 설명**:
- `m` (millicores): 1000m = 1 CPU core
- `Mi` (Mebibytes): 메모리 용량 (1024 기반)

---

## 3. Pod가 어느 Node에 있는지 확인

### Pod 목록과 배치된 Node 보기
```bash
kubectl get pods -o wide

# 출력 예시:
# NAME                          READY   STATUS    NODE           IP
# open-green-5f7b8c9d4-abcd1    1/1     Running   worker-node-1  10.244.1.5
# open-green-5f7b8c9d4-abcd2    1/1     Running   worker-node-2  10.244.2.3
# open-green-5f7b8c9d4-abcd3    1/1     Running   worker-node-1  10.244.1.6
```

**NODE 컬럼**을 보면 각 Pod가 어느 Node에서 실행 중인지 알 수 있습니다.

### 특정 Node에서 실행 중인 Pod만 보기
```bash
kubectl get pods --field-selector spec.nodeName=minikube
```

---

## 4. Node Labels 확인 및 활용

### Node에 붙은 Label 보기
```bash
kubectl get nodes --show-labels

# 출력 예시:
# NAME       STATUS   LABELS
# minikube   Ready    kubernetes.io/hostname=minikube,
#                     kubernetes.io/os=linux,
#                     node.kubernetes.io/instance-type=standard
```

### 특정 Label을 가진 Node만 보기
```bash
# 특정 hostname을 가진 Node 찾기
kubectl get nodes -l kubernetes.io/hostname=minikube

# 특정 zone에 있는 Node 찾기
kubectl get nodes -l topology.kubernetes.io/zone=us-west-1a
```

### Node에 Label 추가하기
```bash
# "environment=production" 라벨 추가
kubectl label nodes worker-node-1 environment=production

# Label 확인
kubectl get nodes worker-node-1 --show-labels
```

**실전 활용 예시**:
```yaml
# Deployment에서 특정 Label을 가진 Node에만 배치
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: environment
            operator: In
            values:
            - production
```

---

## 5. Node 상태 모니터링

### Node 이벤트 확인 (문제 진단)
```bash
kubectl get events --field-selector involvedObject.kind=Node

# Node에서 발생한 이벤트 보기
# 예: 메모리 부족, 네트워크 문제 등
```

### Node 상태 조건 확인
```bash
kubectl get nodes -o json | jq '.items[].status.conditions'

# 확인할 수 있는 상태:
# - Ready: Node가 Pod를 받을 준비가 됐는지
# - MemoryPressure: 메모리가 부족한지
# - DiskPressure: 디스크 공간이 부족한지
# - PIDPressure: 프로세스가 너무 많은지
# - NetworkUnavailable: 네트워크 문제가 있는지
```

---

## 6. Node Taints 확인 (고급)

### Node Taints 보기
```bash
kubectl describe node minikube | grep Taints

# 출력 예시:
# Taints: node-role.kubernetes.io/control-plane:NoSchedule
```

**Taints 의미**:
- `NoSchedule`: 특별한 허가(toleration) 없이는 Pod 배치 불가
- Master Node는 보통 이 Taint가 있어서 일반 Pod가 배치되지 않음

**비유**: "출입 금지 구역" - 특별 허가증(toleration)이 있어야만 들어갈 수 있음

---

## 7. 실전 예시: Node 분산 확인

### Spring Boot 앱이 여러 Node에 잘 분산됐는지 확인
```bash
# 1단계: Pod 목록과 Node 확인
kubectl get pods -l app=open-green -o wide

# 2단계: Node별 Pod 개수 카운트
kubectl get pods -l app=open-green -o json | \
  jq -r '.items[].spec.nodeName' | \
  sort | uniq -c

# 출력 예시:
#   1 worker-node-1  ← Node 1에 Pod 1개
#   1 worker-node-2  ← Node 2에 Pod 1개
#   1 worker-node-3  ← Node 3에 Pod 1개
# → 균등하게 분산됨!
```

---

## 8. Windows 환경 추가 팁

### Git Bash에서 jq 없이 간단히 확인
```bash
# Node별 Pod 개수 확인 (Windows CMD/PowerShell)
kubectl get pods -l app=open-green -o wide | awk '{print $7}' | sort | uniq -c
```

### Minikube에서 Node 정보 확인
```bash
# Minikube는 기본적으로 단일 Node 클러스터
minikube status

# 멀티 노드 Minikube 시작하기 (학습용)
minikube start --nodes 3
```

---

## 요약

| 명령어 | 용도 |
|--------|------|
| `kubectl get nodes` | 모든 Node 목록 |
| `kubectl describe node <이름>` | 특정 Node 상세 정보 |
| `kubectl top nodes` | Node 리소스 사용량 |
| `kubectl get pods -o wide` | Pod가 어느 Node에 있는지 확인 |
| `kubectl get nodes --show-labels` | Node Labels 보기 |
| `kubectl label nodes <이름> key=value` | Node에 Label 추가 |
