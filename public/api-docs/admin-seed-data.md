# Admin Seed Data API

시드 데이터 생성 API 가이드 - 시나리오별 사용법

---

## 목차

1. [개요](#개요)
2. [빠른 시작](#빠른-시작)
3. [시나리오별 상세 가이드](#시나리오별-상세-가이드)
4. [API 엔드포인트](#api-엔드포인트)
5. [고급 설정](#고급-설정)
6. [참고 자료](#참고-자료)

---

## 개요

### 목적

개발 및 테스트 환경에서 사용할 현실적인 샘플 데이터를 자동으로 생성합니다.

### 평가 프로세스 3단계

평가는 다음 순서로 진행됩니다:

1. **평가기준설정** - 평가 라인, WBS 평가 기준, 질문 그룹 설정
2. **성과평가입력** - 자기평가, 하향평가, 동료평가 입력
3. **성과평가 완료** - 최종평가 및 확정

### 시나리오 개요

| 시나리오           | 생성 범위                | 평가 단계  | 추천 용도          |
| ------------------ | ------------------------ | ---------- | ------------------ |
| `minimal`          | 조직 데이터만            | -          | 초기 개발          |
| `with_period`      | + 평가기간               | -          | 기본 기능 테스트   |
| `with_assignments` | + 프로젝트/WBS 할당      | -          | 할당 기능 테스트   |
| `with_setup`       | + 평가기준설정 완료      | 1단계 완료 | 평가 설정 테스트   |
| `with_evaluations` | + 성과평가입력 완료      | 2단계 완료 | 평가 입력 테스트   |
| `full`             | + 최종평가까지 모두 완료 | 3단계 완료 | 전체 프로세스 검증 |

---

## 빠른 시작

가장 많이 사용하는 시나리오별 Request Body 예시입니다.

### 1️⃣ MINIMAL - 조직 데이터만 (초기 개발용)

```json
{
  "scenario": "minimal",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 5,
    "employeeCount": 10,
    "projectCount": 3,
    "wbsPerProject": 5
  }
}
```

### 2️⃣ WITH_PERIOD - 평가기간 포함 (기본 테스트)

```json
{
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
}
```

### 3️⃣ WITH_ASSIGNMENTS - 프로젝트/WBS 할당 포함

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
    "periodCount": 1
  }
}
```

### 4️⃣ WITH_SETUP - 평가기준설정 완료 (1단계 완료)

```json
{
  "scenario": "with_setup",
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

### 5️⃣ WITH_EVALUATIONS - 성과평가입력 완료 (2단계 완료)

```json
{
  "scenario": "with_evaluations",
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
}
```

### 6️⃣ FULL - 전체 평가 사이클 완료 (3단계 완료)

평가 진행 단계에 따라 세 가지 옵션을 제공합니다:

#### 6-1. 1차 하향평가까지 완료

```json
{
  "scenario": "full",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 2,
    "employeeCount": 10,
    "projectCount": 3,
    "wbsPerProject": 5
  },
  "evaluationConfig": {
    "periodCount": 1
  },
  "stateDistribution": {
    "selfEvaluationProgress": { "completed": 1.0 },
    "primaryDownwardEvaluationProgress": { "completed": 1.0 },
    "secondaryDownwardEvaluationProgress": { "notStarted": 1.0 },
    "peerEvaluationProgress": { "notStarted": 1.0 },
    "finalEvaluationProgress": { "notStarted": 1.0 }
  }
}
```

#### 6-2. 성과평가 입력 완료 (2차까지 완료)

```json
{
  "scenario": "full",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 2,
    "employeeCount": 10,
    "projectCount": 3,
    "wbsPerProject": 5
  },
  "evaluationConfig": {
    "periodCount": 1
  },
  "stateDistribution": {
    "selfEvaluationProgress": { "completed": 1.0 },
    "downwardEvaluationProgress": { "completed": 1.0 },
    "peerEvaluationProgress": { "completed": 1.0 },
    "finalEvaluationProgress": { "notStarted": 1.0 }
  }
}
```

#### 6-3. 최종평가까지 모두 완료

```json
{
  "scenario": "full",
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
}
```

---

## 시나리오별 상세 가이드

### MINIMAL - 조직 데이터만

**생성되는 데이터:**

- ✅ 부서 (3단계 계층: 회사 → 본부 → 파트)
- ✅ 직원
- ✅ 프로젝트
- ✅ WBS

**사용 시기:**

- 초기 개발 단계
- 조직 구조 테스트
- 최소 데이터로 빠른 확인이 필요할 때

**규모 조절:**

<details>
<summary>소규모 (디버깅용)</summary>

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

</details>

<details>
<summary>대규모 (성능 테스트용)</summary>

```json
{
  "scenario": "minimal",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 50,
    "employeeCount": 500,
    "projectCount": 100,
    "wbsPerProject": 20
  }
}
```

</details>

---

### WITH_PERIOD - 평가기간 포함

**생성되는 데이터:**

- ✅ MINIMAL 시나리오의 모든 데이터
- ✅ 평가기간
- ✅ 평가기간-직원 매핑

**사용 시기:**

- 평가기간 기능 테스트
- 다중 평가기간 시나리오 테스트

**복수 평가기간 생성:**

```json
{
  "scenario": "with_period",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 10,
    "employeeCount": 50,
    "projectCount": 10,
    "wbsPerProject": 10
  },
  "evaluationConfig": {
    "periodCount": 3
  }
}
```

---

### WITH_ASSIGNMENTS - 프로젝트/WBS 할당

**생성되는 데이터:**

- ✅ WITH_PERIOD 시나리오의 모든 데이터
- ✅ 프로젝트 할당
- ✅ WBS 할당

**사용 시기:**

- 할당 기능 테스트
- 프로젝트 관리 기능 테스트

---

### WITH_SETUP - 1단계 완료 (평가기준설정)

**생성되는 데이터:**

- ✅ WITH_ASSIGNMENTS 시나리오의 모든 데이터
- ✅ 평가 라인 (1차/2차 평가자 지정)
- ✅ WBS 평가 기준
- ✅ 질문 그룹 및 질문

**사용 시기:**

- 평가 설정 기능 테스트
- 평가 라인 검증
- 2단계(성과평가입력) 시작 전 상태 테스트

---

### WITH_EVALUATIONS - 2단계 완료 (성과평가입력)

**생성되는 데이터:**

- ✅ WITH_SETUP 시나리오의 모든 데이터
- ✅ 자기평가 (100% 완료)
- ✅ 하향평가 (100% 완료)
- ✅ 동료평가 (100% 완료)
- ❌ 최종평가 (미시작)

**사용 시기:**

- 최종평가 기능 테스트
- 평가 집계 로직 검증
- 3단계(최종평가) 시작 전 상태 테스트

**기본 Request Body:**

```json
{
  "scenario": "with_evaluations",
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
}
```

> 💡 `with_evaluations` 시나리오는 내부적으로 `full` 시나리오를 사용하되, 최종평가는 미시작 상태로 자동 설정됩니다.

---

### FULL - 3단계 완료 (최종평가까지 완료)

**생성되는 데이터:**

- ✅ WITH_EVALUATIONS 시나리오의 모든 데이터
- ✅ 최종평가 (100% 완료)

**사용 시기:**

- 전체 프로세스 검증
- 완료된 평가 조회 기능 테스트
- 통계 및 리포트 기능 테스트

**평가 진행 단계별 옵션:**

FULL 시나리오는 평가 진행 단계에 따라 세 가지 방식으로 사용할 수 있습니다:

1. **1차 하향평가까지 완료** - 자기평가 + 1차 하향평가만 완료
2. **성과평가 입력 완료** - 자기평가 + 1차/2차 하향평가 + 동료평가 완료
3. **최종평가까지 완료** - 모든 평가 완료 (기본값)

자세한 예시는 [빠른 시작](#빠른-시작) 섹션의 6번을 참고하세요.

---

## API 엔드포인트

### 생성 API

**POST** `/admin/seed/generate`

위의 시나리오별 Request Body를 사용합니다.

### 삭제 API

**DELETE** `/admin/seed/clear`

생성된 모든 시드 데이터를 삭제합니다.

⚠️ **주의**: 이 작업은 되돌릴 수 없습니다.

### 조회 API

**GET** `/admin/seed/status`

현재 시스템에 생성된 시드 데이터의 상태를 조회합니다.

---

## 고급 설정

### 평가 진행 상태 커스터마이징

`stateDistribution` 파라미터로 평가 진행 상태를 세밀하게 제어할 수 있습니다.

#### 예시 1: 직원 제외 비율 설정

조회 제외 10%, 평가 제외 15%로 설정 (조직 개편이나 구조조정 시기 테스트)

```json
{
  "scenario": "full",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 15,
    "employeeCount": 100,
    "projectCount": 10,
    "wbsPerProject": 15
  },
  "evaluationConfig": {
    "periodCount": 1
  },
  "stateDistribution": {
    "excludedFromList": 0.1,
    "excludedFromEvaluation": 0.15
  }
}
```

> 💡 **직원 제외 기능:**
>
> - `excludedFromList`: 조회 제외 대상자 (전체 목록에서 제외)
> - `excludedFromEvaluation`: 평가 제외 대상자 (평가 프로세스에서 제외)
> - 예시: 100명 중 조회 제외 10명, 평가 제외 15명 생성

#### 예시 2: 2단계 막 시작 (자기평가 5% 완료)

```json
{
  "scenario": "full",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 5,
    "employeeCount": 20,
    "projectCount": 3,
    "wbsPerProject": 10
  },
  "evaluationConfig": {
    "periodCount": 1
  },
  "stateDistribution": {
    "selfEvaluationProgress": {
      "notStarted": 0.7,
      "inProgress": 0.25,
      "completed": 0.05
    },
    "downwardEvaluationProgress": {
      "notStarted": 0.9,
      "inProgress": 0.08,
      "completed": 0.02
    },
    "peerEvaluationProgress": {
      "notStarted": 0.95,
      "inProgress": 0.05,
      "completed": 0
    },
    "finalEvaluationProgress": {
      "notStarted": 1.0
    }
  }
}
```

#### 예시 3: 2단계 80% 완료

```json
{
  "scenario": "full",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 5,
    "employeeCount": 20,
    "projectCount": 3,
    "wbsPerProject": 10
  },
  "evaluationConfig": {
    "periodCount": 1
  },
  "stateDistribution": {
    "selfEvaluationProgress": {
      "notStarted": 0.05,
      "inProgress": 0.15,
      "completed": 0.8
    },
    "downwardEvaluationProgress": {
      "completed": 0.8
    },
    "peerEvaluationProgress": {
      "completed": 0.8
    },
    "finalEvaluationProgress": {
      "notStarted": 1.0
    }
  }
}
```

#### 예시 4: 1차 하향평가만 완료 (2차는 미작성)

```json
{
  "scenario": "full",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 2,
    "employeeCount": 10,
    "projectCount": 3,
    "wbsPerProject": 5
  },
  "evaluationConfig": {
    "periodCount": 1
  },
  "stateDistribution": {
    "selfEvaluationProgress": {
      "completed": 1.0
    },
    "primaryDownwardEvaluationProgress": {
      "completed": 1.0
    },
    "secondaryDownwardEvaluationProgress": {
      "notStarted": 1.0
    },
    "peerEvaluationProgress": {
      "notStarted": 1.0
    },
    "finalEvaluationProgress": {
      "notStarted": 1.0
    }
  }
}
```

> 💡 **하향평가 옵션 설명:**
>
> - **방식 1**: `downwardEvaluationProgress` 사용 시 1차/2차 구분 없이 모두 동일하게 적용
> - **방식 2**: `primaryDownwardEvaluationProgress`와 `secondaryDownwardEvaluationProgress`를 사용하면 1차/2차를 별도로 제어 가능
> - 예시 4는 방식 2를 사용하여 1차만 완료, 2차는 미작성 상태로 설정

#### 예시 5: 3단계 진행 중 (최종평가 50% 완료)

```json
{
  "scenario": "full",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 5,
    "employeeCount": 20,
    "projectCount": 3,
    "wbsPerProject": 10
  },
  "evaluationConfig": {
    "periodCount": 1
  },
  "stateDistribution": {
    "selfEvaluationProgress": { "completed": 1.0 },
    "downwardEvaluationProgress": { "completed": 1.0 },
    "peerEvaluationProgress": { "completed": 1.0 },
    "finalEvaluationProgress": {
      "notStarted": 0.2,
      "inProgress": 0.3,
      "completed": 0.5
    }
  }
}
```

### 사용 가능한 옵션

<details>
<summary>전체 stateDistribution 옵션 보기</summary>

```typescript
{
  stateDistribution?: {
    // 직원 제외 설정 (0.0 ~ 1.0 범위)
    excludedFromList?: number;        // 조회 제외 비율 (기본: 0.0)
    excludedFromEvaluation?: number;  // 평가 제외 비율 (기본: 0.0)

    // 평가 진행 상태 (합계 1.0)
    selfEvaluationProgress?: {
      notStarted?: number;  // 기본: 0.15
      inProgress?: number;  // 기본: 0.25
      completed?: number;   // 기본: 0.60
    };

    // 하향평가 옵션 (두 가지 방식 중 선택)
    // 방식 1: 1차/2차 구분 없이 동일하게 적용
    downwardEvaluationProgress?: {
      notStarted?: number;  // 기본: 0.20
      inProgress?: number;  // 기본: 0.30
      completed?: number;   // 기본: 0.50
    };

    // 방식 2: 1차/2차 별도 지정
    primaryDownwardEvaluationProgress?: {
      notStarted?: number;  // 기본: 0.20
      inProgress?: number;  // 기본: 0.30
      completed?: number;   // 기본: 0.50
    };

    secondaryDownwardEvaluationProgress?: {
      notStarted?: number;  // 기본: 0.20
      inProgress?: number;  // 기본: 0.30
      completed?: number;   // 기본: 0.50
    };

    peerEvaluationProgress?: {
      notStarted?: number;  // 기본: 0.25
      inProgress?: number;  // 기본: 0.35
      completed?: number;   // 기본: 0.40
    };

    finalEvaluationProgress?: {
      notStarted?: number;  // 기본: 0.40
      inProgress?: number;  // 기본: 0.20
      completed?: number;   // 기본: 0.40
    };

    // 조직 데이터 상태
    employeeStatus?: {
      active?: number;      // 기본: 0.85
      onLeave?: number;     // 기본: 0.05
      resigned?: number;    // 기본: 0.10
    };

    projectStatus?: {
      active?: number;      // 기본: 0.70
      completed?: number;   // 기본: 0.25
      cancelled?: number;   // 기본: 0.05
    };

    wbsStatus?: {
      pending?: number;     // 기본: 0.20
      inProgress?: number;  // 기본: 0.60
      completed?: number;   // 기본: 0.20
    };

    // 점수 생성 설정
    scoreGeneration?: {
      min?: number;                         // 기본: 60
      max?: number;                         // 기본: 100
      distribution?: 'normal' | 'uniform';  // 기본: 'normal'
      mean?: number;                        // 기본: 80
      stdDev?: number;                      // 기본: 10
    };
  }
}
```

> 💡 **참고**:
>
> - **직원 제외 설정**: 0.0 ~ 1.0 범위의 비율로 지정
>   - `excludedFromList`: 조회 제외 대상자 비율
>   - `excludedFromEvaluation`: 평가 제외 대상자 비율
> - **평가 진행 상태**: 각 상태의 합계는 1.0이어야 합니다
> - 생략된 옵션은 기본값이 자동 적용됩니다
> - 일부만 지정해도 됩니다 (예: `{ "completed": 1.0 }`)

</details>

### 부서 계층 구조

부서는 자동으로 **회사 → 본부 → 파트** 3단계 구조로 생성됩니다.

**구조:**

- 회사: 1개 (고정)
- 본부: 나머지의 30%
- 파트: 나머지의 70%

**예시 (departmentCount=15):**

- 회사: 1개
- 본부: 4개
- 파트: 10개

**SQL로 확인:**

```sql
-- 최상위 부서 조회
SELECT * FROM department WHERE parent_department_id IS NULL;

-- 특정 부서의 하위 부서 조회
SELECT * FROM department WHERE parent_department_id = '부서ID';
```

---

## 참고 자료

### 관련 문서

- [기술 문서](../../docs/interface/admin/seed-data/seed-data-generation-guide.md)
- [Swagger UI](http://localhost:3000/api-docs)

### 관련 API

- [평가기간 관리](./admin-evaluation-period.md)
- [평가 라인 관리](./admin-evaluation-line.md)
- [WBS 할당](./admin-wbs-assignment.md)
- [프로젝트 할당](./admin-project-assignment.md)

---

## 변경 이력

| 버전  | 날짜       | 변경 내용                                                      |
| ----- | ---------- | -------------------------------------------------------------- |
| 3.3.0 | 2024-10-22 | FULL 시나리오 평가 단계별 옵션 명확화 (1차→2차→전체 순서)      |
| 3.2.0 | 2024-10-22 | 하향평가 1차/2차 별도 지정 옵션 추가                           |
| 3.1.0 | 2024-10-21 | 직원 제외 옵션 추가 (excludedFromList, excludedFromEvaluation) |
| 3.0.0 | 2024-10-21 | 시나리오별 Request Body 중심으로 문서 재구성                   |
| 2.2.0 | 2024-10-21 | WITH_EVALUATIONS 시나리오 구현 완료                            |
| 2.1.0 | 2024-10-20 | 평가 프로세스 3단계 구조로 문서 재구성                         |
| 2.0.0 | 2024-10-20 | Phase 4-8 구현 완료 (FULL 지원)                                |
| 1.0.0 | 2024-10-20 | 초기 버전 (Phase 1-3 구현)                                     |
