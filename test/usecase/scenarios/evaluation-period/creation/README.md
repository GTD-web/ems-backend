# 평가기간 생성 시나리오

## 개요
평가기간 생성과 관련된 모든 시나리오를 다룹니다.

## 시나리오 목록

### 1. 기본 평가기간 생성
- **엔드포인트**: `POST /admin/evaluation-periods`
- **설명**: 새로운 평가기간을 생성합니다.
- **검증 항목**:
  - 평가기간이 성공적으로 생성되는지 확인
  - 기본 상태가 `waiting`인지 확인
  - 수동 설정이 모두 `false`로 초기화되는지 확인

### 2. 평가기간 목록 조회
- **엔드포인트**: `GET /admin/evaluation-periods`
- **설명**: 생성된 평가기간 목록을 조회합니다.
- **검증 항목**:
  - 생성된 평가기간이 목록에 포함되는지 확인
  - 페이지네이션 동작 확인

### 3. 대시보드 조회 검증
- **엔드포인트**: `GET /admin/dashboard/{evaluationPeriodId}/employees/status`
- **설명**: 생성된 평가기간의 대시보드 상태를 확인합니다.
- **검증 항목**:
  - `evaluationPeriod.currentPhase`가 `waiting`인지 확인
  - `evaluationPeriod.manualSettings.criteriaSettingEnabled`가 `false`인지 확인
  - `evaluationPeriod.manualSettings.selfEvaluationSettingEnabled`가 `false`인지 확인
  - `evaluationPeriod.manualSettings.finalEvaluationSettingEnabled`가 `false`인지 확인

## 테스트 파일
- `evaluation-period-creation.e2e-spec.ts`

## 실행 방법
```bash
# 평가기간 생성 시나리오만 실행
npm run test:e2e -- test/usecase/scenarios/evaluation-period/creation/evaluation-period-creation.e2e-spec.ts
```

## 주의사항
- 평가기간 생성 시 필수 필드 검증
- 중복 생성 방지 로직 확인
- 기본값 설정 검증
