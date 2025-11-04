# 산출물(Deliverable) 관리 및 대시보드 제공 필드 분석

## 개요

이 문서는 산출물 관리 컨트롤러(`deliverable-management.controller.ts`)의 엔드포인트 처리 로직과 대시보드(`dashboard.controller.ts`)에서 제공되는 산출물 필드를 정리한 문서입니다.

## 1. 산출물 관리 컨트롤러 엔드포인트

### 1.1 엔드포인트 목록

`src/interface/admin/performance-evaluation/deliverable-management.controller.ts`에서 제공하는 엔드포인트:

#### 1.1.1 산출물 생성
- **엔드포인트**: `POST /admin/performance-evaluation/deliverables`
- **메서드**: `createDeliverable()`
- **처리 로직**:
  - `CreateDeliverableDto`를 받아 `PerformanceEvaluationService.산출물을_생성한다()` 호출
  - 생성된 산출물을 `DeliverableResponseDto`로 변환하여 반환
- **응답**: `DeliverableResponseDto`

#### 1.1.2 산출물 수정
- **엔드포인트**: `PUT /admin/performance-evaluation/deliverables/:id`
- **메서드**: `updateDeliverable()`
- **처리 로직**:
  - `@ParseUUID('id')`로 ID 검증
  - `UpdateDeliverableDto`를 받아 `PerformanceEvaluationService.산출물을_수정한다()` 호출
  - 수정된 산출물을 `DeliverableResponseDto`로 변환하여 반환
- **응답**: `DeliverableResponseDto`

#### 1.1.3 산출물 삭제
- **엔드포인트**: `DELETE /admin/performance-evaluation/deliverables/:id`
- **메서드**: `deleteDeliverable()`
- **처리 로직**:
  - `@ParseUUID('id')`로 ID 검증
  - `PerformanceEvaluationService.산출물을_삭제한다()` 호출
- **응답**: `void` (204 No Content)

#### 1.1.4 벌크 산출물 생성
- **엔드포인트**: `POST /admin/performance-evaluation/deliverables/bulk`
- **메서드**: `bulkCreateDeliverables()`
- **처리 로직**:
  - `BulkCreateDeliverablesDto`를 받아 여러 산출물을 한 번에 생성
  - `PerformanceEvaluationService.산출물을_벌크_생성한다()` 호출
  - 성공/실패 개수와 생성된 ID 목록 반환
- **응답**: `BulkCreateResultDto`

#### 1.1.5 벌크 산출물 삭제
- **엔드포인트**: `DELETE /admin/performance-evaluation/deliverables/bulk`
- **메서드**: `bulkDeleteDeliverables()`
- **처리 로직**:
  - `BulkDeleteDeliverablesDto`를 받아 여러 산출물을 한 번에 삭제
  - `PerformanceEvaluationService.산출물을_벌크_삭제한다()` 호출
  - 성공/실패 개수와 실패한 ID 목록 반환
- **응답**: `BulkDeleteResultDto`

#### 1.1.6 직원별 산출물 조회
- **엔드포인트**: `GET /admin/performance-evaluation/deliverables/employee/:employeeId`
- **메서드**: `getEmployeeDeliverables()`
- **처리 로직**:
  - `@ParseUUID('employeeId')`로 직원 ID 검증
  - `GetDeliverablesQueryDto`로 필터링 (기본값: `activeOnly=true`)
  - `PerformanceEvaluationService.직원별_산출물을_조회한다()` 호출
  - 산출물 목록을 `DeliverableListResponseDto`로 변환하여 반환
- **응답**: `DeliverableListResponseDto`

#### 1.1.7 WBS 항목별 산출물 조회
- **엔드포인트**: `GET /admin/performance-evaluation/deliverables/wbs/:wbsItemId`
- **메서드**: `getWbsDeliverables()`
- **처리 로직**:
  - `@ParseUUID('wbsItemId')`로 WBS 항목 ID 검증
  - `GetDeliverablesQueryDto`로 필터링 (기본값: `activeOnly=true`)
  - `PerformanceEvaluationService.WBS항목별_산출물을_조회한다()` 호출
  - 산출물 목록을 `DeliverableListResponseDto`로 변환하여 반환
- **응답**: `DeliverableListResponseDto`

#### 1.1.8 산출물 상세 조회
- **엔드포인트**: `GET /admin/performance-evaluation/deliverables/:id`
- **메서드**: `getDeliverableDetail()`
- **처리 로직**:
  - `@ParseUUID('id')`로 ID 검증
  - `PerformanceEvaluationService.산출물_상세를_조회한다()` 호출
  - 산출물을 `DeliverableResponseDto`로 변환하여 반환
- **응답**: `DeliverableResponseDto`

### 1.2 응답 DTO 필드 (DeliverableResponseDto)

산출물 관리 컨트롤러에서 제공하는 전체 필드:

```typescript
{
  id: string;                    // 산출물 ID
  name: string;                   // 산출물명
  description?: string;            // 산출물 설명
  type: DeliverableType;          // 산출물 유형 (document, code, design, report, presentation, other)
  filePath?: string;              // 파일 경로
  employeeId?: string;            // 직원 ID
  wbsItemId?: string;             // WBS 항목 ID
  mappedDate?: Date;              // 매핑일
  mappedBy?: string;             // 매핑자 ID
  isActive: boolean;              // 활성 상태
  createdAt: Date;                // 생성일시
  updatedAt: Date;                // 수정일시
  deletedAt?: Date;               // 삭제일시
  createdBy?: string;             // 생성자 ID
  updatedBy?: string;             // 수정자 ID
  version: number;                // 버전
}
```

## 2. 대시보드에서 제공되는 산출물 필드

### 2.1 대시보드 엔드포인트

대시보드 컨트롤러(`src/interface/admin/dashboard/dashboard.controller.ts`)에서 산출물을 제공하는 엔드포인트:

#### 2.1.1 사용자 할당 정보 조회
- **엔드포인트**: `GET /admin/dashboard/assigned-data/:evaluationPeriodId/:employeeId`
- **메서드**: `getEmployeeAssignedData()`
- **처리 로직**:
  - `DashboardService.사용자_할당_정보를_조회한다()` 호출
  - CQRS 패턴을 통해 `GetEmployeeAssignedDataQuery` 실행
  - 프로젝트별 WBS 목록에 산출물 정보가 포함됨

#### 2.1.2 내 할당 정보 조회
- **엔드포인트**: `GET /admin/dashboard/my-assigned-data/:evaluationPeriodId`
- **메서드**: `getMyAssignedData()`
- **처리 로직**:
  - 현재 로그인한 사용자의 할당 정보 조회
  - 하향평가 정보는 제거됨 (피평가자는 상위 평가자의 하향평가를 볼 수 없음)
  - 산출물 정보는 포함됨

#### 2.1.3 담당자의 피평가자 할당 정보 조회
- **엔드포인트**: `GET /admin/dashboard/evaluator-assigned-data/:evaluationPeriodId/:evaluatorId/:employeeId`
- **메서드**: `getEvaluatorAssignedEmployeesData()`
- **처리 로직**:
  - 평가자가 담당하는 피평가자의 할당 정보 조회
  - 산출물 정보 포함

### 2.2 대시보드 데이터 구조

대시보드에서 산출물은 다음 구조로 제공됩니다:

```
EmployeeAssignedDataResponseDto
  └── projects: AssignedProjectWithWbsDto[]
      └── wbsList: AssignedWbsInfoDto[]
          └── deliverables: DeliverableInfoDto[]  // ← 여기에 산출물 정보
```

### 2.3 대시보드 산출물 조회 로직

대시보드에서 산출물을 조회하는 로직은 `src/context/dashboard-context/handlers/queries/get-employee-assigned-data/project-wbs.utils.ts`에 구현되어 있습니다:

1. **조건**: 
   - `wbsItemId IN (:...wbsItemIds)` - WBS 항목 ID 목록으로 필터링
   - `deletedAt IS NULL` - 삭제되지 않은 산출물만
   - `isActive = true` - 활성 상태인 산출물만

2. **조회 필드**:
   ```typescript
   {
     deliverable_id,              // id
     deliverable_wbs_item_id,      // wbsItemId (그룹핑용)
     deliverable_name,             // name
     deliverable_description,      // description
     deliverable_type,             // type
     deliverable_file_path,        // filePath
     deliverable_employee_id,      // employeeId
     deliverable_mapped_date,      // mappedDate
     deliverable_mapped_by,        // mappedBy
     deliverable_is_active,        // isActive
     deliverable_created_at,       // createdAt
   }
   ```

3. **정렬**: `createdAt DESC` (생성일시 내림차순)

4. **그룹핑**: WBS 항목별로 그룹핑하여 `deliverablesMap`에 저장

### 2.4 대시보드 응답 DTO 필드 (DeliverableInfoDto)

대시보드에서 제공하는 산출물 필드:

```typescript
{
  id: string;                    // 산출물 ID
  name: string;                   // 산출물명
  description?: string;           // 산출물 설명
  type: string;                   // 산출물 유형 (document, code, design, report, presentation, other)
  filePath?: string;              // 파일 경로
  employeeId?: string;           // 담당 직원 ID
  mappedDate?: Date;             // 매핑일
  mappedBy?: string;              // 매핑자 ID
  isActive: boolean;              // 활성 상태
  createdAt: Date;               // 생성일
}
```

## 3. 필드 비교 및 차이점

### 3.1 필드 비교표

| 필드명 | 관리 컨트롤러 | 대시보드 | 설명 |
|--------|--------------|----------|------|
| `id` | ✅ | ✅ | 산출물 ID |
| `name` | ✅ | ✅ | 산출물명 |
| `description` | ✅ | ✅ | 산출물 설명 |
| `type` | ✅ | ✅ | 산출물 유형 |
| `filePath` | ✅ | ✅ | 파일 경로 |
| `employeeId` | ✅ | ✅ | 직원 ID |
| `wbsItemId` | ✅ | ❌ | WBS 항목 ID (대시보드에서는 WBS 내부에 포함되므로 불필요) |
| `mappedDate` | ✅ | ✅ | 매핑일 |
| `mappedBy` | ✅ | ✅ | 매핑자 ID |
| `isActive` | ✅ | ✅ | 활성 상태 |
| `createdAt` | ✅ | ✅ | 생성일시 |
| `updatedAt` | ✅ | ❌ | 수정일시 (대시보드에서는 미제공) |
| `deletedAt` | ✅ | ❌ | 삭제일시 (대시보드에서는 삭제된 항목 제외) |
| `createdBy` | ✅ | ❌ | 생성자 ID (대시보드에서는 미제공) |
| `updatedBy` | ✅ | ❌ | 수정자 ID (대시보드에서는 미제공) |
| `version` | ✅ | ❌ | 버전 (대시보드에서는 미제공) |

### 3.2 주요 차이점

1. **관리 컨트롤러**:
   - 산출물의 **전체 정보** 제공 (감사 정보 포함)
   - 산출물 단독 조회 및 관리에 사용

2. **대시보드**:
   - 산출물의 **조회에 필요한 핵심 정보**만 제공
   - WBS 항목 내부에 포함된 구조로 제공
   - 성능 최적화를 위해 불필요한 필드 제외

### 3.3 대시보드에서 필터링되는 조건

대시보드에서 산출물을 조회할 때 다음 조건이 적용됩니다:

1. **삭제되지 않은 산출물**: `deletedAt IS NULL`
2. **활성 상태인 산출물**: `isActive = true`
3. **WBS 항목에 연결된 산출물**: `wbsItemId IN (:...wbsItemIds)`

## 4. 산출물 유형 (DeliverableType)

산출물 유형은 다음 enum 값들을 사용합니다:

```typescript
enum DeliverableType {
  DOCUMENT = 'document',      // 문서
  CODE = 'code',              // 코드
  DESIGN = 'design',          // 디자인
  REPORT = 'report',          // 보고서
  PRESENTATION = 'presentation', // 발표자료
  OTHER = 'other',           // 기타
}
```

## 5. 데이터 흐름

### 5.1 산출물 생성 흐름

```
1. deliverable-management.controller.ts
   └── createDeliverable()
       └── PerformanceEvaluationService.산출물을_생성한다()
           └── CreateDeliverableCommand
               └── Deliverable 엔티티 생성 및 저장
```

### 5.2 대시보드 조회 흐름

```
1. dashboard.controller.ts
   └── getEmployeeAssignedData()
       └── DashboardService.사용자_할당_정보를_조회한다()
           └── GetEmployeeAssignedDataQuery
               └── GetEmployeeAssignedDataHandler
                   └── getProjectsWithWbs()
                       └── deliverableRepository 조회
                           └── WBS 항목별로 그룹핑
                               └── DeliverableInfo[] 반환
```

## 6. 참고 파일

### 6.1 컨트롤러
- `src/interface/admin/performance-evaluation/deliverable-management.controller.ts`
- `src/interface/admin/dashboard/dashboard.controller.ts`

### 6.2 DTO
- `src/interface/admin/performance-evaluation/dto/deliverable.dto.ts`
- `src/interface/admin/dashboard/dto/employee-assigned-data.dto.ts`

### 6.3 서비스
- `src/context/performance-evaluation-context/performance-evaluation.service.ts`
- `src/context/dashboard-context/dashboard.service.ts`

### 6.4 핸들러
- `src/context/dashboard-context/handlers/queries/get-employee-assigned-data/get-employee-assigned-data.handler.ts`
- `src/context/dashboard-context/handlers/queries/get-employee-assigned-data/project-wbs.utils.ts`

### 6.5 타입 정의
- `src/context/dashboard-context/handlers/queries/get-employee-assigned-data/types.ts`

### 6.6 엔티티
- `src/domain/core/deliverable/deliverable.entity.ts`

