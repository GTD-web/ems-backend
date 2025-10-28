# Usecase E2E 테스트 작성 가이드

## 🎯 핵심 원칙

**Usecase 테스트는 오직 HTTP 엔드포인트를 통해서만 데이터를 조작하고 조회해야 합니다.**

## ✅ 올바른 접근 방식

### 1. HTTP 요청을 통한 데이터 조작
```typescript
// ✅ 좋은 예: HTTP 엔드포인트를 통한 데이터 생성
const response = await this.testSuite
  .request()
  .post('/admin/performance-evaluation/wbs-self-evaluations/employee/123/wbs/456/period/789')
  .send({
    selfEvaluationContent: '자기평가 내용',
    selfEvaluationScore: 100,
    performanceResult: '성과 결과'
  })
  .expect(200);

const evaluationId = response.body.id;
```

### 2. HTTP 요청을 통한 데이터 조회
```typescript
// ✅ 좋은 예: HTTP 엔드포인트를 통한 데이터 조회
const response = await this.testSuite
  .request()
  .get('/admin/performance-evaluation/wbs-self-evaluations/employee/123')
  .query({ periodId: '789', page: 1, limit: 10 })
  .expect(200);

const evaluations = response.body.evaluations;
```

### 3. 이전 테스트 결과를 다음 테스트에 활용
```typescript
// ✅ 좋은 예: 이전 테스트의 결과를 다음 테스트에서 사용
it('자기평가를 저장한다', async () => {
  const 저장결과 = await selfEvaluationScenario.WBS자기평가를_저장한다({
    employeeId: employeeIds[0],
    wbsItemId: wbsItemIds[0],
    periodId: evaluationPeriodId,
    selfEvaluationContent: '자기평가 내용',
  });
  
  expect(저장결과.id).toBeDefined();
  // 다음 테스트에서 사용할 수 있도록 결과 저장
  this.lastEvaluationId = 저장결과.id;
});

it('저장된 자기평가를 제출한다', async () => {
  // 이전 테스트의 결과를 활용
  const 제출결과 = await selfEvaluationScenario.WBS자기평가를_제출한다(
    this.lastEvaluationId
  );
  
  expect(제출결과.isCompleted).toBe(true);
});
```

## ❌ 잘못된 접근 방식

### 1. 직접 데이터베이스 조작
```typescript
// ❌ 나쁜 예: 직접 데이터베이스에 접근
const evaluation = await dataSource
  .getRepository(WbsSelfEvaluation)
  .save({
    employeeId: '123',
    wbsItemId: '456',
    periodId: '789',
    selfEvaluationContent: '자기평가 내용'
  });
```

### 2. 서비스 레이어 직접 호출
```typescript
// ❌ 나쁜 예: 서비스 메서드 직접 호출
const evaluation = await performanceEvaluationService
  .WBS자기평가를_저장한다(
    '789', '123', '456', '자기평가 내용', 100, '성과 결과', 'user123'
  );
```

### 3. 내부 상태 직접 조작
```typescript
// ❌ 나쁜 예: 내부 상태나 캐시 직접 조작
testSuite.app.get(SomeService).setSomeState('value');
```

## 📋 시나리오 작성 패턴

### 1. 시나리오 클래스 구조 (단일 클래스)
```typescript
export class SelfEvaluationScenario {
  constructor(private readonly testSuite: BaseE2ETest) {}

  // 개별 기능 메서드들
  async WBS자기평가를_저장한다(config: {...}): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(`/admin/performance-evaluation/wbs-self-evaluations/...`)
      .send(requestBody)
      .expect(200);
    
    return response.body;
  }

  // 복합 시나리오 메서드들
  async 자기평가_전체_시나리오를_실행한다(config: {...}): Promise<{
    저장결과: any;
    제출결과: any;
    조회결과: any;
  }> {
    // 1단계: 저장
    const 저장결과 = await this.WBS자기평가를_저장한다(config);
    
    // 2단계: 제출
    const 제출결과 = await this.WBS자기평가를_제출한다(저장결과.id);
    
    // 3단계: 조회
    const 조회결과 = await this.WBS자기평가_상세정보를_조회한다(저장결과.id);
    
    return { 저장결과, 제출결과, 조회결과 };
  }
}
```

### 2. 시나리오 클래스 구조 (분리된 구조) - 권장
복잡한 기능의 경우 기능별로 클래스를 분리하여 관리합니다.

#### 2-1. 기본 기능 클래스
```typescript
// base-{feature}.scenario.ts
export class BaseFeatureScenario {
  protected apiClient: FeatureApiClient;
  protected testSuite: BaseE2ETest;

  constructor(testSuite: BaseE2ETest) {
    this.testSuite = testSuite;
    this.apiClient = new FeatureApiClient(testSuite);
  }

  // 공통 기능들
  async 공통기능을_실행한다(config: {...}): Promise<any> {
    // HTTP 엔드포인트 호출
  }
}
```

#### 2-2. 특화 기능 클래스들
```typescript
// primary-{feature}.scenario.ts
export class PrimaryFeatureScenario extends BaseFeatureScenario {
  // 1차/주요 기능에 특화된 메서드들
  async 주요기능을_실행한다(config: {...}): Promise<any> {
    return this.apiClient.primaryAction(config);
  }
}

// secondary-{feature}.scenario.ts  
export class SecondaryFeatureScenario extends BaseFeatureScenario {
  // 2차/부가 기능에 특화된 메서드들
  async 부가기능을_실행한다(config: {...}): Promise<any> {
    return this.apiClient.secondaryAction(config);
  }
}
```

#### 2-3. 복합 시나리오 클래스
```typescript
// complex-{feature}.scenario.ts
export class ComplexFeatureScenario {
  private baseScenario: BaseFeatureScenario;
  private primaryScenario: PrimaryFeatureScenario;
  private secondaryScenario: SecondaryFeatureScenario;

  constructor(testSuite: BaseE2ETest) {
    this.baseScenario = new BaseFeatureScenario(testSuite);
    this.primaryScenario = new PrimaryFeatureScenario(testSuite);
    this.secondaryScenario = new SecondaryFeatureScenario(testSuite);
  }

  // 복합 워크플로우 메서드들
  async 전체_시나리오를_실행한다(config: {...}): Promise<any> {
    const 주요결과 = await this.primaryScenario.주요기능을_실행한다(config);
    const 부가결과 = await this.secondaryScenario.부가기능을_실행한다(config);
    
    return { 주요결과, 부가결과 };
  }
}
```

#### 2-4. 메인 시나리오 클래스 (Facade 패턴)
```typescript
// {feature}.scenario.ts (메인)
export class FeatureScenario {
  private baseScenario: BaseFeatureScenario;
  private primaryScenario: PrimaryFeatureScenario;
  private secondaryScenario: SecondaryFeatureScenario;
  private complexScenario: ComplexFeatureScenario;

  constructor(testSuite: BaseE2ETest) {
    this.baseScenario = new BaseFeatureScenario(testSuite);
    this.primaryScenario = new PrimaryFeatureScenario(testSuite);
    this.secondaryScenario = new SecondaryFeatureScenario(testSuite);
    this.complexScenario = new ComplexFeatureScenario(testSuite);
  }

  // 모든 기능을 위임하는 메서드들
  async 기본기능을_실행한다(config: {...}): Promise<any> {
    return this.baseScenario.공통기능을_실행한다(config);
  }

  async 주요기능을_실행한다(config: {...}): Promise<any> {
    return this.primaryScenario.주요기능을_실행한다(config);
  }

  async 전체_시나리오를_실행한다(config: {...}): Promise<any> {
    return this.complexScenario.전체_시나리오를_실행한다(config);
  }
}
```

### 3. 파일 구조 예시
```
test/usecase/scenarios/{feature}/
├── base-{feature}.scenario.ts          # 기본 공통 기능
├── primary-{feature}.scenario.ts       # 1차/주요 기능
├── secondary-{feature}.scenario.ts     # 2차/부가 기능
├── {feature}-dashboard.scenario.ts     # 대시보드 검증 기능
├── complex-{feature}.scenario.ts       # 복합 시나리오
├── {feature}.scenario.ts               # 메인 시나리오 (Facade)
└── index.ts                            # export 모음
```

### 4. 테스트 케이스 구조

#### 4-1. 단일 클래스 사용
```typescript
describe('자기평가 관리 시나리오', () => {
  let evaluationPeriodId: string;
  let employeeIds: string[];
  let wbsItemIds: string[];

  beforeAll(async () => {
    // 시드 데이터 생성 (HTTP 엔드포인트 사용)
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'with_period',
      clearExisting: false,
      projectCount: 2,
      wbsPerProject: 3,
    });

    evaluationPeriodId = seedResult.evaluationPeriodId!;
    employeeIds = seedResult.employeeIds!;
    wbsItemIds = seedResult.wbsItemIds!;
  });

  it('자기평가 전체 시나리오를 실행한다', async () => {
    const result = await selfEvaluationScenario.자기평가_전체_시나리오를_실행한다({
      employeeId: employeeIds[0],
      wbsItemId: wbsItemIds[0],
      periodId: evaluationPeriodId,
    });

    // 검증
    expect(result.저장결과.id).toBeDefined();
    expect(result.제출결과.isCompleted).toBe(true);
    expect(result.조회결과.id).toBe(result.저장결과.id);
  });
});
```

#### 4-2. 분리된 클래스 사용 (권장)
```typescript
describe('하향평가 관리 시나리오', () => {
  let testSuite: BaseE2ETest;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let downwardEvaluationScenario: DownwardEvaluationScenario; // 메인 시나리오

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let wbsItemIds: string[];
  let projectIds: string[];
  let evaluatorId: string;
  let evaluateeId: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    downwardEvaluationScenario = new DownwardEvaluationScenario(testSuite); // Facade 패턴

    // 시드 데이터 생성
    const { seedResponse } = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 2,
      wbsPerProject: 3,
      departmentCount: 1,
      employeeCount: 5,
    });

    employeeIds = seedResponse.results[0].generatedIds?.employeeIds || [];
    projectIds = seedResponse.results[0].generatedIds?.projectIds || [];
    
    // 평가기간 생성
    const createPeriodResponse = await testSuite
      .request()
      .post('/admin/evaluation-periods')
      .send({...})
      .expect(201);
    
    evaluationPeriodId = createPeriodResponse.body.id;
  });

  afterAll(async () => {
    // 정리 작업
    await evaluationPeriodScenario.평가기간을_삭제한다(evaluationPeriodId);
    await seedDataScenario.시드_데이터를_삭제한다();
    await testSuite.closeApp();
  });

  it('하향평가 관리 전체 시나리오를 실행한다', async () => {
    // 메인 시나리오 클래스 사용 (내부적으로 분리된 클래스들 조합)
    const result = await downwardEvaluationScenario.하향평가_관리_전체_시나리오를_실행한다({
      evaluationPeriodId,
      employeeIds,
      projectIds,
      wbsItemIds,
      evaluatorId,
      evaluateeId,
    });

    // 검증
    expect(result.일차하향평가결과.하향평가저장.id).toBeDefined();
    expect(result.이차하향평가결과.하향평가저장.id).toBeDefined();
    expect(result.평가자별목록조회.evaluations.length).toBeGreaterThan(0);
  });

  it('1차 하향평가 저장 시나리오를 실행한다', async () => {
    const result = await downwardEvaluationScenario.다른_피평가자로_일차하향평가_저장_시나리오를_실행한다({
      evaluationPeriodId,
      employeeIds,
      wbsItemIds,
      projectIds,
      evaluatorId,
      excludeEmployeeIds: [evaluateeId, evaluatorId],
    });

    if (result.저장결과) {
      expect(result.저장결과.id).toBeDefined();
      expect(result.저장결과.evaluatorId).toBe(evaluatorId);
    }
  });
});
```

## 🔧 주요 API 엔드포인트

### 자기평가 관리
| 기능 | HTTP 메서드 | 엔드포인트 | 설명 |
|------|-------------|------------|------|
| **자기평가 저장** | `POST` | `/admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/wbs/{wbsItemId}/period/{periodId}` | Upsert 방식 저장 |
| **자기평가 제출** | `PATCH` | `/admin/performance-evaluation/wbs-self-evaluations/{id}/submit` | 단일 제출 |
| **전체 제출** | `PATCH` | `/admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/period/{periodId}/submit-all` | 직원 전체 제출 |
| **프로젝트별 제출** | `PATCH` | `/admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}/period/{periodId}/project/{projectId}/submit` | 프로젝트별 제출 |
| **자기평가 조회** | `GET` | `/admin/performance-evaluation/wbs-self-evaluations/employee/{employeeId}` | 목록 조회 |
| **상세 조회** | `GET` | `/admin/performance-evaluation/wbs-self-evaluations/{id}` | 상세 조회 |
| **내용 초기화** | `PATCH` | `/admin/performance-evaluation/wbs-self-evaluations/{id}/clear` | 내용 초기화 |

### 평가 수정 가능 상태 관리
| 기능 | HTTP 메서드 | 엔드포인트 | 설명 |
|------|-------------|------------|------|
| **상태 변경** | `PATCH` | `/admin/performance-evaluation/evaluation-editable-status/{mappingId}` | 수정 가능 상태 변경 |

## 🎯 테스트 작성 체크리스트

### ✅ 필수 사항
- [ ] 모든 데이터 조작이 HTTP 엔드포인트를 통해 이루어지는가?
- [ ] 모든 데이터 조회가 HTTP 엔드포인트를 통해 이루어지는가?
- [ ] 이전 테스트의 결과가 다음 테스트에서 활용되는가?
- [ ] 시나리오가 실제 사용자 워크플로우를 반영하는가?
- [ ] 각 테스트가 독립적으로 실행 가능한가?

### ✅ 권장 사항
- [ ] 시나리오 메서드명이 한글로 직관적인가?
- [ ] 복합 시나리오가 단계별로 나뉘어 있는가?
- [ ] 에러 케이스도 포함되어 있는가?
- [ ] 응답 데이터의 검증이 충분한가?
- [ ] 테스트 데이터 정리가 적절히 이루어지는가?

### ✅ 분리된 구조 사용 시 체크리스트
- [ ] 파일 크기가 500줄을 초과하는가? (초과 시 분리 고려)
- [ ] 기능별로 명확히 구분되는 역할이 있는가?
- [ ] 공통 기능은 Base 클래스에 있는가?
- [ ] 특화 기능은 Primary/Secondary 클래스에 있는가?
- [ ] 복합 워크플로우는 Complex 클래스에 있는가?
- [ ] 메인 클래스가 Facade 패턴으로 모든 기능을 위임하는가?
- [ ] 각 클래스가 단일 책임 원칙을 따르는가?
- [ ] 클래스 간 의존성이 명확하고 순환 참조가 없는가?
- [ ] 테스트에서 메인 클래스만 사용하여 기존 API를 유지하는가?

## 🚀 실행 방법

```bash
# 전체 usecase 테스트 실행
npm run test:e2e -- test/usecase/evaluation-process.e2e-spec.ts

# 자기평가 시나리오만 실행
npm run test:e2e -- test/usecase/evaluation-process.e2e-spec.ts -t "자기평가 관리 시나리오"

# 특정 테스트만 실행
npm run test:e2e -- test/usecase/evaluation-process.e2e-spec.ts -t "자기평가 전체 시나리오를 실행한다"
```

## 💡 팁과 주의사항

### 1. 데이터 의존성 관리
- 이전 테스트에서 생성된 데이터를 다음 테스트에서 활용
- `beforeAll`에서 공통 데이터 설정
- 테스트 간 데이터 격리 보장

### 2. 에러 처리
- HTTP 상태 코드 검증 (`expect(200)`, `expect(400)` 등)
- 응답 데이터 구조 검증
- 예외 상황 테스트 포함

### 3. 성능 고려사항
- 불필요한 HTTP 요청 최소화
- 병렬 처리 가능한 요청은 `Promise.all` 사용
- 테스트 데이터 크기 적절히 조절

### 4. 유지보수성
- 시나리오 메서드는 재사용 가능하도록 설계
- 설정값은 상수로 분리
- 복잡한 로직은 별도 메서드로 분리

### 5. 분리된 구조 사용 시 주의사항
- **파일 크기 기준**: 500줄 이상이면 분리 고려
- **기능별 분리**: 명확한 역할 구분이 있을 때만 분리
- **의존성 관리**: Base → Primary/Secondary → Complex → Main 순서로 의존성 구성
- **API 일관성**: 메인 클래스에서 기존 API를 그대로 유지
- **테스트 영향도**: 분리해도 기존 테스트가 그대로 작동해야 함
- **네이밍 규칙**: `{feature}.scenario.ts` (메인), `base-{feature}.scenario.ts` (기본) 등 일관된 명명

### 6. 분리 시 고려사항
- **언제 분리할까?**
  - 파일이 500줄을 초과할 때
  - 기능별로 명확히 구분되는 역할이 있을 때
  - 여러 개발자가 동시에 작업할 때
  - 특정 기능만 독립적으로 테스트하고 싶을 때

- **분리하지 말아야 할 경우**
  - 단순한 CRUD 기능만 있는 경우
  - 파일 크기가 작은 경우 (200줄 미만)
  - 기능 간 강한 결합이 있는 경우

---

**이 가이드를 따라 작성하면 실제 사용자 시나리오를 정확히 반영하는 E2E 테스트를 만들 수 있습니다.**
