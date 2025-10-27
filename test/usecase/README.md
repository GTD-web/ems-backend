# Usecase E2E 테스트

전체 평가 프로세스를 실제 사용 시나리오로 검증하는 E2E 테스트입니다.

## 폴더 구조

```
test/usecase/
├── scenarios/                           # 재사용 가능한 시나리오 모듈
│   ├── seed-data.scenario.ts           # 시드 데이터 생성/관리
│   ├── query-operations.scenario.ts    # 조회 처리 시나리오
│   └── evaluation-target.scenario.ts   # 평가 대상 관리 시나리오
├── evaluation-process.e2e-spec.ts      # 메인 테스트 파일
└── README.md                            # 이 파일
```

## 시나리오 모듈

### 1. SeedDataScenario (`seed-data.scenario.ts`)

시드 데이터 생성 및 관리를 담당합니다.

**주요 메서드:**

- `시드_데이터를_생성한다(config)` - 설정에 따라 시드 데이터 생성
- `시드_데이터_상태를_확인한다()` - 생성된 데이터 상태 확인
- `시드_데이터를_삭제한다()` - 시드 데이터 삭제 및 확인

**사용 예시:**

```typescript
const seedDataScenario = new SeedDataScenario(testSuite);

const { evaluationPeriodId } = await seedDataScenario.시드_데이터를_생성한다({
  scenario: 'with_period',
  clearExisting: false,
  projectCount: 3,
  wbsPerProject: 5,
});
```

### 2. QueryOperationsScenario (`query-operations.scenario.ts`)

조회 관련 API 테스트를 담당합니다.

**주요 메서드:**

- `부서_하이라키를_조회한다()` - 부서 계층 구조 조회 및 검증
- `대시보드_직원_상태를_조회한다(periodId)` - 대시보드 직원 상태 조회
- `평가_대상_제외_포함을_테스트한다(periodId)` - 제외/포함 기능 검증
- `전체_조회_시나리오를_실행한다(periodId)` - 전체 조회 시나리오 통합 실행

**사용 예시:**

```typescript
const queryScenario = new QueryOperationsScenario(testSuite);

// 개별 시나리오 실행
const { totalDepartments } = await queryScenario.부서_하이라키를_조회한다();

// 통합 시나리오 실행
const result =
  await queryScenario.전체_조회_시나리오를_실행한다(evaluationPeriodId);
```

### 3. EvaluationTargetScenario (`evaluation-target.scenario.ts`)

평가 대상자 관리 기능을 담당합니다.

**주요 메서드:**

- `평가_대상자를_등록한다(periodId, employeeId)` - 단일 대상자 등록
- `평가_대상자를_대량_등록한다(periodId, employeeIds)` - 대량 대상자 등록
- `평가_대상자를_조회한다(periodId, includeExcluded)` - 대상자 목록 조회
- `제외된_평가_대상자를_조회한다(periodId)` - 제외된 대상자만 조회
- `평가_대상에서_제외한다(periodId, employeeId, reason)` - 대상자 제외
- `평가_대상에_포함한다(periodId, employeeId)` - 대상자 포함
- `대시보드에서_직원_상태를_조회한다(periodId)` - 대시보드 조회
- `평가_대상_제외_포함_시나리오를_실행한다(periodId)` - 전체 제외/포함 시나리오
- `여러_직원_제외_포함을_테스트한다(periodId, count)` - 다중 제외/포함 테스트

**사용 예시:**

```typescript
const targetScenario = new EvaluationTargetScenario(testSuite);

// 평가 대상 제외 및 대시보드 검증
await targetScenario.평가_대상에서_제외한다(
  evaluationPeriodId,
  employeeId,
  '퇴사 예정',
);

// 제외된 대상자 목록 확인
const excluded =
  await targetScenario.제외된_평가_대상자를_조회한다(evaluationPeriodId);

// 대시보드에서 제외 확인
const dashboard =
  await targetScenario.대시보드에서_직원_상태를_조회한다(evaluationPeriodId);
```

## 테스트 구조

### 메인 테스트: `evaluation-process.e2e-spec.ts`

전체 평가 프로세스를 하나의 통합 테스트와 개별 시나리오 테스트로 구성합니다.

```typescript
describe('평가 프로세스 전체 플로우 (E2E)', () => {
  // 1. 통합 테스트
  it('전체 평가 프로세스를 실행한다', async () => {
    // 시드 데이터 생성 → 조회 시나리오 → 정리
  });

  // 2. 분리된 시나리오 테스트
  describe('조회 처리 시나리오 (분리 테스트)', () => {
    it('부서 하이라키를 조회한다', async () => { ... });
    it('대시보드 직원 상태를 조회한다', async () => { ... });
    it('평가 대상 제외 후 대시보드에서 필터링된다', async () => { ... });
  });
});
```

## 테스트 실행 결과

```
PASS test/usecase/evaluation-process.e2e-spec.ts (7.872 s)
  평가 프로세스 전체 플로우 (E2E)
    ✓ 전체 평가 프로세스를 실행한다 (518 ms)
    조회 처리 시나리오 (분리 테스트)
      ✓ 부서 하이라키를 조회한다 (12 ms)
      ✓ 대시보드 직원 상태를 조회한다 (45 ms)
      ✓ 평가 대상 제외 후 대시보드에서 필터링된다 (146 ms)
    평가 대상 관리 시나리오 (분리 테스트)
      ✓ 평가 대상을 제외하고 대시보드에서 필터링된다 (155 ms)
      ✓ 여러 직원을 제외/포함하고 대시보드에 반영된다 (172 ms)
      ✓ 제외된 대상자 목록을 조회한다 (75 ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Time:        8.082 s
```

### 평가 대상 제외/포함 시나리오 실행 로그

```
📝 테스트 대상 직원: 김철수 (uuid...)
📊 제외 전 대시보드 직원 수: 3명
✅ 평가 대상 제외 완료
✅ 제외된 대상자 목록에 포함됨 확인
✅ 대시보드에서 제외 확인 (3명 → 2명)
✅ 평가 대상 포함 완료
✅ 제외된 대상자 목록에서 제거됨 확인
✅ 대시보드에서 복원 확인 (2명 → 3명)
```

## 장점

### 1. 재사용성

- 시나리오 클래스로 분리하여 다른 테스트에서도 재사용 가능
- 중복 코드 제거

### 2. 가독성

- 각 시나리오가 독립적인 파일로 분리되어 이해하기 쉬움
- 한글 메서드명으로 직관적인 코드

### 3. 유지보수성

- 각 시나리오 별로 독립적 수정 가능
- 새로운 시나리오 추가가 용이

### 4. 테스트 격리

- 통합 테스트와 개별 시나리오 테스트 분리
- 원하는 시나리오만 독립적으로 테스트 가능

## 새로운 시나리오 추가하기

1. `scenarios/` 폴더에 새 시나리오 파일 생성

```typescript
// scenarios/new-feature.scenario.ts
export class NewFeatureScenario {
  constructor(private readonly testSuite: BaseE2ETest) {}

  async 새로운_기능을_테스트한다() {
    // 테스트 로직
  }
}
```

2. 메인 테스트 파일에서 import 및 사용

```typescript
import { NewFeatureScenario } from './scenarios/new-feature.scenario';

// beforeAll에서 인스턴스 생성
const newFeatureScenario = new NewFeatureScenario(testSuite);

// 테스트에서 사용
await newFeatureScenario.새로운_기능을_테스트한다();
```

## 실행 방법

```bash
# 전체 usecase 테스트 실행
npm run test:e2e -- test/usecase/evaluation-process.e2e-spec.ts

# 특정 시나리오만 실행 (describe 이름 사용)
npm run test:e2e -- test/usecase/evaluation-process.e2e-spec.ts -t "조회 처리 시나리오"

# 특정 테스트만 실행 (it 이름 사용)
npm run test:e2e -- test/usecase/evaluation-process.e2e-spec.ts -t "부서 하이라키를 조회한다"
```

## 검증 항목

### 평가 대상 제외/포함 시나리오

1. **제외 처리 검증**
   - ✅ `/admin/evaluation-periods/{periodId}/targets/{employeeId}/exclude` 엔드포인트 작동
   - ✅ `isExcluded`, `excludeReason`, `excludedBy`, `excludedAt` 필드 정상 저장
2. **제외 후 대시보드 필터링**
   - ✅ `/admin/dashboard/{periodId}/employees/status`에서 제외된 직원 미노출
   - ✅ 직원 수 감소 확인 (예: 3명 → 2명)

3. **제외된 대상자 목록 조회**
   - ✅ `/admin/evaluation-periods/{periodId}/targets/excluded`에서 제외된 직원만 조회
   - ✅ 모든 반환된 직원이 `isExcluded=true` 상태

4. **포함 처리 검증**
   - ✅ `/admin/evaluation-periods/{periodId}/targets/{employeeId}/include` 엔드포인트 작동
   - ✅ 제외 정보 초기화 (`excludeReason`, `excludedBy`, `excludedAt` → null)

5. **포함 후 대시보드 복원**
   - ✅ 대시보드에서 직원 재노출
   - ✅ 직원 수 복원 확인 (예: 2명 → 3명)

6. **다중 제외/포함**
   - ✅ 여러 직원 동시 제외 처리
   - ✅ 대시보드 반영 확인
   - ✅ 여러 직원 동시 포함 처리

## TODO: 향후 추가 예정

- `project-assignment.scenario.ts` - 프로젝트/WBS 배정 시나리오
- `evaluation-criteria.scenario.ts` - 평가 기준 설정 시나리오
- `evaluation-execution.scenario.ts` - 평가 진행 시나리오
- `final-evaluation.scenario.ts` - 최종 평가 조회 시나리오
