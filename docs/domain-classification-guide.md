# 평가 관리 시스템 도메인 분류 가이드

## 개요

이 문서는 루미르 평가 관리 시스템의 데이터베이스 테이블들을 DDD(Domain-Driven Design) 관점에서 도메인별로 분류하는 가이드를 제공합니다. 기존 프로젝트 관리 시스템의 아키텍처와 일관성을 유지하면서 평가 시스템의 특성을 반영한 분류 기준을 제시합니다.

---

## 도메인 분류 기준

### 🔵 **Common 도메인** (공통/외부 연동)

- **목적**: 외부 시스템과 동기화되는 기본 마스터 데이터
- **특징**: 다른 시스템에서도 공통으로 사용되는 엔티티
- **관리 방식**: 외부 시스템에서 동기화하여 참조용으로 사용

### 🟢 **Core 도메인** (핵심 비즈니스)

- **목적**: 평가 관리 시스템의 핵심 비즈니스 로직
- **특징**: 평가 프로세스의 중심이 되는 엔티티
- **관리 방식**: 평가 시스템에서 직접 생성하고 관리

### 🟡 **Sub 도메인** (부가 기능)

- **목적**: 핵심 기능을 지원하는 부가적인 기능
- **특징**: 설정, 이력, 부가 정보 관리
- **관리 방식**: 관리자 인터페이스를 통한 설정 및 관리

---

## 도메인별 테이블 분류

### 🔵 **Common 도메인** (4개 테이블)

외부 시스템과 연동되는 기본 마스터 데이터를 관리합니다.

```
common/
├── department/          # 부서 정보 (외부 인사 시스템 연동)
├── employee/           # 직원 정보 (외부 인사 시스템 연동)
├── project/            # 프로젝트 정보 (프로젝트 관리 시스템 연동)
└── wbs-item/           # WBS 항목 (프로젝트 관리 시스템 연동)
```

| 테이블명     | 설명                      | 외부 시스템 연동     |
| ------------ | ------------------------- | -------------------- |
| `DEPARTMENT` | 회사의 조직 구조 관리     | 인사 시스템          |
| `EMPLOYEE`   | 직원 정보 관리            | 인사 시스템          |
| `PROJECT`    | 프로젝트 기본 정보        | 프로젝트 관리 시스템 |
| `WBS_ITEM`   | 프로젝트의 작업 분해 구조 | 프로젝트 관리 시스템 |

**선택 근거:**

- 외부 시스템에서 동기화되는 마스터 데이터
- 평가 시스템에서 직접 생성하지 않고 참조만 하는 데이터
- 다른 시스템과 공유되는 공통 엔티티

---

### 🟢 **Core 도메인** (12개 테이블)

평가 관리 시스템의 핵심 비즈니스 로직을 담당합니다.

```
core/
├── evaluation-period/           # 평가 기간 관리
├── grade-range/                # 등급 구간 설정
├── evaluation-criteria-template/ # 평가 기준 템플릿
├── evaluation-criteria/         # 평가 기준
├── wbs-evaluation-criteria/     # WBS별 평가 기준
├── evaluation-line/            # 평가자 라인 관리
├── employee-evaluation-status/  # 직원 평가 상태
├── wbs-evaluation/             # WBS 평가 (자기평가)
├── downward-evaluation/        # 하향 평가 (1차/2차)
├── peer-evaluation/            # 동료 평가
├── additional-evaluation/      # 추가 평가
└── deliverable/               # 산출물 관리
```

#### 평가 기간 및 설정 관리

| 테이블명            | 설명                       | 비즈니스 역할      |
| ------------------- | -------------------------- | ------------------ |
| `EVALUATION_PERIOD` | 평가 기간 마스터 테이블    | 평가 생명주기 관리 |
| `GRADE_RANGE`       | 평가 기간별 등급 구간 설정 | 평가 결과 등급화   |

#### 평가 기준 관리

| 테이블명                       | 설명                                 | 비즈니스 역할       |
| ------------------------------ | ------------------------------------ | ------------------- |
| `EVALUATION_CRITERIA_TEMPLATE` | 재사용 가능한 평가 기준 템플릿       | 평가 기준 표준화    |
| `EVALUATION_CRITERIA`          | 템플릿에 포함되는 구체적인 평가 기준 | 평가 항목 정의      |
| `WBS_EVALUATION_CRITERIA`      | WBS 항목별 개별 평가 기준            | 개별 작업 평가 기준 |

#### 평가자 및 상태 관리

| 테이블명                     | 설명                       | 비즈니스 역할       |
| ---------------------------- | -------------------------- | ------------------- |
| `EVALUATION_LINE`            | 직원별 평가자 지정 관리    | 평가 라인 구성      |
| `EMPLOYEE_EVALUATION_STATUS` | 직원별 평가 진행 상태 관리 | 평가 진행 상황 추적 |

#### 평가 데이터 관리

| 테이블명                | 설명                       | 비즈니스 역할         |
| ----------------------- | -------------------------- | --------------------- |
| `WBS_EVALUATION`        | WBS 항목별 자기평가 데이터 | 성과 입력 및 자기평가 |
| `DOWNWARD_EVALUATION`   | 1차, 2차 하향평가 데이터   | 상급자 평가           |
| `PEER_EVALUATION`       | 동료평가 데이터            | 동료 간 평가          |
| `ADDITIONAL_EVALUATION` | 추가평가 데이터            | 보완적 평가           |

#### 산출물 관리

| 테이블명      | 설명                   | 비즈니스 역할  |
| ------------- | ---------------------- | -------------- |
| `DELIVERABLE` | WBS 항목별 산출물 관리 | 평가 근거 자료 |

**선택 근거:**

- 평가 프로세스의 핵심 비즈니스 로직
- 평가 생명주기 전체를 관리하는 엔티티
- 평가 시스템에서 직접 생성하고 관리하는 데이터

---

### 🟡 **Sub 도메인** (3개 테이블)

핵심 평가 기능을 지원하는 부가적인 기능을 담당합니다.

```
sub/
├── question-group/         # 질문 그룹 관리
├── evaluation-question/    # 평가 질문 관리
└── evaluation-response/    # 평가 응답 관리
```

| 테이블명              | 설명                       | 비즈니스 역할       |
| --------------------- | -------------------------- | ------------------- |
| `QUESTION_GROUP`      | 평가 질문 그룹 관리        | 질문 분류 및 그룹화 |
| `EVALUATION_QUESTION` | 평가에 사용되는 질문 관리  | 평가 질문 템플릿    |
| `EVALUATION_RESPONSE` | 평가 질문에 대한 응답 관리 | 질문별 응답 데이터  |

**선택 근거:**

- 평가의 부가적 설정 기능
- 유연한 확장이 가능한 범용 기능
- 다른 평가 유형에서도 재사용 가능

---

## 도메인 간 의존성 관계

### 의존성 규칙

```typescript
// ✅ 허용되는 의존성
Core Domain → Common Domain    // Core는 Common을 참조 가능
Sub Domain → Core Domain       // Sub는 Core를 참조 가능
Sub Domain → Common Domain     // Sub는 Common을 참조 가능

// ❌ 금지되는 의존성
Common Domain → Core Domain    // Common은 Core를 참조 불가
Common Domain → Sub Domain     // Common은 Sub를 참조 불가
Core Domain → Sub Domain       // Core는 Sub를 참조 불가
```

### 모듈 임포트 예시

```typescript
// Core 도메인에서 Common 참조
import { Employee } from '@domain/common/employee';
import { Project } from '@domain/common/project';

// Sub 도메인에서 Core와 Common 참조
import { EvaluationPeriod } from '@domain/core/evaluation-period';
import { Employee } from '@domain/common/employee';
```

---

## 데이터 관리 전략

### Common 도메인

- **동기화 방식**: 외부 시스템과의 실시간 또는 배치 동기화
- **데이터 소유권**: 외부 시스템이 마스터, 평가 시스템은 읽기 전용
- **업데이트 정책**: 외부 시스템 변경 시 자동 동기화

### Core 도메인

- **생성 방식**: 평가 시스템 내부 비즈니스 로직으로 생성
- **데이터 소유권**: 평가 시스템이 완전 소유
- **업데이트 정책**: 비즈니스 규칙에 따른 생명주기 관리

### Sub 도메인

- **관리 방식**: 관리자 인터페이스를 통한 설정
- **데이터 소유권**: 평가 시스템이 소유하되 설정 데이터로 관리
- **업데이트 정책**: 관리자 권한으로 수동 관리

---

## 구현 시 고려사항

### 1. 모듈 구조

```
src/domain/
├── common/                    # 외부 시스템 연동
│   ├── department/
│   ├── employee/
│   ├── project/
│   └── wbs-item/
├── core/                      # 핵심 평가 비즈니스
│   ├── evaluation-period/
│   ├── grade-range/
│   ├── evaluation-criteria-template/
│   ├── evaluation-criteria/
│   ├── wbs-evaluation-criteria/
│   ├── evaluation-line/
│   ├── employee-evaluation-status/
│   ├── wbs-evaluation/
│   ├── downward-evaluation/
│   ├── peer-evaluation/
│   ├── additional-evaluation/
│   └── deliverable/
└── sub/                       # 부가 기능
    ├── question-group/
    ├── evaluation-question/
    └── evaluation-response/
```

### 2. 네이밍 컨벤션

- **폴더명**: kebab-case 사용 (예: `evaluation-period`)
- **파일명**: 도메인명 + 역할 (예: `evaluation-period.entity.ts`)
- **클래스명**: PascalCase 사용 (예: `EvaluationPeriod`)

### 3. 트랜잭션 관리

- **Common**: 읽기 전용, 트랜잭션 불필요
- **Core**: 복잡한 비즈니스 로직, 트랜잭션 필수
- **Sub**: 단순 CRUD, 기본 트랜잭션

### 4. 테스트 전략

- **Common**: 동기화 로직 테스트
- **Core**: 비즈니스 로직 단위 테스트 + 통합 테스트
- **Sub**: 기본 CRUD 테스트

---

## 마이그레이션 가이드

### 1. 단계별 구현 순서

1. **Common 도메인**: 외부 시스템 연동 구현
2. **Core 도메인**: 핵심 평가 로직 구현
3. **Sub 도메인**: 부가 기능 구현

### 2. 데이터베이스 마이그레이션

```sql
-- 1단계: Common 도메인 테이블 생성
-- 2단계: Core 도메인 테이블 생성
-- 3단계: Sub 도메인 테이블 생성
-- 4단계: 외래키 제약조건 추가
-- 5단계: 인덱스 생성
```

### 3. API 설계

- **Common**: 동기화 API
- **Core**: 평가 프로세스 API
- **Sub**: 설정 관리 API

---

## 결론

이러한 도메인 분류를 통해 다음과 같은 이점을 얻을 수 있습니다:

1. **명확한 책임 분리**: 각 도메인의 역할과 책임이 명확히 구분됩니다.
2. **유지보수성 향상**: 도메인별 독립적인 개발과 유지보수가 가능합니다.
3. **확장성 확보**: 새로운 기능 추가 시 적절한 도메인에 배치할 수 있습니다.
4. **일관된 아키텍처**: 기존 프로젝트 관리 시스템과 일관된 구조를 유지합니다.
5. **테스트 용이성**: 도메인별 독립적인 테스트가 가능합니다.

이 가이드를 바탕으로 평가 관리 시스템의 도메인 구조를 설계하고 구현하시기 바랍니다.
