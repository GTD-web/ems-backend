# 최종평가 시나리오 문서

## 개요

최종평가 관리 기능의 E2E 테스트 시나리오를 정의합니다. 최종평가는 직원의 전체 평가 과정을 종합한 최종 등급과 의견을 관리하는 기능입니다.

## 사용 컨트롤러

- **FinalEvaluationManagementController**: 최종평가 저장, 확정, 조회 기능

## 주요 엔드포인트

| 기능 | HTTP 메서드 | 엔드포인트 | 설명 |
|------|-------------|------------|------|
| 최종평가 저장 | `POST` | `/admin/performance-evaluation/final-evaluations/employee/:employeeId/period/:periodId` | Upsert 방식 저장 |
| 최종평가 확정 | `POST` | `/admin/performance-evaluation/final-evaluations/:id/confirm` | 최종평가 확정 |
| 최종평가 확정 취소 | `POST` | `/admin/performance-evaluation/final-evaluations/:id/cancel-confirmation` | 확정 취소 |
| 최종평가 조회 | `GET` | `/admin/performance-evaluation/final-evaluations/:id` | 단일 조회 |
| 최종평가 목록 조회 | `GET` | `/admin/performance-evaluation/final-evaluations` | 목록 조회 |
| 직원-평가기간별 조회 | `GET` | `/admin/performance-evaluation/final-evaluations/employee/:employeeId/period/:periodId` | 직원-평가기간별 조회 |

## 시나리오 목록

### 시나리오 1: 최종평가 저장 (Upsert)

**목적**: 직원-평가기간 조합으로 최종평가를 저장하고 수정할 수 있는지 검증

**검증 사항**:
- 기본 최종평가 저장 (생성)
- 최종평가 의견 포함 저장
- 기존 평가 수정 (Upsert)
- 다양한 평가등급 저장
- 다양한 직무등급 조합 저장
- 초기 생성 시 isConfirmed가 false인지 확인
- 같은 직원-평가기간 조합에 하나의 평가만 존재
- 잘못된 employeeId/periodId 형식 시 400 에러
- 필수 필드 누락 시 400 에러
- 응답 구조 검증 (id, message)

### 시나리오 2: 최종평가 확정

**목적**: 최종평가를 확정하여 더 이상 수정할 수 없도록 만들 수 있는지 검증

**검증 사항**:
- 기본 최종평가 확정
- 확정 후 isConfirmed가 true로 변경
- 확정 후 confirmedAt 설정
- 확정 후 updatedAt 갱신
- 이미 확정된 평가 재확정 시 409 에러
- 존재하지 않는 평가 확정 시 404 에러
- 잘못된 평가 ID 형식 시 400 에러
- 응답 메시지 검증

### 시나리오 3: 최종평가 확정 취소

**목적**: 확정된 최종평가를 취소하여 다시 수정 가능하게 할 수 있는지 검증

**검증 사항**:
- 확정된 평가의 확정 취소
- 확정 취소 후 isConfirmed가 false로 변경
- 확정 취소 후 confirmedAt과 confirmedBy가 null로 변경
- 확정 취소 후 updatedAt 갱신
- 확정 취소 후 평가 수정 가능
- 확정되지 않은 평가 확정 취소 시 422 에러
- 존재하지 않는 평가 확정 취소 시 404 에러
- 잘못된 평가 ID 형식 시 400 에러

### 시나리오 4: 최종평가 조회

**목적**: 저장된 최종평가를 다양한 방법으로 조회할 수 있는지 검증

**검증 사항**:
- ID로 단일 조회
- 직원 정보가 객체로 반환 (id, name, employeeNumber, email)
- 평가기간 정보가 객체로 반환 (id, name, startDate, endDate, status)
- 평가 등급 정보 정확히 반환
- 확정 정보 정확히 반환
- 미확정 평가는 확정 정보가 null
- 존재하지 않는 평가 조회 시 404 에러
- 잘못된 평가 ID 형식 시 400 에러

### 시나리오 5: 최종평가 목록 조회

**목적**: 다양한 필터 조건으로 최종평가 목록을 조회할 수 있는지 검증

**검증 사항**:
- 기본 목록 조회
- 페이지네이션 작동 (page, limit)
- employeeId로 필터링
- periodId로 필터링
- evaluationGrade로 필터링
- confirmedOnly로 필터링
- 직원 정보가 객체로 반환
- 평가기간 정보가 객체로 반환
- createdAt 역순 정렬 (최신순)
- 빈 목록도 정상 응답

### 시나리오 6: 직원-평가기간별 최종평가 조회

**목적**: 특정 직원의 특정 평가기간 최종평가를 조회할 수 있는지 검증

**검증 사항**:
- 기본 조회
- 직원 정보가 객체로 반환
- 평가기간 정보가 객체로 반환
- 평가 등급 정보 정확히 반환
- 확정 정보 정확히 반환
- 미확정 평가는 확정 정보가 null
- 존재하지 않는 조합 조회 시 null 반환 또는 404 에러
- 잘못된 employeeId/periodId 형식 시 400 에러

### 시나리오 7: 최종평가 전체 워크플로우

**목적**: 최종평가의 전체 생명주기를 검증

**검증 사항**:
- 저장 → 확정 → 확정 취소 → 재확정 → 조회
- 각 단계의 상태 변화 확인
- 확정 취소 후 수정 가능 여부 확인
- 재확정 후 최종 상태 확인

### 시나리오 8: 에러 처리

**목적**: 잘못된 입력이나 상태에서 적절한 에러를 반환하는지 검증

**검증 사항**:
- 잘못된 UUID 형식 → 400 에러
- 필수 필드 누락 → 400 에러
- 존재하지 않는 리소스 → 404 에러
- 이미 확정된 평가 재확정 → 409 에러
- 확정되지 않은 평가 확정 취소 → 422 에러

## 테스트 데이터 요구사항

### 전제 조건

1. **평가기간**: 진행 중(in-progress) 상태의 평가기간 1개
2. **직원**: 5명 이상
3. **인증**: Bearer 토큰을 통한 관리자 권한

### 시드 데이터 설정

```typescript
const seedResult = await seedDataScenario.시드_데이터를_생성한다({
  scenario: 'minimal',
  clearExisting: true,
  projectCount: 0,
  wbsPerProject: 0,
  departmentCount: 1,
  employeeCount: 5,
});

employeeIds = seedResult.employeeIds || [];

// 평가기간 생성 및 시작
const today = new Date();
const nextMonth = new Date(today);
nextMonth.setMonth(today.getMonth() + 1);

const createPeriodResponse = await testSuite
  .request()
  .post('/admin/evaluation-periods')
  .send({
    name: '최종평가 시나리오 테스트용 평가기간',
    startDate: today.toISOString(),
    finalEvaluationDeadline: nextMonth.toISOString(),
    description: '최종평가 E2E 테스트용 평가기간',
    maxSelfEvaluationRate: 120,
    gradeRanges: [],
  })
  .expect(201);

evaluationPeriodId = createPeriodResponse.body.id;
await evaluationPeriodScenario.평가기간을_시작한다(evaluationPeriodId);
```

## 참고 사항

### JobGrade (직무등급)

- `T1`: 전문가 1등급
- `T2`: 전문가 2등급
- `T3`: 전문가 3등급
- `T4`: 전문가 4등급
- `T5`: 전문가 5등급
- `T6`: 전문가 6등급
- `T7`: 전문가 7등급
- `TL1`: 리더 1등급
- `TL2`: 리더 2등급
- `TL3`: 리더 3등급
- `TL4`: 리더 4등급

### JobDetailedGrade (직무 상세등급)

- `N`: Normal (보통)
- `P`: Plus (우수)
- `S`: Star (최우수)

### 평가등급 예시

- `S`: 최우수
- `A`: 우수
- `B`: 보통
- `C`: 미흡
- `D`: 매우 미흡

## 실행 방법

```bash
# 전체 최종평가 테스트 실행
npm run test:e2e -- test/usecase/scenarios/performance-evaluation/final-evaluation/final-evaluation.e2e-spec.ts

# 특정 시나리오만 실행
npm run test:e2e -- test/usecase/scenarios/performance-evaluation/final-evaluation/final-evaluation.e2e-spec.ts -t "최종평가 저장"
```

