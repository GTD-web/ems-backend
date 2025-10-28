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

### 1. 시나리오 클래스 구조
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

### 2. 테스트 케이스 구조
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

---

**이 가이드를 따라 작성하면 실제 사용자 시나리오를 정확히 반영하는 E2E 테스트를 만들 수 있습니다.**
