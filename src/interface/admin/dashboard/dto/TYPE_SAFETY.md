# DTO 타입 안전성 가이드

## 개요

이 문서는 Interface 레이어의 DTO와 Context 레이어의 반환 타입 간의 타입 일치성을 보장하는 방법을 설명합니다.

## 문제점

기존에는 **Context 레이어의 반환 타입**과 **Interface 레이어의 DTO**가 별도로 정의되어 있어, 구조가 변경될 때 동기화 문제가 발생할 수 있었습니다.

```typescript
// ❌ 문제 상황: 독립적인 타입 정의
// Context (types.ts)
export interface EmployeeAssignedDataResult {
  evaluationPeriod: EvaluationPeriodInfo;
  employee: EmployeeInfo;
  projects: AssignedProjectWithWbs[];
}

// Interface (dto.ts)
export class EmployeeAssignedDataResponseDto {
  // 별도로 정의됨 - 동기화 문제 발생 가능
  evaluationPeriod: EvaluationPeriodInfoDto;
  employee: EmployeeInfoDto;
  projects: AssignedProjectWithWbsDto[];
}
```

## 해결 방법: DTO가 Interface를 implements

DTO 클래스가 Context의 interface를 구현하도록 하여 **컴파일 타임**에 타입 호환성을 보장합니다.

```typescript
// ✅ 해결: DTO가 Context 타입을 implements
import type {
  EvaluationPeriodInfo,
  EmployeeInfo,
  AssignedProjectWithWbs,
  EmployeeAssignedDataResult,
} from '@context/dashboard-context/handlers/queries/get-employee-assigned-data/types';

export class EvaluationPeriodInfoDto implements EvaluationPeriodInfo {
  @ApiProperty({ description: '평가기간 ID' })
  id: string;

  @ApiProperty({ description: '평가기간명' })
  name: string;

  // ... 나머지 필드
}

export class EmployeeAssignedDataResponseDto
  implements EmployeeAssignedDataResult
{
  @ApiProperty({ type: EvaluationPeriodInfoDto })
  evaluationPeriod: EvaluationPeriodInfoDto;

  @ApiProperty({ type: EmployeeInfoDto })
  employee: EmployeeInfoDto;

  @ApiProperty({ type: [AssignedProjectWithWbsDto] })
  projects: AssignedProjectWithWbsDto[];

  // ... summary 필드
}
```

## 장점

### 1. 컴파일 타임 타입 체크 ✅

DTO의 구조가 Context의 interface와 일치하지 않으면 **TypeScript 컴파일 에러**가 발생합니다.

```typescript
// Context에서 새 필드 추가
export interface EvaluationPeriodInfo {
  id: string;
  name: string;
  maxSelfEvaluationRate: number; // 새 필드 추가!
}

// DTO에서 해당 필드를 추가하지 않으면 컴파일 에러 발생
export class EvaluationPeriodInfoDto implements EvaluationPeriodInfo {
  // ❌ 에러: Property 'maxSelfEvaluationRate' is missing
  id: string;
  name: string;
}
```

### 2. 자동 문서화 동기화 📚

Context의 타입이 변경되면 DTO도 반드시 변경해야 하므로, Swagger 문서도 자동으로 최신 상태로 유지됩니다.

### 3. 리팩토링 안전성 🔒

필드명 변경, 타입 변경 등의 리팩토링 시 모든 관련 DTO에서 에러가 발생하여 누락을 방지합니다.

### 4. IDE 지원 강화 💡

IDE의 자동 완성, 타입 힌트, 리팩토링 도구가 정확하게 동작합니다.

## 적용된 DTO 목록

다음 DTO들이 Context의 타입을 implements 하고 있습니다:

- `EvaluationPeriodInfoDto` implements `EvaluationPeriodInfo`
- `EmployeeInfoDto` implements `EmployeeInfo`
- `WbsEvaluationCriterionDto` implements `WbsEvaluationCriterion`
- `WbsPerformanceDto` implements `WbsPerformance`
- `WbsSelfEvaluationDto` implements `WbsSelfEvaluationInfo`
- `WbsDownwardEvaluationDto` implements `WbsDownwardEvaluationInfo`
- `AssignedWbsInfoDto` implements `AssignedWbsInfo`
- `AssignedProjectWithWbsDto` implements `AssignedProjectWithWbs`
- `EmployeeAssignedDataResponseDto` implements `EmployeeAssignedDataResult`

## 작업 흐름

### Context 타입 수정 시

1. **Context의 interface 수정** (`types.ts`)

   ```typescript
   export interface EvaluationPeriodInfo {
     id: string;
     name: string;
     maxSelfEvaluationRate: number; // 새 필드 추가
   }
   ```

2. **컴파일 에러 확인**
   - TypeScript가 자동으로 DTO에서 누락된 필드를 알려줌

3. **DTO 수정** (`dto.ts`)

   ```typescript
   export class EvaluationPeriodInfoDto implements EvaluationPeriodInfo {
     // ...
     @ApiProperty({ description: '자기평가 달성률 최대값 (%)' })
     maxSelfEvaluationRate: number; // 필드 추가
   }
   ```

4. **Swagger 문서 확인**
   - 새로운 필드가 자동으로 API 문서에 반영됨

### 새로운 DTO 추가 시

1. **Context에서 interface 정의**

   ```typescript
   export interface NewDataType {
     field1: string;
     field2: number;
   }
   ```

2. **DTO 클래스 작성 시 implements 사용**

   ```typescript
   import type { NewDataType } from '@context/.../types';

   export class NewDataDto implements NewDataType {
     @ApiProperty()
     field1: string;

     @ApiProperty()
     field2: number;
   }
   ```

## 주의사항

### 1. DTO는 class, Context 타입은 interface

- **DTO**: `class` - Swagger 데코레이터 필요, 런타임에 존재
- **Context**: `interface` - 컴파일 타임만 존재, 런타임에는 사라짐

```typescript
// ✅ 올바름
export class MyDto implements MyInterface { ... }

// ❌ 잘못됨
export interface MyDto extends MyInterface { ... }  // Swagger 데코레이터 사용 불가
```

### 2. Optional 필드 일치

Context의 optional 필드(`?`)와 DTO의 optional 필드가 일치해야 합니다.

```typescript
// Context
export interface Example {
  required: string;
  optional?: string; // optional
}

// DTO
export class ExampleDto implements Example {
  @ApiProperty()
  required: string;

  @ApiPropertyOptional() // ✅ @ApiPropertyOptional 사용
  optional?: string; // ✅ ? 추가
}
```

### 3. Type과 Decorators

`class-transformer`의 `@Type()` 데코레이터는 interface에 영향을 주지 않으므로 자유롭게 사용 가능합니다.

```typescript
export class ParentDto implements ParentInterface {
  @ApiProperty({ type: [ChildDto] })
  @Type(() => ChildDto) // ✅ OK - 변환용 데코레이터
  children: ChildDto[];
}
```

## 테스트

타입 호환성은 TypeScript 컴파일러가 자동으로 검증합니다.

```bash
# 타입 체크
npm run build

# 또는
npx tsc --noEmit
```

컴파일 에러 없이 통과하면 모든 DTO가 Context 타입과 일치한다는 의미입니다.

## 참고

- Context 타입 정의: `src/context/dashboard-context/handlers/queries/get-employee-assigned-data/types.ts`
- DTO 정의: `src/interface/admin/dashboard/dto/employee-assigned-data.dto.ts`
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/2/classes.html#implements-clauses

---

**작성일**: 2025-01-23  
**최종 수정일**: 2025-01-23
