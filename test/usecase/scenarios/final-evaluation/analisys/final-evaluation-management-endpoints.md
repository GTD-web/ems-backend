# 최종평가 관리 엔드포인트 분석

## 개요

이 문서는 `FinalEvaluationManagementController`의 모든 엔드포인트를 분석한 문서입니다.

**컨트롤러 경로**: `/admin/performance-evaluation/final-evaluations`

**총 엔드포인트 수**: 6개

**카테고리**:
- 최종평가 저장 및 수정: 1개
- 최종평가 확정 관리: 2개
- 최종평가 조회: 3개

---

## 1. 최종평가 저장 및 수정

### 1.1 최종평가 저장 (Upsert)

**엔드포인트**: `POST /admin/performance-evaluation/final-evaluations/employee/:employeeId/period/:periodId`

**요약**: 직원과 평가기간 조합으로 최종평가를 저장합니다. 이미 존재하면 수정, 없으면 생성됩니다.

**동작**:
- 직원-평가기간 조합으로 최종평가를 Upsert (없으면 생성, 있으면 수정)
- 평가등급, 직무등급, 직무 상세등급 필수 입력
- 최종 평가 의견은 선택사항
- 초기 생성 시 isConfirmed는 false로 설정
- 동일한 직원-평가기간 조합에는 하나의 평가만 존재
- 확정된 평가는 수정 불가 (422 에러)

**경로 파라미터**:
- `employeeId`: 직원 ID (UUID)
- `periodId`: 평가기간 ID (UUID)

**요청 본문** (`UpsertFinalEvaluationBodyDto`):
```typescript
{
  evaluationGrade: string;        // 평가등급 (필수, 예: "S", "A", "B", "C", "D")
  jobGrade: JobGrade;            // 직무등급 (필수, enum: T1, T2, T3, T4, T5)
  jobDetailedGrade: JobDetailedGrade; // 직무 상세등급 (필수, enum: u, n, a)
  finalComments?: string;        // 최종 평가 의견 (선택)
}
```

**응답** (`FinalEvaluationResponseDto`, 201 Created):
```typescript
{
  id: string;                    // 생성/수정된 최종평가 ID
  message: string;               // "최종평가가 성공적으로 저장되었습니다."
}
```

**에러 응답**:
- `400 Bad Request`: 잘못된 요청 데이터 (필수 필드 누락, 잘못된 형식 등)
- `422 Unprocessable Entity`: 확정된 평가는 수정할 수 없습니다.

**테스트 케이스**:
- 기본 최종평가를 저장(생성)할 수 있어야 한다
- 최종평가 의견을 포함하여 저장할 수 있어야 한다
- actionBy를 포함하여 저장할 수 있어야 한다
- actionBy 없이도 저장할 수 있어야 한다 (기본값 사용)
- 이미 존재하는 평가를 수정(Upsert)할 수 있어야 한다
- 다양한 평가등급으로 저장할 수 있어야 한다
- 다양한 직무등급 조합으로 저장할 수 있어야 한다
- 잘못된 형식의 employeeId로 요청 시 400 에러가 발생해야 한다
- 잘못된 형식의 periodId로 요청 시 400 에러가 발생해야 한다
- evaluationGrade 누락 시 400 에러가 발생해야 한다
- jobGrade 누락 시 400 에러가 발생해야 한다
- jobDetailedGrade 누락 시 400 에러가 발생해야 한다
- 잘못된 jobGrade 값으로 요청 시 400 에러가 발생해야 한다
- 잘못된 jobDetailedGrade 값으로 요청 시 400 에러가 발생해야 한다
- 확정된 평가 수정 시도 시 422 에러가 발생해야 한다
- 응답에 필수 필드가 모두 포함되어야 한다
- 평가 ID가 유효한 UUID 형식이어야 한다
- 저장된 데이터가 DB의 실제 데이터와 일치해야 한다
- 초기 생성 시 isConfirmed가 false여야 한다
- 초기 생성 시 confirmedAt과 confirmedBy가 null이어야 한다
- 생성 시 createdAt과 updatedAt이 설정되어야 한다
- 수정 시 updatedAt이 갱신되어야 한다
- 같은 직원-평가기간 조합에 대해 하나의 평가만 존재해야 한다

---

## 2. 최종평가 확정 관리

### 2.1 최종평가 확정

**엔드포인트**: `POST /admin/performance-evaluation/final-evaluations/:id/confirm`

**요약**: 최종평가를 확정합니다. 확정 후에는 수정/삭제가 불가능합니다.

**동작**:
- 최종평가의 확정 상태를 true로 변경
- 확정 일시(confirmedAt)를 현재 시간으로 설정
- 확정자 ID(confirmedBy)를 기록
- 버전(version)을 1 증가
- 수정 일시(updatedAt)를 갱신
- 이미 확정된 평가는 다시 확정 불가 (409 에러)

**경로 파라미터**:
- `id`: 최종평가 ID (UUID)

**요청 본문**: 없음 (Body 비어있음, confirmedBy는 @CurrentUser()로 자동 처리)

**응답** (200 OK):
```typescript
{
  message: string;               // "최종평가가 성공적으로 확정되었습니다."
}
```

**에러 응답**:
- `400 Bad Request`: 잘못된 요청 데이터
- `404 Not Found`: 최종평가를 찾을 수 없습니다.
- `409 Conflict`: 이미 확정된 평가입니다.

**테스트 케이스**:
- 기본 최종평가를 확정할 수 있어야 한다
- confirmedBy를 포함하여 확정할 수 있어야 한다
- 확정 후 isConfirmed가 true로 변경되어야 한다
- 확정 후 confirmedAt이 설정되어야 한다
- 확정 후 updatedAt이 갱신되어야 한다
- 잘못된 형식의 평가 ID로 확정 시 400 에러가 발생해야 한다
- 존재하지 않는 평가 ID로 확정 시 404 에러가 발생해야 한다
- confirmedBy 누락 시 400 에러가 발생해야 한다
- 이미 확정된 평가를 다시 확정 시 409 에러가 발생해야 한다
- 응답에 message 필드가 포함되어야 한다
- 성공 메시지가 적절해야 한다
- 확정된 데이터가 DB의 실제 데이터와 일치해야 한다
- 확정 후에도 평가 등급 데이터는 유지되어야 한다
- 확정 후 createdAt은 변경되지 않아야 한다
- 확정 시 version이 증가해야 한다

---

### 2.2 최종평가 확정 취소

**엔드포인트**: `POST /admin/performance-evaluation/final-evaluations/:id/cancel-confirmation`

**요약**: 확정된 최종평가를 취소하여 다시 수정 가능하게 합니다.

**동작**:
- 최종평가의 확정 상태를 false로 변경
- 확정 일시(confirmedAt)를 null로 초기화
- 확정자 ID(confirmedBy)를 null로 초기화
- 버전(version)을 1 증가
- 수정 일시(updatedAt)를 갱신
- 취소 후 평가 수정이 다시 가능
- 확정되지 않은 평가는 취소 불가 (422 에러)

**경로 파라미터**:
- `id`: 최종평가 ID (UUID)

**요청 본문**: 없음 (Body 비어있음, updatedBy는 @CurrentUser()로 자동 처리)

**응답** (200 OK):
```typescript
{
  message: string;               // "최종평가 확정이 성공적으로 취소되었습니다."
}
```

**에러 응답**:
- `400 Bad Request`: 잘못된 요청 데이터
- `404 Not Found`: 최종평가를 찾을 수 없습니다.
- `422 Unprocessable Entity`: 확정되지 않은 평가입니다.

**테스트 케이스**:
- 확정된 최종평가의 확정을 취소할 수 있어야 한다
- updatedBy를 포함하여 확정 취소할 수 있어야 한다
- 확정 취소 후 isConfirmed가 false로 변경되어야 한다
- 확정 취소 후 confirmedAt과 confirmedBy가 null로 변경되어야 한다
- 확정 취소 후 updatedAt이 갱신되어야 한다
- 잘못된 형식의 평가 ID로 확정 취소 시 400 에러가 발생해야 한다
- 존재하지 않는 평가 ID로 확정 취소 시 404 에러가 발생해야 한다
- updatedBy 누락 시 400 에러가 발생해야 한다
- 확정되지 않은 평가의 확정 취소 시 422 에러가 발생해야 한다
- 응답에 message 필드가 포함되어야 한다
- 성공 메시지가 적절해야 한다
- 취소된 데이터가 DB의 실제 데이터와 일치해야 한다
- 확정 취소 후에도 평가 등급 데이터는 유지되어야 한다
- 확정 취소 후 createdAt은 변경되지 않아야 한다
- 확정 취소 시 version이 증가해야 한다
- 확정 취소 후 다시 수정이 가능해야 한다

---

## 3. 최종평가 조회

### 3.1 최종평가 단일 조회

**엔드포인트**: `GET /admin/performance-evaluation/final-evaluations/:id`

**요약**: ID로 최종평가 상세정보를 조회합니다.

**동작**:
- 최종평가 ID로 단일 평가 조회
- 직원 정보를 객체로 반환 (id, name, employeeNumber, email)
- 평가기간 정보를 객체로 반환 (id, name, startDate, endDate, status)
- 평가 등급 정보 포함 (evaluationGrade, jobGrade, jobDetailedGrade)
- 확정 정보 포함 (isConfirmed, confirmedAt, confirmedBy)
- 메타데이터 포함 (createdAt, updatedAt, createdBy, updatedBy, version)
- 존재하지 않는 ID 조회 시 404 에러 반환

**경로 파라미터**:
- `id`: 최종평가 ID (UUID)

**응답** (`FinalEvaluationDetailDto`, 200 OK):
```typescript
{
  id: string;                    // 최종평가 ID
  employee: {                    // 직원 정보
    id: string;
    name: string;
    employeeNumber: string;
    email?: string;
  };
  period: {                      // 평가기간 정보
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
  };
  evaluationGrade: string;       // 평가등급
  jobGrade: JobGrade;           // 직무등급
  jobDetailedGrade: JobDetailedGrade; // 직무 상세등급
  finalComments?: string;        // 최종 평가 의견
  isConfirmed: boolean;          // 확정 여부
  confirmedAt?: Date | null;     // 확정일시
  confirmedBy?: string | null;   // 확정자 ID
  createdAt: Date;              // 생성일시
  updatedAt: Date;              // 수정일시
  createdBy?: string;           // 생성자 ID
  updatedBy?: string;           // 수정자 ID
  version: number;              // 버전
}
```

**에러 응답**:
- `400 Bad Request`: 잘못된 ID 형식
- `404 Not Found`: 최종평가를 찾을 수 없습니다.

**테스트 케이스**:
- 기본 최종평가를 조회할 수 있어야 한다
- 직원 정보가 객체로 반환되어야 한다
- 평가기간 정보가 객체로 반환되어야 한다
- 평가 등급 정보가 정확히 반환되어야 한다
- 확정 정보가 정확히 반환되어야 한다
- 미확정 평가는 확정 정보가 null이어야 한다
- 잘못된 형식의 ID로 조회 시 400 에러가 발생해야 한다
- 존재하지 않는 ID로 조회 시 404 에러가 발생해야 한다
- 응답에 필수 필드가 모두 포함되어야 한다
- 직원 객체에 필수 필드가 모두 포함되어야 한다
- 평가기간 객체에 필수 필드가 모두 포함되어야 한다
- ID가 유효한 UUID 형식이어야 한다
- 날짜가 유효한 ISO 8601 형식이어야 한다
- 조회된 데이터가 DB의 실제 데이터와 일치해야 한다
- 확정 상태가 DB와 일치해야 한다
- 확정 취소 후 조회 시 확정 정보가 null이어야 한다

---

### 3.2 최종평가 목록 조회

**엔드포인트**: `GET /admin/performance-evaluation/final-evaluations`

**요약**: 필터 조건에 따라 최종평가 목록을 조회합니다.

**동작**:
- 페이지네이션 지원 (기본: page=1, limit=10)
- 다양한 필터 조건 지원 (employeeId, periodId, evaluationGrade, jobGrade, jobDetailedGrade, confirmedOnly)
- 직원 정보를 객체로 반환 (id, name, employeeNumber, email)
- 평가기간 정보를 객체로 반환 (id, name, startDate, endDate, status)
- 생성일시 역순 정렬 (최신순)

**쿼리 파라미터** (`FinalEvaluationFilterDto`):
```typescript
{
  employeeId?: string;           // 직원 ID (선택, UUID)
  periodId?: string;            // 평가기간 ID (선택, UUID)
  evaluationGrade?: string;     // 평가등급 (선택)
  jobGrade?: JobGrade;         // 직무등급 (선택, enum)
  jobDetailedGrade?: JobDetailedGrade; // 직무 상세등급 (선택, enum)
  confirmedOnly?: boolean;      // 확정된 평가만 조회 (선택, 기본값: false)
  page?: number;               // 페이지 번호 (선택, 기본값: 1)
  limit?: number;             // 페이지 크기 (선택, 기본값: 10)
}
```

**응답** (`FinalEvaluationListResponseDto`, 200 OK):
```typescript
{
  evaluations: [                // 최종평가 목록
    {
      id: string;
      employee: {               // 직원 정보
        id: string;
        name: string;
        employeeNumber: string;
        email?: string;
      };
      period: {                 // 평가기간 정보
        id: string;
        name: string;
        startDate: Date;
        endDate: Date;
        status: string;
      };
      evaluationGrade: string;
      jobGrade: JobGrade;
      jobDetailedGrade: JobDetailedGrade;
      finalComments?: string;
      isConfirmed: boolean;
      confirmedAt?: Date | null;
      confirmedBy?: string | null;
      createdAt: Date;
      updatedAt: Date;
    }
  ];
  total: number;               // 전체 개수
  page: number;                // 현재 페이지
  limit: number;               // 페이지 크기
}
```

**테스트 케이스**:
- 기본 목록을 조회할 수 있어야 한다
- 직원 정보가 객체로 반환되어야 한다
- 평가기간 정보가 객체로 반환되어야 한다
- 페이지네이션이 작동해야 한다
- employeeId로 필터링할 수 있어야 한다
- periodId로 필터링할 수 있어야 한다
- evaluationGrade로 필터링할 수 있어야 한다
- jobGrade로 필터링할 수 있어야 한다
- jobDetailedGrade로 필터링할 수 있어야 한다
- confirmedOnly로 필터링할 수 있어야 한다
- createdAt 역순으로 정렬되어야 한다
- 응답에 필수 필드가 모두 포함되어야 한다
- 직원 객체에 필수 필드가 모두 포함되어야 한다
- 평가기간 객체에 필수 필드가 모두 포함되어야 한다
- 빈 목록도 정상적으로 반환되어야 한다
- 페이지네이션 정보가 정확해야 한다

---

### 3.3 직원-평가기간별 최종평가 조회

**엔드포인트**: `GET /admin/performance-evaluation/final-evaluations/employee/:employeeId/period/:periodId`

**요약**: 특정 직원의 특정 평가기간 최종평가를 조회합니다.

**동작**:
- 직원-평가기간 조합으로 최종평가 조회
- 직원 정보를 객체로 반환 (id, name, employeeNumber, email)
- 평가기간 정보를 객체로 반환 (id, name, startDate, endDate, status)
- 평가 등급 정보 포함 (evaluationGrade, jobGrade, jobDetailedGrade)
- 확정 정보 포함 (isConfirmed, confirmedAt, confirmedBy)
- 메타데이터 포함 (createdAt, updatedAt, createdBy, updatedBy, version)
- 존재하지 않는 조합 조회 시 null 반환 (404 에러 아님)

**경로 파라미터**:
- `employeeId`: 직원 ID (UUID)
- `periodId`: 평가기간 ID (UUID)

**응답** (`FinalEvaluationDetailDto | null`, 200 OK):
```typescript
{
  id: string;
  employee: {
    id: string;
    name: string;
    employeeNumber: string;
    email?: string;
  };
  period: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
  };
  evaluationGrade: string;
  jobGrade: JobGrade;
  jobDetailedGrade: JobDetailedGrade;
  finalComments?: string;
  isConfirmed: boolean;
  confirmedAt?: Date | null;
  confirmedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  version: number;
} | null
```

**에러 응답**:
- `400 Bad Request`: 잘못된 ID 형식
- `404 Not Found`: 최종평가를 찾을 수 없습니다. (일부 구현에서는 null 반환)

**테스트 케이스**:
- 기본 최종평가를 조회할 수 있어야 한다
- 직원 정보가 객체로 반환되어야 한다
- 평가기간 정보가 객체로 반환되어야 한다
- 평가 등급 정보가 정확히 반환되어야 한다
- 확정 정보가 정확히 반환되어야 한다
- 미확정 평가는 확정 정보가 null이어야 한다
- 잘못된 형식의 직원 ID로 조회 시 400 에러가 발생해야 한다
- 잘못된 형식의 평가기간 ID로 조회 시 400 에러가 발생해야 한다
- 존재하지 않는 직원-평가기간 조합으로 조회 시 null 또는 404 응답이 반환되어야 한다
- 응답에 필수 필드가 모두 포함되어야 한다
- 직원 객체에 필수 필드가 모두 포함되어야 한다
- 평가기간 객체에 필수 필드가 모두 포함되어야 한다
- ID가 유효한 UUID 형식이어야 한다
- 날짜가 유효한 ISO 8601 형식이어야 한다
- 조회된 데이터가 DB의 실제 데이터와 일치해야 한다
- 확정 상태가 DB와 일치해야 한다

---

## 4. DTO 구조

### 4.1 요청 DTO

#### UpsertFinalEvaluationBodyDto
```typescript
{
  evaluationGrade: string;        // 평가등급 (필수)
  jobGrade: JobGrade;            // 직무등급 (필수, enum)
  jobDetailedGrade: JobDetailedGrade; // 직무 상세등급 (필수, enum)
  finalComments?: string;        // 최종 평가 의견 (선택)
}
```

#### FinalEvaluationFilterDto
```typescript
{
  employeeId?: string;           // 직원 ID (선택)
  periodId?: string;            // 평가기간 ID (선택)
  evaluationGrade?: string;     // 평가등급 (선택)
  jobGrade?: JobGrade;         // 직무등급 (선택)
  jobDetailedGrade?: JobDetailedGrade; // 직무 상세등급 (선택)
  confirmedOnly?: boolean;      // 확정된 평가만 조회 (선택)
  page?: number;               // 페이지 번호 (선택)
  limit?: number;             // 페이지 크기 (선택)
}
```

### 4.2 응답 DTO

#### FinalEvaluationResponseDto
```typescript
{
  id: string;                    // 최종평가 ID
  message: string;               // 응답 메시지
}
```

#### FinalEvaluationDetailDto
```typescript
{
  id: string;
  employee: EmployeeBasicInfoDto;  // 직원 정보 객체
  period: PeriodBasicInfoDto;      // 평가기간 정보 객체
  evaluationGrade: string;
  jobGrade: JobGrade;
  jobDetailedGrade: JobDetailedGrade;
  finalComments?: string;
  isConfirmed: boolean;
  confirmedAt?: Date | null;
  confirmedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  version: number;
}
```

#### FinalEvaluationListResponseDto
```typescript
{
  evaluations: FinalEvaluationListItemDto[];  // 최종평가 목록
  total: number;                              // 전체 개수
  page: number;                              // 현재 페이지
  limit: number;                             // 페이지 크기
}
```

### 4.3 중첩 DTO

#### EmployeeBasicInfoDto
```typescript
{
  id: string;
  name: string;
  employeeNumber: string;
  email?: string;
}
```

#### PeriodBasicInfoDto
```typescript
{
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: string;  // 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
}
```

---

## 5. 주요 특징

### 5.1 Upsert 패턴
- 최종평가 저장은 Upsert 패턴을 사용
- 동일한 직원-평가기간 조합에 대해 하나의 평가만 존재
- 존재하면 수정, 없으면 생성

### 5.2 확정 관리
- 확정된 평가는 수정 불가
- 확정 취소 후 다시 수정 가능
- 확정 시 version 증가
- 확정 정보 (confirmedAt, confirmedBy) 추적

### 5.3 조회 최적화
- 직원 정보와 평가기간 정보를 객체로 반환하여 중복 제거
- 다양한 필터 조건 지원
- 페이지네이션 지원
- 생성일시 역순 정렬

### 5.4 데이터 무결성
- 확정된 평가 수정 방지
- 확정되지 않은 평가 확정 취소 방지
- 버전 관리로 동시성 제어

---

## 6. 연계 관계

### 6.1 다른 평가 항목과의 관계
- **현재 구현**: 최종평가 작성 시 다른 평가 항목(자기평가, 하향평가, 동료평가) 완료 여부를 검증하지 않음
- **권장 워크플로우**: 다른 평가 항목이 완료된 후 최종평가 작성 권장 (하지만 강제하지 않음)
- 대시보드에서 최종평가 작성 가능 여부 확인 가능 (확정 여부만 확인)

### 6.2 평가기간과의 관계
- 평가기간별로 최종평가 작성
- 평가기간 상태에 따라 최종평가 작성 가능 여부 결정

### 6.3 직원과의 관계
- 직원별로 최종평가 작성
- 직원-평가기간 조합으로 고유한 최종평가 존재

---

## 7. 에러 처리

### 7.1 HTTP 상태 코드
- `200 OK`: 성공적인 GET, POST (확정/취소) 요청
- `201 Created`: 성공적인 POST (저장) 요청
- `400 Bad Request`: 잘못된 요청 데이터 (필수 필드 누락, 잘못된 형식 등)
- `404 Not Found`: 리소스를 찾을 수 없음
- `409 Conflict`: 리소스 충돌 (이미 확정된 평가 등)
- `422 Unprocessable Entity`: 비즈니스 규칙 위반 (확정된 평가 수정 등)

### 7.2 주요 에러 케이스
- 확정된 평가 수정 시도 → 422 Unprocessable Entity
- 이미 확정된 평가 다시 확정 → 409 Conflict
- 확정되지 않은 평가 확정 취소 → 422 Unprocessable Entity
- 존재하지 않는 평가 조회/수정 → 404 Not Found
- 잘못된 UUID 형식 → 400 Bad Request
- 필수 필드 누락 → 400 Bad Request

---

## 8. 테스트 시나리오

### 8.1 기본 CRUD 시나리오
1. 최종평가 저장 (생성)
2. 최종평가 조회
3. 최종평가 수정 (Upsert)
4. 최종평가 확정
5. 최종평가 확정 취소
6. 최종평가 다시 수정

### 8.2 확정 관리 시나리오
1. 최종평가 저장
2. 최종평가 확정
3. 확정된 평가 수정 시도 (실패)
4. 최종평가 확정 취소
5. 확정 취소 후 다시 수정 (성공)

### 8.3 조회 시나리오
1. 최종평가 목록 조회 (필터 없음)
2. 직원별 필터링
3. 평가기간별 필터링
4. 확정된 평가만 조회
5. 페이지네이션 테스트
6. 직원-평가기간별 조회

### 8.4 데이터 무결성 시나리오
1. 동일한 직원-평가기간 조합에 여러 평가 생성 시도 (하나만 존재)
2. 확정된 평가 수정 방지
3. 확정되지 않은 평가 확정 취소 방지
4. 버전 관리 검증

---

## 9. 참고사항

### 9.1 JobGrade Enum
```typescript
enum JobGrade {
  T1 = 'T1',
  T2 = 'T2',
  T3 = 'T3',
  T4 = 'T4',
  T5 = 'T5',
}
```

### 9.2 JobDetailedGrade Enum
```typescript
enum JobDetailedGrade {
  U = 'u',  // 낮음
  N = 'n',  // 중간
  A = 'a',  // 높음
}
```

**참고**: 직무 상세등급은 소문자로 구성됩니다 (u, n, a).

### 9.3 평가등급
- 일반적으로 "S", "A", "B", "C", "D" 등 사용
- 평가기간의 gradeRanges 설정에 따라 결정

---

**이 문서는 최종평가 관리 컨트롤러의 모든 엔드포인트를 분석한 문서입니다.**

