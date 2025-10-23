# WBS 가중치 계산 문제

## 📌 이슈 요약

시드 데이터 생성 시 WBS 할당의 가중치(weight)가 0으로 나오는 문제

## 🔍 문제 상세

### 증상

- `/admin/dashboard/{evaluationPeriodId}/employees/{employeeId}/assigned-data` API 호출 시 모든 WBS의 가중치가 0으로 반환됨
- 시드 데이터 생성 후 DB의 `evaluation_wbs_assignment` 테이블의 `weight` 컬럼이 모두 0

### 기대 동작

- Phase4에서 WBS 평가기준 생성 후 가중치가 자동으로 계산되어야 함
- 각 직원의 WBS 할당에 대해 평가기준 중요도에 따라 가중치가 분배되어야 함
- 한 직원-평가기간 조합의 모든 WBS 가중치 합계는 100이어야 함

## 🔧 시도한 해결 방법

### 1. Phase4 평가기준 생성 개선 ✅

- **변경 전**: WBS당 평가기준 1개만 생성
- **변경 후**: config 설정에 따라 2~5개 생성
- **파일**: `src/context/seed-data-context/generators/phase4-evaluation-criteria.generator.ts`

### 2. 실제 할당된 WBS만 평가기준 생성 ✅

- **변경**: Phase3에서 실제 할당된 WBS ID만 조회하여 평가기준 생성
- **파일**: `src/context/seed-data-context/generators/phase4-evaluation-criteria.generator.ts`

```typescript
const assignedWbsIds = await this.실제_할당된_WBS_ID를_조회한다(periodIds[0]);
```

### 3. 가중치 계산 로직 개선 ✅

- **변경 전**: 같은 WBS의 여러 평가기준 중 마지막 것만 사용
- **변경 후**: 모든 평가기준의 중요도 합계 사용
- **파일**: `src/context/evaluation-criteria-management-context/services/wbs-assignment-weight-calculation.service.ts`

```typescript
criteriaList.forEach((criteria) => {
  const currentImportance = importanceMap.get(criteria.wbsItemId) || 0;
  importanceMap.set(
    criteria.wbsItemId,
    currentImportance + criteria.importance,
  );
});
```

### 4. 가중치 저장 방식 개선 ✅

- **변경 전**: `repository.save(assignments)`
- **변경 후**: QueryBuilder의 `update()` 사용
- **파일**: `src/context/evaluation-criteria-management-context/services/wbs-assignment-weight-calculation.service.ts`

```typescript
for (const assignment of assignments) {
  await repository
    .createQueryBuilder()
    .update()
    .set({ weight: assignment.weight })
    .where('id = :id', { id: assignment.id })
    .execute();
}
```

### 5. TypeORM decimal transformer 추가 ✅

- **변경**: weight 컬럼에 transformer 추가
- **파일**: `src/domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity.ts`

```typescript
@Column({
  type: 'decimal',
  precision: 5,
  scale: 2,
  transformer: {
    to: (value: number) => value,
    from: (value: string) => (value ? parseFloat(value) : 0),
  },
})
weight: number;
```

### 6. 디버깅 로그 추가 ✅

- Phase4 가중치 재계산 과정의 상세 로그 추가
- 샘플 WBS 할당 가중치 출력

## ❓ 추가 조사 필요 사항

### 1. Phase4 가중치 재계산 실행 여부 확인

```typescript
// src/context/seed-data-context/generators/phase4-evaluation-criteria.generator.ts:77
await this.WBS할당_가중치를_재계산한다(employeeIds, periodIds);
```

- 이 메서드가 실제로 호출되는가?
- 로그가 출력되는가?

### 2. 평가기준 생성 확인

- Phase4에서 생성된 평가기준이 DB에 저장되는가?
- `WbsEvaluationCriteria` 테이블에 데이터가 있는가?
- 중요도(importance) 값이 제대로 설정되어 있는가?

### 3. QueryBuilder update 실행 확인

- update 쿼리가 실제로 실행되는가?
- execute() 결과를 확인해야 하는가?
- 트랜잭션 문제는 없는가?

### 4. Phase 실행 순서 확인

- Phase4 이후에 다른 Phase에서 weight를 초기화하는가?
- Phase7에서 WBS 할당을 다시 저장하는가?

### 5. Entity Manager vs Repository

- manager를 사용해야 하는 경우가 있는가?
- 트랜잭션 컨텍스트가 올바른가?

## 🧪 재현 방법

### 1. 테스트 실행

```bash
npm run test:e2e:fast -- get-employee-assigned-data-with-seed.e2e-spec.ts
```

### 2. DB에서 직접 확인

```sql
-- WBS 할당 가중치 확인
SELECT id, "employeeId", "wbsItemId", weight
FROM evaluation_wbs_assignment
WHERE "deletedAt" IS NULL
ORDER BY "employeeId", "createdAt";

-- WBS 평가기준 확인
SELECT id, "wbsItemId", criteria, importance
FROM wbs_evaluation_criteria
WHERE "deletedAt" IS NULL
ORDER BY "wbsItemId";
```

## 💡 해결 방안 제안

### 방안 1: 로깅 레벨 높여서 추적

- LOG_LEVEL=log로 테스트 실행
- Phase4의 모든 단계에서 로그 출력
- DB 쿼리 로그 활성화

### 방안 2: 독립적인 단위 테스트 작성

- Phase4만 독립적으로 실행하는 테스트 작성
- 각 단계의 결과를 검증
- 가중치 재계산 서비스만 단독으로 테스트

### 방안 3: 수동으로 평가기준 생성 후 가중치 재계산 API 호출

- 시드 데이터 생성 후
- 수동으로 평가기준 추가
- 가중치 재계산 API 호출하여 동작 확인

### 방안 4: Phase4 이후에 명시적으로 가중치 검증

```typescript
// Phase4 완료 후 검증 추가
const sampleAssignments = await this.wbsAssignmentRepository.find({
  where: { deletedAt: null },
  take: 5,
});
this.logger.log(
  `샘플 가중치: ${sampleAssignments.map((a) => a.weight).join(', ')}`,
);
```

## ✅ 해결 완료

### 근본 원인

**대시보드 API에서 WBS 할당 조회 시 weight 컬럼을 SELECT하지 않고 하드코딩된 0을 사용**

```typescript
// 문제 코드 (project-wbs.utils.ts:202)
weight: 0, // weight 컬럼이 엔티티에 없으므로 기본값 0 사용
```

### 해결 방법

1. **SQL SELECT에 weight 컬럼 추가**

```typescript
'assignment.weight AS assignment_weight',
```

2. **DB에서 조회한 값 사용**

```typescript
weight: parseFloat(row.assignment_weight) || 0,
```

### 검증 완료

- ✅ Phase4에서 가중치가 제대로 계산되고 DB에 저장됨 (로그 확인)
- ✅ 대시보드 API에서 weight 값이 정상적으로 반환됨
- ✅ 모든 E2E 테스트 통과 (11/11 passed)

### 테스트 상태

- 모든 대시보드 관련 테스트 통과
- 가중치 계산 로직 정상 작동 확인
- DB 저장 및 조회 정상 작동 확인

## 🔗 관련 파일

- `src/context/seed-data-context/generators/phase4-evaluation-criteria.generator.ts`
- `src/context/evaluation-criteria-management-context/services/wbs-assignment-weight-calculation.service.ts`
- `src/domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity.ts`
- `test/interface/admin/dashboard/get-employee-assigned-data-with-seed.e2e-spec.ts`

## 📅 생성일

2024-01-XX

## 🏷️ 태그

#bug #seed-data #weight-calculation #wbs #phase4
