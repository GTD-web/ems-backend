# 평가 활동 내역 저장 및 제공 기능 구현 가이드

## 개요

평가기간 피평가자 기준으로 일어난 모든 평가 활동 내역을 저장하고 제공하는 기능을 구현합니다.

**목적**: 평가 프로세스 전반에 걸친 활동 내역을 추적하고 조회할 수 있도록 합니다.

**범위**: 평가기간별 피평가자의 모든 평가 관련 활동 (자기평가, 하향평가, 동료평가, 추가평가, 산출물 등록 등)

---

## 도메인 엔티티 구조 분석

### 기존 평가 관련 엔티티

#### 1. WBS 자기평가 (WbsSelfEvaluation)
- **위치**: `src/domain/core/wbs-self-evaluation/`
- **주요 필드**:
  - `periodId`: 평가 기간 ID
  - `employeeId`: 피평가자 ID
  - `wbsItemId`: WBS 항목 ID
  - `evaluationDate`: 평가일
  - `submittedToEvaluator`: 1차 평가자 제출 여부
  - `submittedToEvaluatorAt`: 1차 평가자 제출 일시
  - `submittedToManager`: 관리자 제출 여부
  - `submittedToManagerAt`: 관리자 제출 일시

#### 2. 하향평가 (DownwardEvaluation)
- **위치**: `src/domain/core/downward-evaluation/`
- **주요 필드**:
  - `periodId`: 평가 기간 ID
  - `employeeId`: 피평가자 ID
  - `evaluatorId`: 평가자 ID
  - `evaluationType`: 평가 유형 (primary, secondary)
  - `evaluationDate`: 평가일

#### 3. 동료평가 (PeerEvaluation)
- **위치**: `src/domain/core/peer-evaluation/`
- **주요 필드**:
  - `periodId`: 평가 기간 ID
  - `evaluateeId`: 피평가자 ID
  - `evaluatorId`: 평가자 ID
  - `status`: 평가 상태 (pending, in_progress, completed, cancelled)
  - `evaluationDate`: 평가일

#### 4. 산출물 (Deliverable)
- **위치**: `src/domain/core/deliverable/`
- **주요 필드**:
  - `employeeId`: 직원 ID
  - `wbsItemId`: WBS 항목 ID
  - `mappedDate`: 매핑일
  - `mappedBy`: 매핑자 ID

### 공통 패턴

모든 평가 엔티티는 다음을 공통으로 포함합니다:
- `periodId`: 평가 기간 ID (직접 또는 간접적으로 연결)
- `employeeId` 또는 `evaluateeId`: 피평가자 ID
- `createdAt`, `updatedAt`: 생성/수정 일시
- `createdBy`, `updatedBy`: 생성/수정자 ID

---

## 활동 내역 저장 방법 설계

### 설계 방안 비교

#### 방안 1: 기존 테이블 조회 방식
**장점**:
- 별도 테이블 불필요
- 데이터 중복 없음
- 기존 데이터 활용

**단점**:
- 여러 테이블 조인 필요 (성능 이슈)
- 활동 유형별로 다른 테이블 구조
- 활동 내역 통합 조회 복잡
- 삭제된 데이터 추적 불가

#### 방안 2: 별도 활동 내역 테이블 생성 (권장) ✅
**장점**:
- 통합된 활동 내역 조회 가능
- 빠른 조회 성능 (인덱스 최적화)
- 삭제된 데이터도 추적 가능
- 활동 유형별 일관된 구조
- 활동 메타데이터 저장 가능

**단점**:
- 별도 테이블 관리 필요
- 데이터 중복 가능성 (하지만 활동 내역은 별도 목적)

**결론**: **방안 2 (별도 활동 내역 테이블)** 채택

### 활동 내역 테이블 설계

#### EVALUATION_ACTIVITY_LOG 테이블

```sql
CREATE TABLE evaluation_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 기본 정보
  period_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  activity_action VARCHAR(50) NOT NULL,
  
  -- 활동 상세 정보
  activity_title VARCHAR(255),
  activity_description TEXT,
  
  -- 관련 엔티티 정보
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  
  -- 활동자 정보
  performed_by UUID NOT NULL,
  performed_by_name VARCHAR(255),
  
  -- 활동 메타데이터
  activity_metadata JSONB,
  
  -- 활동 일시
  activity_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- 감사 정보
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  version INT NOT NULL DEFAULT 1,
  
  -- 인덱스
  INDEX idx_period_employee (period_id, employee_id),
  INDEX idx_activity_type (activity_type),
  INDEX idx_activity_date (activity_date),
  INDEX idx_performed_by (performed_by),
  INDEX idx_related_entity (related_entity_type, related_entity_id)
);
```

#### 활동 유형 (activity_type)

| 활동 유형 | 설명 | 관련 엔티티 |
|---------|------|-----------|
| `wbs_self_evaluation` | WBS 자기평가 | WbsSelfEvaluation |
| `downward_evaluation` | 하향평가 | DownwardEvaluation |
| `peer_evaluation` | 동료평가 | PeerEvaluation |
| `additional_evaluation` | 추가평가 | AdditionalEvaluation |
| `deliverable` | 산출물 | Deliverable |
| `evaluation_status` | 평가 상태 변경 | EmployeeEvaluationStatus |
| `step_approval` | 단계 승인 | StepApproval |
| `revision_request` | 재작성 요청 | RevisionRequest |

#### 활동 액션 (activity_action)

| 활동 액션 | 설명 |
|---------|------|
| `created` | 생성 |
| `updated` | 수정 |
| `submitted` | 제출 |
| `completed` | 완료 |
| `cancelled` | 취소 |
| `deleted` | 삭제 |
| `assigned` | 할당 |
| `unassigned` | 할당 해제 |
| `approved` | 승인 |
| `rejected` | 거부 |
| `revision_requested` | 재작성 요청 |
| `revision_completed` | 재작성 완료 |

---

## 구현 방법

### 1. 도메인 레이어 (Domain Layer)

#### 1.1 엔티티 생성

**위치**: `src/domain/core/evaluation-activity-log/`

```typescript
// evaluation-activity-log.entity.ts
@Entity('evaluation_activity_log')
@Index(['periodId', 'employeeId'])
@Index(['activityType'])
@Index(['activityDate'])
@Index(['performedBy'])
export class EvaluationActivityLog extends BaseEntity<EvaluationActivityLogDto> {
  @Column({ type: 'uuid', comment: '평가 기간 ID' })
  periodId: string;

  @Column({ type: 'uuid', comment: '피평가자 ID' })
  employeeId: string;

  @Column({ type: 'varchar', length: 50, comment: '활동 유형' })
  activityType: EvaluationActivityType;

  @Column({ type: 'varchar', length: 50, comment: '활동 액션' })
  activityAction: EvaluationActivityAction;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '활동 제목' })
  activityTitle?: string;

  @Column({ type: 'text', nullable: true, comment: '활동 설명' })
  activityDescription?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '관련 엔티티 유형' })
  relatedEntityType?: string;

  @Column({ type: 'uuid', nullable: true, comment: '관련 엔티티 ID' })
  relatedEntityId?: string;

  @Column({ type: 'uuid', comment: '활동 수행자 ID' })
  performedBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '활동 수행자 이름' })
  performedByName?: string;

  @Column({ type: 'jsonb', nullable: true, comment: '활동 메타데이터' })
  activityMetadata?: Record<string, any>;

  @Column({ type: 'timestamp with time zone', comment: '활동 일시' })
  activityDate: Date;
}
```

#### 1.2 도메인 서비스

**위치**: `src/domain/core/evaluation-activity-log/`

```typescript
// evaluation-activity-log.service.ts
@Injectable()
export class EvaluationActivityLogService {
  constructor(
    @InjectRepository(EvaluationActivityLog)
    private readonly activityLogRepository: Repository<EvaluationActivityLog>,
  ) {}

  /**
   * 활동 내역을 생성한다
   */
  async 생성한다(
    data: CreateEvaluationActivityLogData,
  ): Promise<EvaluationActivityLogDto>;

  /**
   * 평가기간 피평가자 기준 활동 내역을 조회한다
   */
  async 평가기간_피평가자_활동내역을_조회한다(params: {
    periodId: string;
    employeeId: string;
    activityType?: EvaluationActivityType;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    items: EvaluationActivityLogDto[];
    total: number;
    page: number;
    limit: number;
  }>;
}
```

### 2. 컨텍스트 레이어 (Context Layer)

#### 2.1 컨텍스트 서비스

**위치**: `src/context/evaluation-activity-log-context/`

```typescript
// evaluation-activity-log-context.service.ts
@Injectable()
export class EvaluationActivityLogContextService {
  constructor(
    private readonly activityLogService: EvaluationActivityLogService,
    private readonly employeeService: EmployeeService,
  ) {}

  /**
   * 활동 내역을 기록한다
   * 
   * activityDescription이 제공되지 않은 경우, performedByName을 사용하여 자동 생성합니다.
   * 생성 형식: "{performedByName}님이 {activityTitle}을(를) {activityAction}했습니다."
   * 예: "홍길동님이 WBS 자기평가를 생성했습니다."
   */
  async 활동내역을_기록한다(params: {
    periodId: string;
    employeeId: string;
    activityType: EvaluationActivityType;
    activityAction: EvaluationActivityAction;
    activityTitle?: string;
    activityDescription?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    performedBy: string;
    activityMetadata?: Record<string, any>;
    activityDate?: Date;
  }): Promise<EvaluationActivityLogDto>;

  /**
   * 평가기간 피평가자 기준 활동 내역을 조회한다
   */
  async 평가기간_피평가자_활동내역을_조회한다(params: {
    periodId: string;
    employeeId: string;
    activityType?: EvaluationActivityType;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    items: EvaluationActivityLogDto[];
    total: number;
    page: number;
    limit: number;
  }>;
}
```

### 3. 비즈니스 로직 레이어 (Business Layer)

#### 3.1 WBS 자기평가 비즈니스 서비스에 활동 내역 기록 추가

**위치**: `src/business/wbs-self-evaluation/`

**연결된 엔드포인트**:
- `POST /admin/performance-evaluation/wbs-self-evaluations/employees/{employeeId}/periods/{periodId}/submit-all` - 직원의 전체 WBS 자기평가 제출

```typescript
// wbs-self-evaluation-business.service.ts
@Injectable()
export class WbsSelfEvaluationBusinessService {
  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
    private readonly activityLogContextService: EvaluationActivityLogContextService,
    // ... 기타 서비스
  ) {}

  /**
   * 직원의 전체 WBS 자기평가를 제출하고 재작성 요청을 완료한다
   * (활동 내역 기록 포함)
   */
  async 직원의_전체_WBS자기평가를_제출하고_재작성요청을_완료한다(
    employeeId: string,
    periodId: string,
    submittedBy: string,
  ): Promise<SubmitAllWbsSelfEvaluationsResponse>;
}
```

#### 3.2 하향평가 비즈니스 서비스에 활동 내역 기록 추가

**위치**: `src/business/downward-evaluation/`

**연결된 엔드포인트**:
- `PUT /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/{wbsId}/primary` - 1차 하향평가 저장
- `PUT /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/{wbsId}/secondary` - 2차 하향평가 저장
- `POST /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/{wbsId}/primary/submit` - 1차 하향평가 제출
- `POST /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/{wbsId}/secondary/submit` - 2차 하향평가 제출

```typescript
// downward-evaluation-business.service.ts
@Injectable()
export class DownwardEvaluationBusinessService {
  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
    private readonly activityLogContextService: EvaluationActivityLogContextService,
    // ... 기타 서비스
  ) {}

  /**
   * 1차 하향평가를 저장한다 (활동 내역 기록 포함)
   */
  async 일차_하향평가를_저장한다(params: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    // ... 기타 파라미터
    actionBy: string;
  }): Promise<string>;

  /**
   * 2차 하향평가를 저장한다 (활동 내역 기록 포함)
   */
  async 이차_하향평가를_저장한다(params: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    // ... 기타 파라미터
    actionBy: string;
  }): Promise<string>;

  /**
   * 1차 하향평가를 제출하고 재작성 요청을 완료한다 (활동 내역 기록 포함)
   */
  async 일차_하향평가를_제출하고_재작성요청을_완료한다(
    evaluateeId: string,
    periodId: string,
    wbsId: string,
    evaluatorId: string,
    submittedBy: string,
  ): Promise<void>;

  /**
   * 2차 하향평가를 제출하고 재작성 요청을 완료한다 (활동 내역 기록 포함)
   */
  async 이차_하향평가를_제출하고_재작성요청을_완료한다(
    evaluateeId: string,
    periodId: string,
    wbsId: string,
    evaluatorId: string,
    submittedBy: string,
  ): Promise<void>;
}
```

#### 3.3 동료평가 비즈니스 서비스에 활동 내역 기록 추가

**위치**: `src/business/peer-evaluation/`

**연결된 엔드포인트**:
- `POST /admin/performance-evaluation/peer-evaluations` - 동료평가 요청
- `POST /admin/performance-evaluation/peer-evaluations/multiple-evaluators` - 여러 평가자에게 동료평가 요청
- `POST /admin/performance-evaluation/peer-evaluations/multiple-evaluatees` - 여러 피평가자에 대한 동료평가 요청
- `POST /admin/performance-evaluation/peer-evaluations/{id}/submit` - 동료평가 제출
- `POST /admin/performance-evaluation/peer-evaluations/{id}/answers` - 동료평가 답변 저장

```typescript
// peer-evaluation-business.service.ts
@Injectable()
export class PeerEvaluationBusinessService {
  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
    private readonly activityLogContextService: EvaluationActivityLogContextService,
    // ... 기타 서비스
  ) {}

  /**
   * 동료평가를 요청한다 (활동 내역 기록 포함)
   */
  async 동료평가를_요청한다(params: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    requestDeadline?: Date;
    questionIds?: string[];
    requestedBy: string;
  }): Promise<string>;

  /**
   * 동료평가를 제출한다 (활동 내역 기록 포함)
   */
  async 동료평가를_제출한다(params: {
    evaluationId: string;
    submittedBy: string;
  }): Promise<void>;

  /**
   * 동료평가 답변을 저장한다 (활동 내역 기록 포함)
   */
  async 동료평가_답변을_저장한다(params: {
    peerEvaluationId: string;
    answers: Array<{
      questionId: string;
      answer: string;
      score?: number;
    }>;
    answeredBy: string;
  }): Promise<{ savedCount: number }>;
}
```

#### 3.4 WBS 할당 비즈니스 서비스에 활동 내역 기록 추가

**위치**: `src/business/wbs-assignment/`

**연결된 엔드포인트**:
- `POST /admin/evaluation-criteria/wbs-assignments` - WBS 할당 생성
- `DELETE /admin/evaluation-criteria/wbs-assignments/wbs/{wbsId}` - WBS 할당 취소
- `POST /admin/evaluation-criteria/wbs-assignments/bulk` - WBS 대량 할당

```typescript
// wbs-assignment-business.service.ts
@Injectable()
export class WbsAssignmentBusinessService {
  constructor(
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
    private readonly activityLogContextService: EvaluationActivityLogContextService,
    // ... 기타 서비스
  ) {}

  /**
   * WBS를 할당한다 (활동 내역 기록 포함)
   */
  async WBS를_할당한다(params: {
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
    assignedBy: string;
  }): Promise<any>;
}
```

#### 3.5 산출물 비즈니스 서비스에 활동 내역 기록 추가

**위치**: `src/business/deliverable/` (또는 해당 비즈니스 서비스 위치)

**연결된 엔드포인트**:
- `POST /admin/performance-evaluation/deliverables` - 산출물 생성 (예상)

```typescript
// deliverable-business.service.ts (또는 해당 비즈니스 서비스)
@Injectable()
export class DeliverableBusinessService {
  constructor(
    private readonly deliverableService: DeliverableService,
    private readonly activityLogContextService: EvaluationActivityLogContextService,
    // ... 기타 서비스
  ) {}

  /**
   * 산출물을 생성한다 (활동 내역 기록 포함)
   */
  async 산출물을_생성한다(params: {
    employeeId: string;
    wbsItemId: string;
    periodId?: string;
    // ... 기타 파라미터
    createdBy: string;
  }): Promise<DeliverableDto>;
}
```

### 4. 인터페이스 레이어 (Interface Layer)

#### 4.1 컨트롤러

**위치**: `src/interface/admin/evaluation-activity-log/` 또는 `src/interface/user/evaluation-activity-log/`

```typescript
// evaluation-activity-log.controller.ts
@ApiTags('A-0-X. 관리자 - 평가 활동 내역')
@Controller('admin/evaluation-activity-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class EvaluationActivityLogController {
  constructor(
    private readonly activityLogContextService: EvaluationActivityLogContextService,
  ) {}

  @Get('periods/:periodId/employees/:employeeId')
  @ApiOperation({ summary: '평가기간 피평가자 기준 활동 내역 조회' })
  async getActivityLogs(
    @Param('periodId') periodId: string,
    @Param('employeeId') employeeId: string,
    @Query() query: GetEvaluationActivityLogListQueryDto,
  ): Promise<EvaluationActivityLogListResponseDto>;
}
```

#### 4.2 DTO

```typescript
// dto/get-evaluation-activity-log-list-query.dto.ts
export class GetEvaluationActivityLogListQueryDto {
  @ApiPropertyOptional({ enum: EvaluationActivityType })
  activityType?: EvaluationActivityType;

  @ApiPropertyOptional()
  startDate?: string;

  @ApiPropertyOptional()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}
```

```typescript
// dto/evaluation-activity-log-response.dto.ts
export class EvaluationActivityLogResponseDto {
  id: string;
  periodId: string;
  employeeId: string;
  activityType: EvaluationActivityType;
  activityAction: EvaluationActivityAction;
  activityTitle?: string;
  activityDescription?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  performedBy: string;
  performedByName?: string;
  activityMetadata?: Record<string, any>;
  activityDate: Date;
  createdAt: Date;
}

export class EvaluationActivityLogListResponseDto {
  items: EvaluationActivityLogResponseDto[];
  total: number;
  page: number;
  limit: number;
}
```

---

## 구현 순서

### 1단계: 도메인 레이어 구현
1. `EvaluationActivityLog` 엔티티 생성
2. `EvaluationActivityLogService` 도메인 서비스 구현
3. `EvaluationActivityLogModule` 모듈 생성
4. 타입 정의 (`evaluation-activity-log.types.ts`)

### 2단계: 컨텍스트 레이어 구현
1. `EvaluationActivityLogContextService` 컨텍스트 서비스 구현 (저장 및 조회 기능)
2. `EvaluationActivityLogContextModule` 모듈 생성
3. Domain Context Module에 등록

### 3단계: 활동 내역 자동 기록 구현 (선택적, 추후 구현)
> **참고**: 활동 내역 자동 기록 기능은 추후 단계적으로 구현할 수 있습니다. 먼저 조회 기능을 구현하고, 필요에 따라 각 비즈니스 서비스에 활동 내역 기록을 추가합니다.

1. 각 비즈니스 서비스에 `EvaluationActivityLogContextService` 주입
2. **WBS 자기평가 비즈니스 서비스**에 활동 내역 기록 추가
   - `직원의_전체_WBS자기평가를_제출하고_재작성요청을_완료한다` 메서드
   - 엔드포인트: `POST /admin/performance-evaluation/wbs-self-evaluations/employees/{employeeId}/periods/{periodId}/submit-all`
3. **하향평가 비즈니스 서비스**에 활동 내역 기록 추가
   - `일차_하향평가를_저장한다` 메서드
   - `이차_하향평가를_저장한다` 메서드
   - `일차_하향평가를_제출하고_재작성요청을_완료한다` 메서드
   - `이차_하향평가를_제출하고_재작성요청을_완료한다` 메서드
   - 엔드포인트:
     - `PUT /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/{wbsId}/primary`
     - `PUT /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/{wbsId}/secondary`
     - `POST /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/{wbsId}/primary/submit`
     - `POST /admin/performance-evaluation/downward-evaluations/{evaluateeId}/{periodId}/{wbsId}/secondary/submit`
4. **동료평가 비즈니스 서비스**에 활동 내역 기록 추가
   - `동료평가를_요청한다` 메서드
   - `동료평가를_제출한다` 메서드
   - `동료평가_답변을_저장한다` 메서드
   - 엔드포인트:
     - `POST /admin/performance-evaluation/peer-evaluations`
     - `POST /admin/performance-evaluation/peer-evaluations/multiple-evaluators`
     - `POST /admin/performance-evaluation/peer-evaluations/multiple-evaluatees`
     - `POST /admin/performance-evaluation/peer-evaluations/{id}/submit`
     - `POST /admin/performance-evaluation/peer-evaluations/{id}/answers`
5. **WBS 할당 비즈니스 서비스**에 활동 내역 기록 추가
   - `WBS를_할당한다` 메서드
   - 엔드포인트:
     - `POST /admin/evaluation-criteria/wbs-assignments`
     - `DELETE /admin/evaluation-criteria/wbs-assignments/wbs/{wbsId}`
     - `POST /admin/evaluation-criteria/wbs-assignments/bulk`
6. 산출물 비즈니스 서비스에 활동 내역 기록 추가 (선택적)
7. 평가 상태 변경 비즈니스 서비스에 활동 내역 기록 추가 (선택적)

### 4단계: 인터페이스 레이어 구현
1. 컨트롤러 구현
2. DTO 정의
3. API 문서화

### 5단계: 테스트
1. 단위 테스트
2. 통합 테스트
3. E2E 테스트

---

## API 사용 예시

### 평가기간 피평가자 기준 활동 내역 조회

```http
GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}?page=1&limit=20
```

**응답 예시**:
```json
{
  "items": [
    {
      "id": "uuid",
      "periodId": "period-123",
      "employeeId": "employee-456",
      "activityType": "wbs_self_evaluation",
      "activityAction": "created",
      "activityTitle": "WBS 자기평가 생성",
      "activityDescription": "홍길동님이 WBS 자기평가를 생성했습니다.",
      "relatedEntityType": "wbs_self_evaluation",
      "relatedEntityId": "eval-789",
      "performedBy": "employee-456",
      "performedByName": "홍길동",
      "activityMetadata": {
        "wbsItemId": "wbs-123",
        "evaluationId": "eval-789"
      },
      "activityDate": "2024-01-01T10:00:00.000Z",
      "createdAt": "2024-01-01T10:00:00.000Z"
    },
    {
      "id": "uuid-2",
      "periodId": "period-123",
      "employeeId": "employee-456",
      "activityType": "downward_evaluation",
      "activityAction": "completed",
      "activityTitle": "하향평가 완료",
      "activityDescription": "김평가님이 1차 하향평가를 완료했습니다.",
      "relatedEntityType": "downward_evaluation",
      "relatedEntityId": "downward-eval-123",
      "performedBy": "evaluator-789",
      "performedByName": "김평가",
      "activityMetadata": {
        "evaluatorId": "evaluator-789",
        "evaluationType": "primary",
        "evaluationId": "downward-eval-123"
      },
      "activityDate": "2024-01-02T14:30:00.000Z",
      "createdAt": "2024-01-02T14:30:00.000Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 20
}
```

### 활동 유형별 필터링

```http
GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}?activityType=wbs_self_evaluation&page=1&limit=20
```

### 기간별 필터링

```http
GET /admin/evaluation-activity-logs/periods/{periodId}/employees/{employeeId}?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z&page=1&limit=20
```

---

## 고려사항

### 1. 성능 최적화
- **인덱스 설계**: `periodId`, `employeeId`, `activityDate` 복합 인덱스
- **페이징**: 대량 데이터 조회 시 페이징 필수
- **쿼리 최적화**: 필요한 필드만 조회

### 2. 데이터 보관 정책
- **보관 기간**: 평가 완료 후 일정 기간 보관 (예: 3년)
- **자동 삭제**: 오래된 활동 내역 자동 삭제 (선택적)

### 3. 활동 내역 기록 시점
- **비즈니스 로직 레이어**: 평가 저장 후 비즈니스 서비스에서 `EvaluationActivityLogContextService`를 통해 활동 내역 기록
- **트랜잭션 내부**: 평가 저장과 동일한 트랜잭션에서 기록 (선택적)
- **에러 처리**: 활동 내역 기록 실패 시에도 평가 저장은 정상 처리

### 4. 활동 내역 중복 방지
- **동일 활동 중복 기록 방지**: 같은 엔티티에 대한 동일 액션은 최신 것만 기록 (선택적)

### 5. 활동 설명 자동 생성
- **자동 생성 규칙**: `activityDescription`이 제공되지 않은 경우, `performedByName`을 사용하여 자동 생성
- **생성 형식**: `"{performedByName}님이 {activityTitle}을(를) {activityAction}했습니다."`
- **예시**:
  - `activityTitle`: "WBS 자기평가", `activityAction`: "created", `performedByName`: "홍길동"
  - → `activityDescription`: "홍길동님이 WBS 자기평가를 생성했습니다."
  - `activityTitle`: "1차 하향평가", `activityAction`: "completed", `performedByName`: "김평가"
  - → `activityDescription`: "김평가님이 1차 하향평가를 완료했습니다."
- **수동 제공**: 필요시 `activityDescription`을 직접 제공하여 커스터마이징 가능

---

## 결론

평가기간 피평가자 기준 활동 내역 저장 및 제공 기능은 다음과 같이 구현합니다:

1. **별도 활동 내역 테이블 생성**: 통합된 활동 내역 조회 및 빠른 성능
2. **비즈니스 로직 레이어에서 저장**: 각 평가 관련 비즈니스 서비스에서 `EvaluationActivityLogContextService`를 통해 활동 내역 자동 기록
3. **통합 조회 API**: 평가기간과 피평가자 기준으로 모든 활동 내역 조회

이를 통해 평가 프로세스 전반에 걸친 활동 내역을 추적하고 조회할 수 있습니다.

### 레이어별 역할

- **도메인 레이어**: 활동 내역 엔티티 및 도메인 서비스 (CRUD)
- **컨텍스트 레이어**: 활동 내역 저장 및 조회 기능 제공
- **비즈니스 로직 레이어**: 평가 저장 후 `EvaluationActivityLogContextService`를 통해 활동 내역 자동 기록
- **인터페이스 레이어**: API 엔드포인트 제공

