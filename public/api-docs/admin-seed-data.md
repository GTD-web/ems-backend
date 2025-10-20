# Admin Seed Data API

시드 데이터 생성/삭제/조회 API 가이드

---

## 목차

1. [개요](#개요)
2. [평가 프로세스 단계](#평가-프로세스-단계)
3. [API 엔드포인트](#api-엔드포인트)
4. [규모별 사용 예제](#규모별-사용-예제)
5. [상태 분포 커스터마이징](#상태-분포-커스터마이징)
6. [참고 자료](#참고-자료)

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

### 평가 프로세스 단계

평가는 다음 3단계로 진행되며, **각 단계는 이전 단계가 완료되어야 합니다**:

1. **평가기준설정** - 평가 라인, WBS 평가 기준, 질문 그룹 등 설정
2. **성과평가입력** - 자기평가, 하향평가, 동료평가 입력
3. **성과평가 완료** - 최종평가 및 확정

### 시나리오별 생성 범위

| 시나리오           | 생성 범위                                 | 평가 단계  | 상태        |
| ------------------ | ----------------------------------------- | ---------- | ----------- |
| `minimal`          | 조직 데이터만 (부서, 직원, 프로젝트, WBS) | -          | ✅ 구현완료 |
| `with_period`      | + 평가기간, 직원 매핑                     | -          | ✅ 구현완료 |
| `with_assignments` | + 프로젝트/WBS 할당                       | -          | ✅ 구현완료 |
| `with_setup`       | + **평가기준설정 완료**                   | 1단계 완료 | ✅ 구현완료 |
| `with_evaluations` | + **성과평가입력 완료**                   | 2단계 완료 | ✅ 구현완료 |
| `full`             | + **성과평가 완료** (최종평가까지 완료)   | 3단계 완료 | ✅ 구현완료 |

> 💡 **참고**: `with_evaluations` 시나리오는 `full` 시나리오와 동일하게 동작하며, `stateDistribution`을 통해 평가 진행 상태를 세밀하게 제어할 수 있습니다.

---

## API 엔드포인트

### 1. 시드 데이터 생성

**POST** `/admin/seed/generate`

#### 시나리오별 Request Body

**1. MINIMAL - 조직 데이터만**

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

**2. WITH_PERIOD - 평가기간 포함**

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

**3. WITH_ASSIGNMENTS - 할당 포함**

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

**4. WITH_SETUP - 1단계: 평가기준설정 완료**

평가 라인, WBS 평가 기준, 질문 그룹 등이 **모두 설정 완료**된 상태

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

**5. WITH_EVALUATIONS - 2단계: 성과평가입력 완료** ✅

자기평가, 하향평가, 동료평가가 **모두 입력 완료**된 상태 (최종평가는 미시작)

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
  },
  "stateDistribution": {
    "selfEvaluationProgress": {
      "completed": 1.0
    },
    "downwardEvaluationProgress": {
      "completed": 1.0
    },
    "peerEvaluationProgress": {
      "completed": 1.0
    },
    "finalEvaluationProgress": {
      "notStarted": 1.0
    }
  }
}
```

> 💡 **팁**: `with_evaluations`는 내부적으로 `full` 시나리오와 동일하게 동작하며, 기본 `stateDistribution`이 2단계 완료 상태로 설정됩니다.

**6. FULL - 3단계: 성과평가 완료**

최종평가까지 **모두 완료**된 상태

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
      "notStarted": 0,
      "inProgress": 0,
      "completed": 1.0
    },
    "downwardEvaluationProgress": {
      "notStarted": 0,
      "inProgress": 0,
      "completed": 1.0
    },
    "peerEvaluationProgress": {
      "notStarted": 0,
      "inProgress": 0,
      "completed": 1.0
    },
    "finalEvaluationProgress": {
      "notStarted": 0,
      "inProgress": 0,
      "completed": 1.0
    }
  }
}
```

---

### 2. 시드 데이터 삭제

**DELETE** `/admin/seed/clear`

생성된 모든 시드 데이터를 삭제합니다.

⚠️ **주의**: 이 작업은 되돌릴 수 없습니다.

---

### 3. 시드 데이터 상태 조회

**GET** `/admin/seed/status`

현재 시스템에 생성된 시드 데이터의 상태를 조회합니다.

---

## 규모별 사용 예제

### 소규모 (개발/디버깅)

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

### 중규모 (기능 테스트)

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

### 대규모 (성능 테스트)

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

### 1단계 완료: 평가기준설정

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

### 2단계 완료: 성과평가입력

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
    "departmentHierarchy": {
      "maxDepth": 3,
      "childrenPerParent": {
        "min": 0,
        "max": 3
      },
      "rootDepartmentRatio": 0.2
    },
    "selfEvaluationProgress": { "completed": 1.0 },
    "downwardEvaluationProgress": { "completed": 1.0 },
    "peerEvaluationProgress": { "completed": 1.0 },
    "finalEvaluationProgress": { "notStarted": 1.0 }
  }
}
```

### 3단계 완료: 성과평가 완료

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
    "departmentHierarchy": {
      "maxDepth": 3,
      "childrenPerParent": {
        "min": 0,
        "max": 3
      },
      "rootDepartmentRatio": 0.2
    },
    "selfEvaluationProgress": { "completed": 1.0 },
    "downwardEvaluationProgress": { "completed": 1.0 },
    "peerEvaluationProgress": { "completed": 1.0 },
    "finalEvaluationProgress": { "completed": 1.0 }
  }
}
```

---

## 상태 분포 커스터마이징

`stateDistribution` 파라미터로 엔티티별 상태 비율을 조정할 수 있습니다.

### 사용 가능한 전체 옵션

```typescript
{
  stateDistribution?: {
    // === Phase 1: 조직 데이터 ===

    // ⚠️ 부서는 자동으로 3단계 고정 구조로 생성됩니다 (회사 → 본부 → 파트)
    //    - 회사: 1개 (고정)
    //    - 본부: 나머지의 30%
    //    - 파트: 나머지의 70%
    //    - parentDepartmentId로 자동 계층 관계 설정

    // 직원 상태 분포 (합계 1.0)
    employeeStatus?: {
      active: number;    // 재직중 (기본: 0.85)
      onLeave: number;   // 휴직중 (기본: 0.05)
      resigned: number;  // 퇴사 (기본: 0.10)
    };

    // 프로젝트 상태 분포 (합계 1.0)
    projectStatus?: {
      active: number;     // 진행중 (기본: 0.70)
      completed: number;  // 완료 (기본: 0.25)
      cancelled: number;  // 취소 (기본: 0.05)
    };

    // WBS 상태 분포 (합계 1.0)
    wbsStatus?: {
      pending: number;     // 대기 (기본: 0.20)
      inProgress: number;  // 진행중 (기본: 0.60)
      completed: number;   // 완료 (기본: 0.20)
    };

    // === Phase 2: 평가기간 ===

    // 평가기간 상태 분포 (합계 1.0)
    evaluationPeriodStatus?: {
      waiting: number;     // 대기 (기본: 0.20)
      inProgress: number;  // 진행중 (기본: 0.70)
      completed: number;   // 완료 (기본: 0.10)
    };

    // 평가기간 현재 단계 분포 (inProgress일 때만 적용, 합계 1.0)
    evaluationPeriodPhase?: {
      evaluationSetup: number;  // 평가설정 (기본: 0.20)
      performance: number;      // 업무수행 (기본: 0.20)
      selfEvaluation: number;   // 자기평가 (기본: 0.25)
      peerEvaluation: number;   // 하향/동료평가 (기본: 0.25)
      closure: number;          // 종결 (기본: 0.10)
    };

    // === Phase 7: 평가 실행 ===

    // 자기평가 진행 상태 (합계 1.0)
    selfEvaluationProgress?: {
      notStarted: number;  // 미작성 (기본: 0.15)
      inProgress: number;  // 진행중 (기본: 0.25)
      completed: number;   // 완료 (기본: 0.60)
    };

    // 하향평가 진행 상태 (합계 1.0)
    downwardEvaluationProgress?: {
      notStarted: number;  // 미작성 (기본: 0.20)
      inProgress: number;  // 진행중 (기본: 0.30)
      completed: number;   // 완료 (기본: 0.50)
    };

    // 하향평가 평가자 구성 (1차만/2차만/둘다, 합계 1.0)
    downwardEvaluationTypes?: {
      primaryOnly: number;    // 1차 평가자만 (기본: 0.20)
      secondaryOnly: number;  // 2차 평가자만 (기본: 0.10)
      both: number;           // 1,2차 모두 (기본: 0.70)
    };

    // 동료평가 진행 상태 (합계 1.0)
    peerEvaluationProgress?: {
      notStarted: number;  // 미작성 (기본: 0.25)
      inProgress: number;  // 진행중 (기본: 0.35)
      completed: number;   // 완료 (기본: 0.40)
    };

    // 동료평가자 수 분포 (합계 1.0)
    peerEvaluatorCount?: {
      one: number;        // 1명 (기본: 0.20)
      two: number;        // 2명 (기본: 0.40)
      three: number;      // 3명 (기본: 0.30)
      fourOrMore: number; // 4명 이상 (기본: 0.10)
    };

    // 최종평가 진행 상태 (합계 1.0)
    finalEvaluationProgress?: {
      notStarted: number;  // 미작성 (기본: 0.40)
      inProgress: number;  // 진행중 (기본: 0.20)
      completed: number;   // 완료 (기본: 0.40)
    };

    // 점수 생성 설정
    scoreGeneration?: {
      min: number;                          // 최소 점수 (기본: 60)
      max: number;                          // 최대 점수 (기본: 100)
      distribution: 'normal' | 'uniform';   // 분포 방식 (기본: 'normal')
      mean: number;                         // 정규분포 평균 (기본: 80)
      stdDev: number;                       // 정규분포 표준편차 (기본: 10)
    };

    // === Phase 8: 평가 응답 ===

    // 평가 응답 생성 비율 (합계 1.0)
    evaluationResponseRatio?: {
      noResponse: number;   // 응답 없음 (기본: 0.10)
      hasResponse: number;  // 응답 있음 (기본: 0.90)
    };
  }
}
```

> **💡 팁**:
>
> - 각 상태 분포의 합계는 **1.0**이어야 합니다
> - 기본값은 생략 가능하며, 생략 시 위 기본값이 적용됩니다
> - 일부 옵션만 지정하면 나머지는 기본값이 자동 적용됩니다

### 예시 1: 1단계 완료 후 2단계 시작

1단계(평가기준설정)는 완료, 2단계(성과평가입력)는 막 시작

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
      "notStarted": 1.0,
      "inProgress": 0,
      "completed": 0
    }
  }
}
```

### 예시 2: 2단계 진행 중

1단계(평가기준설정)는 완료, 2단계(성과평가입력)는 80% 완료

```json
{
  "scenario": "full",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 5,
    "employeeCount": 20,
    "projectCount": 5,
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
      "notStarted": 0.05,
      "inProgress": 0.15,
      "completed": 0.8
    },
    "peerEvaluationProgress": {
      "notStarted": 0.1,
      "inProgress": 0.1,
      "completed": 0.8
    },
    "finalEvaluationProgress": {
      "notStarted": 1.0,
      "inProgress": 0,
      "completed": 0
    }
  }
}
```

### 예시 3: 2단계 완료 후 3단계 진행 중

1,2단계 완료, 3단계(최종평가)는 50% 완료

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
      "completed": 1.0
    },
    "downwardEvaluationProgress": {
      "completed": 1.0
    },
    "peerEvaluationProgress": {
      "completed": 1.0
    },
    "finalEvaluationProgress": {
      "notStarted": 0.2,
      "inProgress": 0.3,
      "completed": 0.5
    }
  }
}
```

### 예시 4: 점수 분포 조정

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
    "scoreGeneration": {
      "min": 70,
      "max": 100,
      "distribution": "normal",
      "mean": 85,
      "stdDev": 8
    }
  }
}
```

### 예시 5: 부서 계층 구조 (3단계 고정) 🏢

⚠️ 부서는 자동으로 **회사 → 본부 → 파트** 3단계 고정 구조로 생성됩니다.

#### 소규모 조직 (departmentCount=15)

```json
{
  "scenario": "minimal",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 15,
    "employeeCount": 50,
    "projectCount": 5,
    "wbsPerProject": 8
  }
}
```

**생성 결과**:

- 회사: 1개 (고정)
- 본부: 4개 ((15-1) × 0.3 ≈ 4)
- 파트: 10개 (15 - 1 - 4 = 10)

**생성 구조 예시**:

```
[회사] ABC 회사 (parentDepartmentId: null)
  ├─ [본부] 개발 본부 (parentDepartmentId: ABC회사.id)
  │   ├─ [파트] 프론트엔드 파트 (parentDepartmentId: 개발본부.id)
  │   ├─ [파트] 백엔드 파트 (parentDepartmentId: 개발본부.id)
  │   └─ [파트] DevOps 파트 (parentDepartmentId: 개발본부.id)
  └─ [본부] 영업 본부 (parentDepartmentId: ABC회사.id)
      ├─ [파트] 서울영업 파트 (parentDepartmentId: 영업본부.id)
      └─ [파트] 부산영업 파트 (parentDepartmentId: 영업본부.id)
```

#### 대규모 조직 (departmentCount=50)

```json
{
  "scenario": "minimal",
  "clearExisting": true,
  "dataScale": {
    "departmentCount": 50,
    "employeeCount": 200,
    "projectCount": 10,
    "wbsPerProject": 10
  }
}
```

**생성 결과**:

- 회사: 1개 (고정)
- 본부: 15개 ((50-1) × 0.3 ≈ 15)
- 파트: 34개 (50 - 1 - 15 = 34)

**계층 분포**:

- 1개 회사 아래 15개 본부
- 각 본부당 약 2~3개 파트
- 균형잡힌 피라미드 구조

**데이터 확인 방법**:

부서 계층 구조는 `Department` 테이블의 `parentDepartmentId` 컬럼으로 확인할 수 있습니다:

```sql
-- 최상위 부서 조회
SELECT * FROM department WHERE parent_department_id IS NULL;

-- 특정 부서의 하위 부서 조회
SELECT * FROM department WHERE parent_department_id = '부서ID';

-- 계층별 부서 개수
SELECT
  CASE
    WHEN parent_department_id IS NULL THEN '본부'
    WHEN id IN (SELECT DISTINCT parent_department_id FROM department WHERE parent_department_id IS NOT NULL) THEN '부/팀'
    ELSE '팀/파트'
  END AS level,
  COUNT(*) as count
FROM department
GROUP BY level;
```

---

## 참고 자료

- [기술 문서](../../docs/interface/admin/seed-data/seed-data-generation-guide.md)
- [Swagger UI](http://localhost:3000/api-docs)
- 평가 프로세스 상세: 각 도메인별 API 문서 참조

---

## 변경 이력

| 버전  | 날짜       | 변경 내용                                           |
| ----- | ---------- | --------------------------------------------------- |
| 2.2.0 | 2024-10-21 | WITH_EVALUATIONS 시나리오 구현 완료로 문서 업데이트 |
| 2.1.0 | 2024-10-20 | 평가 프로세스 3단계 구조로 문서 재구성              |
| 2.0.0 | 2024-10-20 | Phase 4-8 구현 완료 (FULL 지원)                     |
| 1.0.0 | 2024-10-20 | 초기 버전 (Phase 1-3 구현)                          |
