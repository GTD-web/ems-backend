# 평가기간 단계 전이 가이드

## 개요

이 문서는 평가기간의 단계 전이 흐름과 각 단계 이동 조건을 상세히 설명합니다.

평가기간은 **상태(Status)**와 **단계(Phase)** 두 가지 개념으로 관리됩니다:
- **상태**: 평가기간의 전체 생명주기 (WAITING → IN_PROGRESS → COMPLETED)
- **단계**: 평가기간 내부의 세부 진행 단계 (WAITING → EVALUATION_SETUP → PERFORMANCE → SELF_EVALUATION → PEER_EVALUATION → CLOSURE)

## 상태(Status)와 단계(Phase)의 관계

### 상태 종류

| 상태 | 설명 | 변경 방법 |
|------|------|----------|
| `WAITING` | 평가기간이 시작되지 않은 상태 | 초기 생성 시 기본값 |
| `IN_PROGRESS` | 평가기간이 진행 중인 상태 | 수동 시작 (`평가기간_시작한다`) |
| `COMPLETED` | 평가기간이 완료된 상태 | 수동 완료 (`평가기간_완료한다`) |

### 단계 종류

| 단계 | 설명 | 마감일 필드 |
|------|------|------------|
| `WAITING` | 평가기간 시작 전 | - |
| `EVALUATION_SETUP` | 평가 기준 및 설정 단계 | `evaluationSetupDeadline` |
| `PERFORMANCE` | 실제 업무 수행 단계 | `performanceDeadline` |
| `SELF_EVALUATION` | 자기 평가 단계 | `selfEvaluationDeadline` |
| `PEER_EVALUATION` | 하향/동료 평가 단계 | `peerEvaluationDeadline` |
| `CLOSURE` | 평가 완료 및 결과 확정 단계 | `peerEvaluationDeadline` (동일) |

### 상태와 단계의 관계

```
상태: WAITING
  └─ 단계: WAITING

상태: IN_PROGRESS
  ├─ 단계: EVALUATION_SETUP
  ├─ 단계: PERFORMANCE
  ├─ 단계: SELF_EVALUATION
  ├─ 단계: PEER_EVALUATION
  └─ 단계: CLOSURE

상태: COMPLETED
  └─ 단계: CLOSURE (고정)
```

**중요 사항:**
- 상태가 `IN_PROGRESS`일 때만 단계가 자동으로 전이됩니다.
- 상태 변경은 수동으로만 가능합니다 (자동 변경 없음).
- 단계 전이는 마감일 기준으로 자동으로 전이됩니다.

## 단계 전이 흐름도

```
┌─────────┐
│ WAITING │ (초기 상태)
└────┬────┘
     │ [평가기간 시작]
     ▼
┌──────────────────┐
│ EVALUATION_SETUP │ (평가설정 단계)
└────┬─────────────┘
     │ [evaluationSetupDeadline 도달]
     ▼
┌─────────────┐
│ PERFORMANCE │ (업무 수행 단계)
└────┬────────┘
     │ [performanceDeadline 도달]
     ▼
┌──────────────────┐
│ SELF_EVALUATION  │ (자기 평가 단계)
└────┬─────────────┘
     │ [selfEvaluationDeadline 도달]
     ▼
┌──────────────────┐
│ PEER_EVALUATION  │ (하향/동료 평가 단계)
└────┬─────────────┘
     │ [peerEvaluationDeadline 도달]
     ▼
┌──────────┐
│ CLOSURE  │ (종결 단계)
└──────────┘
```

## 단계 전이 조건

### 전이 규칙

1. **순차 전이만 가능**: 단계는 순서대로만 진행되며, 건너뛰기 불가
2. **마감일 기반 전이**: 현재 단계의 마감일이 지나야 다음 단계로 전이
3. **자동 전이**: 매 시간마다 스케줄러가 자동으로 전이 조건을 확인하고 실행
4. **수동 전이**: 관리자가 수동으로 단계를 변경할 수 있음 (비즈니스 규칙 검증 포함)

### 각 단계별 전이 조건

#### 1. WAITING → EVALUATION_SETUP

**전이 조건:**
- 평가기간 상태가 `IN_PROGRESS`여야 함
- 평가기간 시작 (`평가기간_시작한다`) 시 자동으로 전이됨

**마감일:**
- 해당 없음 (수동 시작으로 전이)

**비즈니스 규칙:**
- 평가기간 상태가 `WAITING`이어야 시작 가능
- 평가기간 시작 시 자동으로 `EVALUATION_SETUP` 단계로 설정됨

---

#### 2. EVALUATION_SETUP → PERFORMANCE

**전이 조건:**
- 현재 시간 >= `evaluationSetupDeadline`
- `evaluationSetupDeadline`이 설정되어 있어야 함

**마감일 필드:**
```typescript
evaluationSetupDeadline: Date | null
```

**전이 로직:**
```typescript
// 현재 시간이 마감일을 지났는지 확인
if (now >= period.evaluationSetupDeadline) {
  // PERFORMANCE 단계로 전이
}
```

**비즈니스 규칙:**
- 마감일이 설정되지 않은 경우 전이하지 않음
- 마감일이 지나면 자동으로 전이됨

---

#### 3. PERFORMANCE → SELF_EVALUATION

**전이 조건:**
- 현재 시간 >= `performanceDeadline`
- `performanceDeadline`이 설정되어 있어야 함

**마감일 필드:**
```typescript
performanceDeadline: Date | null
```

**전이 로직:**
```typescript
// 현재 시간이 마감일을 지났는지 확인
if (now >= period.performanceDeadline) {
  // SELF_EVALUATION 단계로 전이
}
```

**비즈니스 규칙:**
- 마감일이 설정되지 않은 경우 전이하지 않음
- 마감일이 지나면 자동으로 전이됨

---

#### 4. SELF_EVALUATION → PEER_EVALUATION

**전이 조건:**
- 현재 시간 >= `selfEvaluationDeadline`
- `selfEvaluationDeadline`이 설정되어 있어야 함

**마감일 필드:**
```typescript
selfEvaluationDeadline: Date | null
```

**전이 로직:**
```typescript
// 현재 시간이 마감일을 지났는지 확인
if (now >= period.selfEvaluationDeadline) {
  // PEER_EVALUATION 단계로 전이
}
```

**비즈니스 규칙:**
- 마감일이 설정되지 않은 경우 전이하지 않음
- 마감일이 지나면 자동으로 전이됨

---

#### 5. PEER_EVALUATION → CLOSURE

**전이 조건:**
- 현재 시간 >= `peerEvaluationDeadline`
- `peerEvaluationDeadline`이 설정되어 있어야 함

**마감일 필드:**
```typescript
peerEvaluationDeadline: Date | null
```

**전이 로직:**
```typescript
// 현재 시간이 마감일을 지났는지 확인
if (now >= period.peerEvaluationDeadline) {
  // CLOSURE 단계로 전이
}
```

**비즈니스 규칙:**
- 마감일이 설정되지 않은 경우 전이하지 않음
- 마감일이 지나면 자동으로 전이됨
- CLOSURE 단계는 마지막 단계이므로 더 이상 전이하지 않음

---

## 자동 전이 메커니즘

### 스케줄러 실행

**실행 주기:**
- 매 시간마다 자동 실행 (`@Cron(CronExpression.EVERY_HOUR)`)

**실행 위치:**
```typescript
// src/domain/core/evaluation-period/evaluation-period-auto-phase.service.ts
@Cron(CronExpression.EVERY_HOUR)
async autoPhaseTransition(): Promise<number>
```

### 자동 전이 프로세스

```
1. 스케줄러 실행 (매 시간)
   ↓
2. IN_PROGRESS 상태인 평가기간 조회
   ↓
3. 각 평가기간에 대해 전이 조건 확인
   ├─ 현재 단계 확인
   ├─ 다음 단계 결정 (getNextPhase)
   ├─ 현재 단계 마감일 확인 (getPhaseDeadline)
   └─ 현재 시간 >= 마감일인지 확인
   ↓
4. 조건 만족 시 단계 전이 실행
   ├─ evaluationPeriodService.단계_변경한다() 호출
   ├─ changedBy: 'SYSTEM_AUTO_PHASE'
   └─ 로깅 및 카운트 증가
   ↓
5. 전이된 평가기간 수 반환
```

### 전이 조건 검증 로직

```typescript
// 1. 현재 단계 확인
const currentPhase = period.currentPhase;
if (!currentPhase) {
  return false; // 단계가 설정되지 않음
}

// 2. 다음 단계 결정
const nextPhase = getNextPhase(currentPhase);
if (!nextPhase) {
  return false; // 더 이상 전이할 단계가 없음
}

// 3. 현재 단계 마감일 확인
const currentPhaseDeadline = getPhaseDeadline(period, currentPhase);
if (!currentPhaseDeadline) {
  return false; // 마감일이 설정되지 않음
}

// 4. 전이 조건 확인
const shouldTransition = now >= currentPhaseDeadline;
if (shouldTransition) {
  // 단계 전이 실행
  await evaluationPeriodService.단계_변경한다(
    period.id,
    nextPhase,
    'SYSTEM_AUTO_PHASE'
  );
}
```

## 수동 단계 변경

### 수동 변경 API

**엔드포인트:**
```
POST /admin/evaluation-periods/:id/change-phase
```

**요청 본문:**
```typescript
{
  targetPhase: 'evaluation-setup' | 'performance' | 'self-evaluation' | 'peer-evaluation' | 'closure'
}
```

**비즈니스 규칙 검증:**
- 현재 단계에서 목표 단계로 전이 가능한지 검증
- 유효한 전이 경로인지 확인
- 상태가 `IN_PROGRESS`여야 함

### 수동 변경 가능한 전이

| 현재 단계 | 가능한 다음 단계 |
|----------|-----------------|
| `WAITING` | `EVALUATION_SETUP` |
| `EVALUATION_SETUP` | `PERFORMANCE` |
| `PERFORMANCE` | `SELF_EVALUATION` |
| `SELF_EVALUATION` | `PEER_EVALUATION` |
| `PEER_EVALUATION` | `CLOSURE` |
| `CLOSURE` | 없음 (마지막 단계) |

**주의사항:**
- 순차 전이만 가능 (건너뛰기 불가)
- 예: `EVALUATION_SETUP`에서 `SELF_EVALUATION`으로 직접 전이 불가

## 단계별 마감일 매핑

### 마감일 필드와 단계의 관계

| 단계 | 마감일 필드 | 설명 |
|------|------------|------|
| `EVALUATION_SETUP` | `evaluationSetupDeadline` | 평가설정 단계 마감일 |
| `PERFORMANCE` | `performanceDeadline` | 업무 수행 단계 마감일 |
| `SELF_EVALUATION` | `selfEvaluationDeadline` | 자기 평가 단계 마감일 |
| `PEER_EVALUATION` | `peerEvaluationDeadline` | 하향/동료 평가 단계 마감일 |
| `CLOSURE` | `peerEvaluationDeadline` | 종결 단계 (동료평가 마감일과 동일) |

### 마감일 확인 로직

```typescript
private getPhaseDeadline(
  period: EvaluationPeriod,
  phase: EvaluationPeriodPhase
): Date | null {
  switch (phase) {
    case EvaluationPeriodPhase.EVALUATION_SETUP:
      return period.evaluationSetupDeadline || null;
    case EvaluationPeriodPhase.PERFORMANCE:
      return period.performanceDeadline || null;
    case EvaluationPeriodPhase.SELF_EVALUATION:
      return period.selfEvaluationDeadline || null;
    case EvaluationPeriodPhase.PEER_EVALUATION:
      return period.peerEvaluationDeadline || null;
    case EvaluationPeriodPhase.CLOSURE:
      return period.peerEvaluationDeadline || null; // 종결은 동료평가 마감일과 동일
    default:
      return null;
  }
}
```

## 상태 변경 (수동)

### 상태 변경 API

#### 1. 평가기간 시작

**엔드포인트:**
```
POST /admin/evaluation-periods/:id/start
```

**동작:**
- 상태: `WAITING` → `IN_PROGRESS`
- 단계: `WAITING` → `EVALUATION_SETUP` (자동)
- 시작일: `startDate` 설정

**비즈니스 규칙:**
- 현재 상태가 `WAITING`이어야 함
- 평가기간 시작 가능 여부 검증

#### 2. 평가기간 완료

**엔드포인트:**
```
POST /admin/evaluation-periods/:id/complete
```

**동작:**
- 상태: `IN_PROGRESS` → `COMPLETED`
- 단계: 현재 단계 유지 (변경 없음)
- 완료일: `completedDate` 설정

**비즈니스 규칙:**
- 현재 상태가 `IN_PROGRESS`이어야 함
- 평가기간 완료 가능 여부 검증

## 전이 시나리오 예시

### 시나리오 1: 정상적인 자동 전이

```
1. 평가기간 생성
   - 상태: WAITING
   - 단계: WAITING
   - 마감일 설정:
     * evaluationSetupDeadline: 2024-01-15
     * performanceDeadline: 2024-05-31
     * selfEvaluationDeadline: 2024-06-15
     * peerEvaluationDeadline: 2024-06-30

2. 평가기간 시작 (2024-01-01)
   - 상태: WAITING → IN_PROGRESS
   - 단계: WAITING → EVALUATION_SETUP

3. 자동 전이 (2024-01-15 00:00 이후)
   - 현재 시간 >= evaluationSetupDeadline
   - 단계: EVALUATION_SETUP → PERFORMANCE

4. 자동 전이 (2024-05-31 00:00 이후)
   - 현재 시간 >= performanceDeadline
   - 단계: PERFORMANCE → SELF_EVALUATION

5. 자동 전이 (2024-06-15 00:00 이후)
   - 현재 시간 >= selfEvaluationDeadline
   - 단계: SELF_EVALUATION → PEER_EVALUATION

6. 자동 전이 (2024-06-30 00:00 이후)
   - 현재 시간 >= peerEvaluationDeadline
   - 단계: PEER_EVALUATION → CLOSURE

7. 평가기간 완료 (수동)
   - 상태: IN_PROGRESS → COMPLETED
   - 단계: CLOSURE (유지)
```

### 시나리오 2: 마감일 미설정 시

```
1. 평가기간 생성 및 시작
   - 상태: IN_PROGRESS
   - 단계: EVALUATION_SETUP
   - evaluationSetupDeadline: null (설정 안 함)

2. 자동 전이 시도
   - 마감일이 null이므로 전이하지 않음
   - 단계: EVALUATION_SETUP (유지)

3. 수동으로 마감일 설정
   - evaluationSetupDeadline: 2024-01-15 설정

4. 자동 전이 (2024-01-15 00:00 이후)
   - 현재 시간 >= evaluationSetupDeadline
   - 단계: EVALUATION_SETUP → PERFORMANCE
```

### 시나리오 3: 수동 단계 변경

```
1. 평가기간 진행 중
   - 상태: IN_PROGRESS
   - 단계: EVALUATION_SETUP
   - evaluationSetupDeadline: 2024-01-20 (아직 도래하지 않음)

2. 관리자가 수동으로 단계 변경
   - POST /admin/evaluation-periods/:id/change-phase
   - targetPhase: 'performance'

3. 비즈니스 규칙 검증
   - EVALUATION_SETUP → PERFORMANCE: 유효한 전이 경로 ✓
   - 단계: EVALUATION_SETUP → PERFORMANCE

4. 이후 자동 전이는 performanceDeadline 기준으로 진행
```

## 구현 위치

### 주요 파일

1. **자동 전이 서비스:**
   - `src/domain/core/evaluation-period/evaluation-period-auto-phase.service.ts`
   - 자동 전이 로직 및 스케줄러

2. **도메인 서비스:**
   - `src/domain/core/evaluation-period/evaluation-period.service.ts`
   - 단계 변경 및 상태 변경 로직

3. **컨텍스트 서비스:**
   - `src/context/evaluation-period-management-context/evaluation-period-management.service.ts`
   - 단계 변경 및 자동 전이 실행 API

4. **컨트롤러:**
   - `src/interface/admin/evaluation-period/evaluation-period-management.controller.ts`
   - 단계 변경 및 상태 변경 엔드포인트

### 핵심 메서드

```typescript
// 자동 전이 실행
EvaluationPeriodAutoPhaseService.autoPhaseTransition()

// 단계 전이 확인 및 실행
EvaluationPeriodAutoPhaseService.checkAndTransitionPhase()

// 다음 단계 결정
EvaluationPeriodAutoPhaseService.getNextPhase()

// 전이 조건 확인
EvaluationPeriodAutoPhaseService.shouldTransitionToNextPhase()

// 단계별 마감일 조회
EvaluationPeriodAutoPhaseService.getPhaseDeadline()

// 단계 변경 (도메인 서비스)
EvaluationPeriodService.단계_변경한다()

// 상태 변경 (도메인 서비스)
EvaluationPeriodService.시작한다()
EvaluationPeriodService.완료한다()
```

## 주의사항

1. **마감일 설정 필수:**
   - 각 단계의 마감일이 설정되지 않으면 자동 전이가 되지 않음
   - 수동으로 단계를 변경하거나 마감일을 설정해야 함

2. **순차 전이만 가능:**
   - 단계는 순서대로만 진행되며, 건너뛰기 불가
   - 예: `EVALUATION_SETUP`에서 `SELF_EVALUATION`으로 직접 전이 불가

3. **상태와 단계의 독립성:**
   - 상태 변경은 수동으로만 가능
   - 단계 전이는 자동 또는 수동으로 가능

4. **자동 전이 실행 주기:**
   - 매 시간마다 실행되므로, 마감일 도달 후 최대 1시간 지연 가능
   - 즉시 전이가 필요한 경우 수동 전이 API 사용

5. **CLOSURE 단계:**
   - 마지막 단계이므로 더 이상 전이하지 않음
   - 평가기간 완료 시 상태만 `COMPLETED`로 변경

## 관련 문서

- [평가기간 일정 관리](./evaluation-period-schedule.md)
- [평가기간 API 참조](../interface/admin/evaluation-period/evaluation-period-api-reference.md)

---

**작성일**: 2024-12-19  
**최종 수정일**: 2024-12-19

