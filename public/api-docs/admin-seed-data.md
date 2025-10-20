# Admin Seed Data API

시드 데이터 생성/삭제/조회 API 가이드

---

## 목차

1. [개요](#개요)
2. [API 엔드포인트](#api-엔드포인트)
3. [시나리오별 사용 예제](#시나리오별-사용-예제)
4. [상태 분포 커스터마이징](#상태-분포-커스터마이징)
5. [일반적인 워크플로우](#일반적인-워크플로우)
6. [에러 처리](#에러-처리)
7. [베스트 프랙티스](#베스트-프랙티스)
8. [평가 설정 및 평가 수행 예시](#평가-설정-및-평가-수행-예시)
9. [완전한 평가 프로세스 예시](#완전한-평가-프로세스-예시)

---

## 개요

### 목적

개발 및 테스트 환경에서 사용할 현실적인 샘플 데이터를 자동으로 생성합니다.

### 주요 기능

- ✅ 다양한 시나리오 지원 (MINIMAL ~ FULL)
- ✅ 데이터 규모 조절 가능
- ✅ 상태 분포 커스터마이징
- ✅ 기존 데이터 삭제/유지 선택
- ✅ 생성 결과 상세 정보 제공

### 사용 시나리오

| 시나리오           | 사용 사례                            |
| ------------------ | ------------------------------------ |
| `minimal`          | 기본 CRUD 테스트, 조직 구조 테스트   |
| `with_period`      | 평가기간 관리 기능 테스트            |
| `with_assignments` | 프로젝트/WBS 할당 테스트             |
| `with_setup`       | 평가 기준 및 질문 관리 테스트 (TODO) |
| `full`             | 전체 평가 프로세스 E2E 테스트 (TODO) |

---

## API 엔드포인트

### 1. 시드 데이터 생성

**POST** `/admin/seed/generate`

시나리오에 따라 시드 데이터를 생성합니다.

#### Request Body

```typescript
{
  scenario: 'minimal' | 'with_period' | 'with_assignments' | 'with_setup' | 'full';
  clearExisting: boolean;                  // 기존 데이터 삭제 여부
  dataScale: {
    departmentCount: number;               // 부서 개수
    employeeCount: number;                 // 직원 개수
    projectCount: number;                  // 프로젝트 개수
    wbsPerProject: number;                 // 프로젝트당 WBS 개수
  };
  evaluationConfig?: {                     // 선택사항
    periodCount: number;                   // 평가기간 개수
  };
  stateDistribution?: {                    // 선택사항
    employeeStatus?: {
      active: number;
      onLeave: number;
      resigned: number;
    };
    // ... 기타 상태 분포
  };
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "message": "시드 데이터가 성공적으로 생성되었습니다.",
  "results": [
    {
      "phase": "Phase1",
      "entityCounts": {
        "Department": 5,
        "Employee": 10,
        "Project": 3,
        "WbsItem": 15
      },
      "generatedIds": {
        "departmentIds": ["uuid1", "uuid2", ...],
        "employeeIds": ["uuid1", "uuid2", ...],
        "projectIds": ["uuid1", "uuid2", ...],
        "wbsIds": ["uuid1", "uuid2", ...]
      },
      "duration": 73
    }
  ],
  "totalDuration": 161
}
```

#### 예제 요청

**MINIMAL 시나리오 (조직 데이터만)**

```bash
curl -X POST http://localhost:3000/admin/seed/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "scenario": "minimal",
    "clearExisting": true,
    "dataScale": {
      "departmentCount": 5,
      "employeeCount": 10,
      "projectCount": 3,
      "wbsPerProject": 5
    }
  }'
```

**WITH_PERIOD 시나리오 (평가기간 포함)**

```bash
curl -X POST http://localhost:3000/admin/seed/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "scenario": "with_period",
    "clearExisting": true,
    "dataScale": {
      "departmentCount": 10,
      "employeeCount": 50,
      "projectCount": 10,
      "wbsPerProject": 10
    },
    "evaluationConfig": {
      "periodCount": 2
    }
  }'
```

**WITH_ASSIGNMENTS 시나리오 (할당 포함)**

```bash
curl -X POST http://localhost:3000/admin/seed/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "scenario": "with_assignments",
    "clearExisting": true,
    "dataScale": {
      "departmentCount": 10,
      "employeeCount": 50,
      "projectCount": 10,
      "wbsPerProject": 10
    },
    "evaluationConfig": {
      "periodCount": 1
    }
  }'
```

#### Error Responses

**400 Bad Request** - 잘못된 요청

```json
{
  "statusCode": 400,
  "message": [
    "scenario must be a valid enum value",
    "dataScale.departmentCount must be a positive number"
  ],
  "error": "Bad Request"
}
```

**500 Internal Server Error** - 서버 오류

```json
{
  "statusCode": 500,
  "message": "시드 데이터 생성 중 오류가 발생했습니다.",
  "error": "Internal Server Error"
}
```

---

### 2. 시드 데이터 삭제

**DELETE** `/admin/seed/clear`

생성된 모든 시드 데이터를 삭제합니다.

#### Response (200 OK)

```json
{
  "message": "시드 데이터가 성공적으로 삭제되었습니다."
}
```

#### 예제 요청

```bash
curl -X DELETE http://localhost:3000/admin/seed/clear \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 주의사항

⚠️ **주의**: 이 작업은 되돌릴 수 없습니다. 모든 데이터가 영구적으로 삭제됩니다.

삭제 순서 (역순):

1. Phase 8 데이터
2. Phase 7 데이터
3. Phase 6 데이터
4. Phase 5 데이터
5. Phase 4 데이터
6. Phase 3 데이터 (할당)
7. Phase 2 데이터 (평가기간)
8. Phase 1 데이터 (조직)

---

### 3. 시드 데이터 상태 조회

**GET** `/admin/seed/status`

현재 시스템에 생성된 시드 데이터의 상태를 조회합니다.

#### Response (200 OK)

```json
{
  "hasData": true,
  "entityCounts": {
    "Department": 5,
    "Employee": 10,
    "Project": 3,
    "WbsItem": 15,
    "EvaluationPeriod": 1,
    "EvaluationPeriodEmployeeMapping": 10,
    "EvaluationProjectAssignment": 10,
    "EvaluationWbsAssignment": 30
  }
}
```

#### 예제 요청

```bash
curl -X GET http://localhost:3000/admin/seed/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 응답 필드

- `hasData`: 시드 데이터 존재 여부
- `entityCounts`: 엔티티별 개수
  - 0개인 경우에도 필드는 포함됨

---

## 시나리오별 사용 예제

### 1. 소규모 개발 환경

**목적**: 빠른 개발/디버깅

```json
{
  "scenario": "minimal",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 3,
    "employeeCount": 5,
    "projectCount": 2,
    "wbsPerProject": 3
  }
}
```

**생성 데이터**:

- Department: 3개
- Employee: 5명
- Project: 2개
- WbsItem: 6개
- **소요 시간**: ~50ms

---

### 2. 중규모 테스트 환경

**목적**: 기능 테스트, 통합 테스트

```json
{
  "scenario": "with_assignments",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 10,
    "employeeCount": 50,
    "projectCount": 10,
    "wbsPerProject": 10
  },
  "evaluationConfig": {
    "periodCount": 2
  }
}
```

**생성 데이터**:

- Department: 10개
- Employee: 50명
- Project: 10개
- WbsItem: 100개
- EvaluationPeriod: 2개
- Mappings + Assignments: 100+개
- **소요 시간**: ~300ms

---

### 3. 대규모 성능 테스트

**목적**: 성능 테스트, 부하 테스트

```json
{
  "scenario": "with_assignments",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 50,
    "employeeCount": 500,
    "projectCount": 100,
    "wbsPerProject": 20
  },
  "evaluationConfig": {
    "periodCount": 3
  }
}
```

**생성 데이터**:

- Department: 50개
- Employee: 500명
- Project: 100개
- WbsItem: 2,000개
- EvaluationPeriod: 3개
- Mappings + Assignments: 1,500+개
- **소요 시간**: ~2-3초

---

### 4. 기존 데이터 유지하며 추가

**목적**: 특정 데이터만 추가

```json
{
  "scenario": "minimal",
  "clearExisting": false,
  "dataScale": {
    "departmentCount": 2,
    "employeeCount": 10,
    "projectCount": 1,
    "wbsPerProject": 5
  }
}
```

**동작**:

- 기존 데이터는 그대로 유지
- 새로운 데이터만 추가 생성

---

## 상태 분포 커스터마이징

### 기본 상태 분포

설정하지 않으면 다음 기본값 사용:

```json
{
  "employeeStatus": {
    "active": 0.7, // 70% 재직중
    "onLeave": 0.2, // 20% 휴직중
    "resigned": 0.1 // 10% 퇴사
  },
  "projectStatus": {
    "active": 0.6, // 60% 진행중
    "completed": 0.3, // 30% 완료
    "cancelled": 0.1 // 10% 취소
  },
  "wbsStatus": {
    "pending": 0.3, // 30% 대기
    "inProgress": 0.5, // 50% 진행중
    "completed": 0.2 // 20% 완료
  }
}
```

### 커스텀 분포 예제

**대부분 재직 중인 조직**

```json
{
  "scenario": "minimal",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 10,
    "employeeCount": 100,
    "projectCount": 10,
    "wbsPerProject": 10
  },
  "stateDistribution": {
    "employeeStatus": {
      "active": 0.95,
      "onLeave": 0.03,
      "resigned": 0.02
    }
  }
}
```

**대부분 완료된 프로젝트**

```json
{
  "scenario": "minimal",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 5,
    "employeeCount": 20,
    "projectCount": 20,
    "wbsPerProject": 5
  },
  "stateDistribution": {
    "projectStatus": {
      "active": 0.1,
      "completed": 0.8,
      "cancelled": 0.1
    }
  }
}
```

---

## 일반적인 워크플로우

### 개발 환경 초기 설정

```bash
# 1. 기존 데이터 확인
curl -X GET http://localhost:3000/admin/seed/status

# 2. 소규모 데이터 생성
curl -X POST http://localhost:3000/admin/seed/generate \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "minimal",
    "clearExisting": true,
    "dataScale": {
      "departmentCount": 3,
      "employeeCount": 10,
      "projectCount": 2,
      "wbsPerProject": 5
    }
  }'
```

### 테스트 전 데이터 초기화

```bash
# 1. 기존 데이터 삭제
curl -X DELETE http://localhost:3000/admin/seed/clear

# 2. 테스트용 데이터 생성
curl -X POST http://localhost:3000/admin/seed/generate \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "with_assignments",
    "clearExisting": true,
    "dataScale": {
      "departmentCount": 10,
      "employeeCount": 50,
      "projectCount": 10,
      "wbsPerProject": 10
    },
    "evaluationConfig": {
      "periodCount": 1
    }
  }'
```

### 데이터 추가 (기존 유지)

```bash
# clearExisting: false로 설정
curl -X POST http://localhost:3000/admin/seed/generate \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "minimal",
    "clearExisting": false,
    "dataScale": {
      "departmentCount": 5,
      "employeeCount": 20,
      "projectCount": 5,
      "wbsPerProject": 5
    }
  }'
```

---

## 에러 처리

### 일반적인 에러 케이스

#### 1. 필수 필드 누락

**Request**:

```json
{
  "scenario": "minimal",
  "clearExisting": true
  // dataScale 누락
}
```

**Response (400)**:

```json
{
  "statusCode": 400,
  "message": ["dataScale should not be empty"],
  "error": "Bad Request"
}
```

#### 2. 잘못된 시나리오 값

**Request**:

```json
{
  "scenario": "invalid_scenario",
  "clearExisting": true,
  "dataScale": { ... }
}
```

**Response (400)**:

```json
{
  "statusCode": 400,
  "message": [
    "scenario must be one of the following values: minimal, with_period, with_assignments, with_setup, full"
  ],
  "error": "Bad Request"
}
```

#### 3. 음수 또는 0 값

**Request**:

```json
{
  "scenario": "minimal",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 0, // 0은 허용 안 됨
    "employeeCount": -5 // 음수는 허용 안 됨
  }
}
```

**Response (400)**:

```json
{
  "statusCode": 400,
  "message": [
    "dataScale.departmentCount must not be less than 1",
    "dataScale.employeeCount must not be less than 1"
  ],
  "error": "Bad Request"
}
```

---

## 베스트 프랙티스

### 1. 개발 시작 시

```json
{
  "scenario": "with_assignments",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 5,
    "employeeCount": 10,
    "projectCount": 3,
    "wbsPerProject": 5
  },
  "evaluationConfig": {
    "periodCount": 1
  }
}
```

### 2. E2E 테스트 전

```json
{
  "scenario": "with_assignments",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 10,
    "employeeCount": 30,
    "projectCount": 5,
    "wbsPerProject": 10
  },
  "evaluationConfig": {
    "periodCount": 1
  }
}
```

### 3. 성능 테스트

```json
{
  "scenario": "with_assignments",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 50,
    "employeeCount": 500,
    "projectCount": 100,
    "wbsPerProject": 20
  },
  "evaluationConfig": {
    "periodCount": 3
  }
}
```

---

## 평가 설정 및 평가 수행 예시

시드 데이터 생성 후 실제 평가를 진행하기 위한 설정 및 평가 수행 예시입니다.

### 1. 평가기간 생성

**POST** `/admin/evaluation-periods`

시드 데이터로 조직 데이터를 생성한 후, 평가기간을 생성합니다.

```json
{
  "name": "2024년 하반기 성과평가",
  "startDate": "2024-10-01",
  "endDate": "2024-12-31",
  "selfEvaluationDeadline": "2024-11-15",
  "firstEvaluationDeadline": "2024-11-30",
  "secondEvaluationDeadline": "2024-12-15",
  "finalEvaluationDeadline": "2024-12-31",
  "gradeRanges": [
    { "grade": "S", "minScore": 95, "maxScore": 100 },
    { "grade": "A", "minScore": 85, "maxScore": 94 },
    { "grade": "B", "minScore": 75, "maxScore": 84 },
    { "grade": "C", "minScore": 60, "maxScore": 74 },
    { "grade": "D", "minScore": 0, "maxScore": 59 }
  ]
}
```

### 2. 평가 대상자 등록

**POST** `/admin/evaluation-periods/:periodId/targets`

평가기간에 직원들을 평가 대상으로 등록합니다.

#### 단일 등록

```json
{
  "employeeId": "uuid-employee-1"
}
```

#### 대량 등록

**POST** `/admin/evaluation-periods/:periodId/targets/bulk`

```json
{
  "employeeIds": [
    "uuid-employee-1",
    "uuid-employee-2",
    "uuid-employee-3",
    "uuid-employee-4",
    "uuid-employee-5"
  ]
}
```

### 3. 프로젝트 할당

**POST** `/admin/evaluation-periods/:periodId/project-assignments`

평가 대상 직원들에게 프로젝트를 할당합니다.

#### 단일 할당

```json
{
  "employeeId": "uuid-employee-1",
  "projectId": "uuid-project-1",
  "assignedBy": "uuid-admin",
  "assignedDate": "2024-10-01"
}
```

#### 대량 할당

**POST** `/admin/evaluation-periods/:periodId/project-assignments/bulk`

```json
{
  "assignments": [
    {
      "employeeId": "uuid-employee-1",
      "projectId": "uuid-project-1"
    },
    {
      "employeeId": "uuid-employee-1",
      "projectId": "uuid-project-2"
    },
    {
      "employeeId": "uuid-employee-2",
      "projectId": "uuid-project-1"
    }
  ],
  "assignedBy": "uuid-admin",
  "assignedDate": "2024-10-01"
}
```

### 4. WBS 할당

**POST** `/admin/evaluation-periods/:periodId/wbs-assignments`

프로젝트 내 WBS 항목을 직원에게 할당합니다.

#### 단일 WBS 할당

```json
{
  "employeeId": "uuid-employee-1",
  "wbsItemId": "uuid-wbs-1",
  "assignedBy": "uuid-admin",
  "assignedDate": "2024-10-01"
}
```

#### 프로젝트별 WBS 대량 할당

**POST** `/admin/evaluation-periods/:periodId/wbs-assignments/bulk`

```json
{
  "assignments": [
    {
      "employeeId": "uuid-employee-1",
      "wbsItemId": "uuid-wbs-1"
    },
    {
      "employeeId": "uuid-employee-1",
      "wbsItemId": "uuid-wbs-2"
    },
    {
      "employeeId": "uuid-employee-2",
      "wbsItemId": "uuid-wbs-3"
    }
  ],
  "assignedBy": "uuid-admin",
  "assignedDate": "2024-10-01"
}
```

### 5. 평가 라인 설정

**POST** `/admin/evaluation-periods/:periodId/evaluation-lines`

피평가자의 1차/2차 평가자를 설정합니다.

```json
{
  "evaluateeId": "uuid-employee-1",
  "firstEvaluators": [
    {
      "evaluatorId": "uuid-manager-1",
      "order": 1
    }
  ],
  "secondEvaluators": [
    {
      "evaluatorId": "uuid-director-1",
      "order": 1
    }
  ]
}
```

### 6. WBS 평가 기준 설정

**POST** `/admin/wbs-evaluation-criteria`

WBS 항목별 평가 기준을 설정합니다.

```json
{
  "wbsItemId": "uuid-wbs-1",
  "criteria": [
    {
      "name": "업무 완성도",
      "description": "할당된 업무의 완성도 평가",
      "weight": 40,
      "order": 1
    },
    {
      "name": "업무 품질",
      "description": "결과물의 품질 평가",
      "weight": 30,
      "order": 2
    },
    {
      "name": "일정 준수",
      "description": "계획 대비 일정 준수율",
      "weight": 30,
      "order": 3
    }
  ]
}
```

### 7. WBS 자기평가 저장 및 제출

**POST** `/admin/wbs-self-evaluations/:evaluationId`

직원이 할당받은 WBS에 대해 자기평가를 작성합니다.

#### 자기평가 저장 (임시 저장)

```json
{
  "scores": [
    {
      "criteriaId": "uuid-criteria-1",
      "score": 85,
      "comment": "프로젝트 일정에 맞춰 주요 기능을 완성했습니다."
    },
    {
      "criteriaId": "uuid-criteria-2",
      "score": 90,
      "comment": "코드 리뷰를 통해 품질을 개선했습니다."
    },
    {
      "criteriaId": "uuid-criteria-3",
      "score": 80,
      "comment": "일부 지연이 있었으나 최종 마감일은 준수했습니다."
    }
  ],
  "overallComment": "프로젝트에서 핵심 역할을 수행하며 목표를 달성했습니다.",
  "achievements": "신규 기능 3건 개발 완료",
  "improvements": "일정 관리 능력 향상 필요"
}
```

#### 자기평가 제출

**POST** `/admin/wbs-self-evaluations/:evaluationId/submit`

```json
{}
```

#### 직원별 일괄 제출

**POST** `/admin/wbs-self-evaluations/submit-by-employee/:employeeId`

```json
{
  "periodId": "uuid-period-1"
}
```

### 8. 하향평가 (1차 평가)

**POST** `/admin/downward-evaluations/:evaluationId/first`

1차 평가자가 피평가자를 평가합니다.

```json
{
  "scores": [
    {
      "criteriaId": "uuid-criteria-1",
      "score": 88,
      "comment": "요구사항을 정확히 이해하고 구현했습니다."
    },
    {
      "criteriaId": "uuid-criteria-2",
      "score": 85,
      "comment": "코드 품질이 우수하며 유지보수가 용이합니다."
    },
    {
      "criteriaId": "uuid-criteria-3",
      "score": 82,
      "comment": "일정 관리가 필요하지만 전반적으로 양호합니다."
    }
  ],
  "overallComment": "프로젝트에 적극적으로 참여하며 좋은 성과를 냈습니다.",
  "strengths": "기술력과 문제 해결 능력이 우수함",
  "improvements": "일정 관리 및 커뮤니케이션 개선 필요"
}
```

#### 1차 평가 제출

**POST** `/admin/downward-evaluations/:evaluationId/first/submit`

```json
{}
```

### 9. 하향평가 (2차 평가)

**POST** `/admin/downward-evaluations/:evaluationId/second`

2차 평가자가 피평가자를 평가합니다.

```json
{
  "scores": [
    {
      "criteriaId": "uuid-criteria-1",
      "score": 90,
      "comment": "프로젝트 목표를 초과 달성했습니다."
    },
    {
      "criteriaId": "uuid-criteria-2",
      "score": 88,
      "comment": "높은 품질의 결과물을 지속적으로 제공합니다."
    },
    {
      "criteriaId": "uuid-criteria-3",
      "score": 85,
      "comment": "일정 준수율이 개선되었습니다."
    }
  ],
  "overallComment": "팀의 핵심 인력으로 성장했습니다.",
  "strengths": "리더십과 기술력을 겸비함",
  "improvements": "프로젝트 관리 역량 강화"
}
```

#### 2차 평가 제출

**POST** `/admin/downward-evaluations/:evaluationId/second/submit`

```json
{}
```

### 10. 동료평가 요청

**POST** `/admin/peer-evaluations/requests`

평가자에게 피평가자에 대한 동료평가를 요청합니다.

#### 단일 요청

```json
{
  "evaluatorId": "uuid-employee-2",
  "evaluateeId": "uuid-employee-1",
  "periodId": "uuid-period-1",
  "requestedBy": "uuid-admin"
}
```

#### 일괄 요청

**POST** `/admin/peer-evaluations/requests/bulk`

```json
{
  "requests": [
    {
      "evaluatorId": "uuid-employee-2",
      "evaluateeId": "uuid-employee-1"
    },
    {
      "evaluatorId": "uuid-employee-3",
      "evaluateeId": "uuid-employee-1"
    },
    {
      "evaluatorId": "uuid-employee-4",
      "evaluateeId": "uuid-employee-1"
    }
  ],
  "periodId": "uuid-period-1",
  "requestedBy": "uuid-admin"
}
```

### 11. 동료평가 제출

**POST** `/admin/peer-evaluations/:evaluationId/submit`

평가자가 동료평가를 작성하고 제출합니다.

```json
{
  "responses": [
    {
      "questionId": "uuid-question-1",
      "response": "매우 우수한 협업 능력을 보여줍니다."
    },
    {
      "questionId": "uuid-question-2",
      "response": "프로젝트에서 적극적으로 의견을 제시하며 팀에 기여합니다."
    },
    {
      "questionId": "uuid-question-3",
      "response": "기술적 지식이 뛰어나며 동료들에게 도움을 줍니다."
    }
  ],
  "overallComment": "함께 일하고 싶은 훌륭한 동료입니다.",
  "score": 90
}
```

### 12. 최종평가 저장 및 확정

**POST** `/admin/final-evaluations`

모든 평가를 종합하여 최종평가를 저장합니다.

#### 최종평가 저장

```json
{
  "periodId": "uuid-period-1",
  "employeeId": "uuid-employee-1",
  "totalScore": 87.5,
  "grade": "A",
  "comment": "전반적으로 우수한 성과를 달성했으며, 팀에 긍정적인 영향을 미쳤습니다.",
  "strengths": "기술력, 협업 능력, 문제 해결 능력",
  "improvements": "프로젝트 관리 및 일정 준수 능력 향상 필요",
  "goals": "다음 평가 기간에는 프로젝트 리더 역할 수행"
}
```

#### 최종평가 확정

**POST** `/admin/final-evaluations/:evaluationId/confirm`

```json
{
  "confirmedBy": "uuid-director-1",
  "confirmedAt": "2024-12-31T23:59:59Z"
}
```

---

## 완전한 평가 프로세스 예시

시드 데이터 생성부터 최종평가까지 전체 프로세스를 순서대로 실행하는 예시입니다.

### Step 1: 시드 데이터 생성

```bash
curl -X POST http://localhost:3000/admin/seed/generate \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "with_assignments",
    "clearExisting": true,
    "dataScale": {
      "departmentCount": 5,
      "employeeCount": 20,
      "projectCount": 3,
      "wbsPerProject": 10
    },
    "evaluationConfig": {
      "periodCount": 1
    }
  }'
```

### Step 2: 평가 라인 설정

```bash
# 각 직원별로 1차/2차 평가자 설정
curl -X POST http://localhost:3000/admin/evaluation-periods/{periodId}/evaluation-lines \
  -H "Content-Type: application/json" \
  -d '{
    "evaluateeId": "{employeeId}",
    "firstEvaluators": [{"evaluatorId": "{managerId}", "order": 1}],
    "secondEvaluators": [{"evaluatorId": "{directorId}", "order": 1}]
  }'
```

### Step 3: WBS 평가 기준 설정

```bash
# 각 WBS 항목별로 평가 기준 설정
curl -X POST http://localhost:3000/admin/wbs-evaluation-criteria \
  -H "Content-Type: application/json" \
  -d '{
    "wbsItemId": "{wbsItemId}",
    "criteria": [
      {"name": "업무 완성도", "weight": 40, "order": 1},
      {"name": "업무 품질", "weight": 30, "order": 2},
      {"name": "일정 준수", "weight": 30, "order": 3}
    ]
  }'
```

### Step 4: 자기평가 작성 및 제출

```bash
# 직원이 자기평가 작성
curl -X POST http://localhost:3000/admin/wbs-self-evaluations/{evaluationId} \
  -H "Content-Type: application/json" \
  -d '{
    "scores": [
      {"criteriaId": "{criteriaId}", "score": 85, "comment": "..."}
    ],
    "overallComment": "..."
  }'

# 자기평가 제출
curl -X POST http://localhost:3000/admin/wbs-self-evaluations/{evaluationId}/submit
```

### Step 5: 하향평가 (1차)

```bash
# 1차 평가자가 평가 작성 및 제출
curl -X POST http://localhost:3000/admin/downward-evaluations/{evaluationId}/first \
  -H "Content-Type: application/json" \
  -d '{
    "scores": [
      {"criteriaId": "{criteriaId}", "score": 88, "comment": "..."}
    ],
    "overallComment": "..."
  }'

curl -X POST http://localhost:3000/admin/downward-evaluations/{evaluationId}/first/submit
```

### Step 6: 하향평가 (2차)

```bash
# 2차 평가자가 평가 작성 및 제출
curl -X POST http://localhost:3000/admin/downward-evaluations/{evaluationId}/second \
  -H "Content-Type: application/json" \
  -d '{
    "scores": [
      {"criteriaId": "{criteriaId}", "score": 90, "comment": "..."}
    ],
    "overallComment": "..."
  }'

curl -X POST http://localhost:3000/admin/downward-evaluations/{evaluationId}/second/submit
```

### Step 7: 동료평가

```bash
# 동료평가 요청
curl -X POST http://localhost:3000/admin/peer-evaluations/requests/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      {"evaluatorId": "{peer1}", "evaluateeId": "{employeeId}"},
      {"evaluatorId": "{peer2}", "evaluateeId": "{employeeId}"}
    ],
    "periodId": "{periodId}"
  }'

# 동료평가 제출
curl -X POST http://localhost:3000/admin/peer-evaluations/{evaluationId}/submit \
  -H "Content-Type: application/json" \
  -d '{
    "responses": [
      {"questionId": "{questionId}", "response": "..."}
    ],
    "score": 90
  }'
```

### Step 8: 최종평가

```bash
# 최종평가 저장
curl -X POST http://localhost:3000/admin/final-evaluations \
  -H "Content-Type: application/json" \
  -d '{
    "periodId": "{periodId}",
    "employeeId": "{employeeId}",
    "totalScore": 87.5,
    "grade": "A",
    "comment": "..."
  }'

# 최종평가 확정
curl -X POST http://localhost:3000/admin/final-evaluations/{evaluationId}/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "confirmedBy": "{directorId}"
  }'
```

---

## 참고 자료

- [기술 문서](../../docs/interface/admin/seed-data/seed-data-generation-guide.md)
- [Swagger UI](http://localhost:3000/api-docs)
- [GitHub Repository](https://github.com/your-repo)

---

## 변경 이력

| 버전  | 날짜       | 변경 내용                  |
| ----- | ---------- | -------------------------- |
| 1.0.0 | 2024-10-20 | 초기 버전 (Phase 1-3 구현) |

---

## 문의

기술 지원이 필요하시면 개발팀에 문의해주세요.
