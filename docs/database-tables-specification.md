# 평가 관리 시스템 데이터베이스 테이블 명세서

## 개요

이 문서는 루미르 평가 관리 시스템의 데이터베이스 테이블 구조와 각 필드에 대한 상세 설명을 제공합니다.

---

## 1. 평가 기간 관리

### EVALUATION_PERIOD (평가 기간)

평가 기간을 관리하는 마스터 테이블입니다.

| 필드명                        | 타입    | 제약조건      | 설명                                                                                                |
| ----------------------------- | ------- | ------------- | --------------------------------------------------------------------------------------------------- |
| id                            | string  | PK            | 평가 기간 고유 식별자                                                                               |
| name                          | string  | NOT NULL      | 평가 기간명 (예: "2024년 상반기 평가")                                                              |
| startDate                     | string  | NOT NULL      | 평가 기간 시작일                                                                                    |
| endDate                       | string  | NOT NULL      | 평가 기간 종료일                                                                                    |
| description                   | string  |               | 평가 기간 설명                                                                                      |
| status                        | string  | NOT NULL      | 평가 기간 상태 (inactive, criteria-setting, active, performance-input, final-evaluation, completed) |
| createdAt                     | string  | NOT NULL      | 생성일시                                                                                            |
| criteriaStartDate             | string  |               | 평가 기준 설정 시작일                                                                               |
| criteriaEndDate               | string  |               | 평가 기준 설정 종료일                                                                               |
| performanceStartDate          | string  |               | 성과 입력 시작일                                                                                    |
| performanceEndDate            | string  |               | 성과 입력 종료일                                                                                    |
| finalEvaluationStartDate      | string  |               | 최종 평가 시작일                                                                                    |
| finalEvaluationEndDate        | string  |               | 최종 평가 종료일                                                                                    |
| completedDate                 | string  |               | 평가 완료일                                                                                         |
| criteriaSettingEnabled        | boolean | DEFAULT false | 평가 기준 설정 수동 허용 여부                                                                       |
| selfEvaluationSettingEnabled  | boolean | DEFAULT false | 자기 평가 설정 수동 허용 여부                                                                       |
| finalEvaluationSettingEnabled | boolean | DEFAULT false | 하향/동료평가 설정 수동 허용 여부                                                                   |
| currentPhase                  | string  |               | 현재 진행 단계 (criteria-setting, active, performance-input, final-evaluation)                      |

### GRADE_RANGE (등급 구간)

평가 기간별 등급 구간 설정을 관리합니다.

| 필드명    | 타입    | 제약조건 | 설명                         |
| --------- | ------- | -------- | ---------------------------- |
| id        | string  | PK       | 등급 구간 고유 식별자        |
| periodId  | string  | FK       | 평가 기간 ID                 |
| grade     | string  | NOT NULL | 등급 (S, A, B, C, F)         |
| score     | decimal | NOT NULL | 기준 점수                    |
| minRange  | decimal | NOT NULL | 최소 범위                    |
| maxRange  | decimal | NOT NULL | 최대 범위                    |
| subGrades | json    |          | 세부 등급 정보 (plus, minus) |
| createdAt | string  | NOT NULL | 생성일시                     |
| updatedAt | string  | NOT NULL | 수정일시                     |

---

## 2. 조직 관리

### DEPARTMENT (부서)

회사의 조직 구조를 관리합니다.

| 필드명    | 타입   | 제약조건 | 설명                  |
| --------- | ------ | -------- | --------------------- |
| id        | string | PK       | 부서 고유 식별자      |
| name      | string | NOT NULL | 부서명                |
| level     | int    | NOT NULL | 부서 레벨 (1: 최상위) |
| parentId  | string | FK       | 상위 부서 ID          |
| companyId | string | FK       | 회사 ID               |

### EMPLOYEE (직원)

직원 정보를 관리합니다.

| 필드명         | 타입   | 제약조건    | 설명                                                    |
| -------------- | ------ | ----------- | ------------------------------------------------------- |
| id             | string | PK          | 직원 고유 식별자                                        |
| name           | string | NOT NULL    | 직원명                                                  |
| employeeNumber | string | UNIQUE      | 사번                                                    |
| role           | string | NOT NULL    | 역할                                                    |
| position       | string | NOT NULL    | 직책                                                    |
| departmentId   | string | FK          | 소속 부서 ID                                            |
| email          | string | UNIQUE      | 이메일                                                  |
| jobGrade       | string |             | 직무 등급 (T1u, T1n, T1a, T2u, T2n, T2a, T3u, T3n, T3a) |
| status         | string | NOT NULL    | 재직 상태                                               |
| allocation     | int    | DEFAULT 100 | 할당률 (%)                                              |

---

## 3. 프로젝트 관리

### PROJECT (프로젝트)

프로젝트 정보를 관리합니다.

| 필드명      | 타입   | 제약조건 | 설명                 |
| ----------- | ------ | -------- | -------------------- |
| id          | string | PK       | 프로젝트 고유 식별자 |
| name        | string | NOT NULL | 프로젝트명           |
| description | string |          | 프로젝트 설명        |
| managerId   | string | FK       | 프로젝트 매니저 ID   |
| status      | string | NOT NULL | 프로젝트 상태        |
| startDate   | string |          | 시작일               |
| endDate     | string |          | 종료일               |
| createdAt   | string | NOT NULL | 생성일시             |
| updatedAt   | string | NOT NULL | 수정일시             |

### WBS_ITEM (WBS 항목)

프로젝트의 작업 분해 구조를 관리합니다.

| 필드명       | 타입   | 제약조건 | 설명                                   |
| ------------ | ------ | -------- | -------------------------------------- |
| id           | string | PK       | WBS 항목 고유 식별자                   |
| projectId    | string | FK       | 프로젝트 ID                            |
| title        | string | NOT NULL | WBS 제목                               |
| description  | string |          | WBS 설명                               |
| status       | string | NOT NULL | 상태 (pending, in-progress, completed) |
| assignedToId | string | FK       | 담당자 ID                              |
| createdAt    | string | NOT NULL | 생성일시                               |
| updatedAt    | string | NOT NULL | 수정일시                               |

---

## 4. 평가 기준 관리

### EVALUATION_CRITERIA_TEMPLATE (평가 기준 템플릿)

재사용 가능한 평가 기준 템플릿을 관리합니다.

| 필드명      | 타입    | 제약조건      | 설명                         |
| ----------- | ------- | ------------- | ---------------------------- |
| id          | string  | PK            | 템플릿 고유 식별자           |
| name        | string  | NOT NULL      | 템플릿명                     |
| description | string  |               | 템플릿 설명                  |
| category    | string  | NOT NULL      | 카테고리 (직무별, 레벨별 등) |
| isDefault   | boolean | DEFAULT false | 기본 템플릿 여부             |
| createdAt   | string  | NOT NULL      | 생성일시                     |
| updatedAt   | string  | NOT NULL      | 수정일시                     |

### EVALUATION_CRITERIA (평가 기준)

템플릿에 포함되는 구체적인 평가 기준을 관리합니다.

| 필드명      | 타입   | 제약조건 | 설명                  |
| ----------- | ------ | -------- | --------------------- |
| id          | string | PK       | 평가 기준 고유 식별자 |
| templateId  | string | FK       | 템플릿 ID             |
| name        | string | NOT NULL | 평가 기준명           |
| description | string |          | 평가 기준 설명        |
| weight      | int    | NOT NULL | 가중치 (%)            |
| minScore    | int    | NOT NULL | 최소 점수             |
| maxScore    | int    | NOT NULL | 최대 점수             |
| scoreLabels | json   |          | 점수별 라벨 배열      |
| createdAt   | string | NOT NULL | 생성일시              |
| updatedAt   | string | NOT NULL | 수정일시              |

### WBS_EVALUATION_CRITERIA (WBS 평가 기준)

WBS 항목별 개별 평가 기준을 관리합니다.

| 필드명      | 타입   | 제약조건 | 설명                      |
| ----------- | ------ | -------- | ------------------------- |
| id          | string | PK       | WBS 평가 기준 고유 식별자 |
| wbsItemId   | string | FK       | WBS 항목 ID               |
| name        | string | NOT NULL | 평가 기준명               |
| description | string |          | 평가 기준 설명            |
| createdAt   | string | NOT NULL | 생성일시                  |
| updatedAt   | string | NOT NULL | 수정일시                  |

---

## 5. 평가자 관리

### EVALUATION_LINE (평가 라인)

직원별 평가자 지정을 관리합니다.

| 필드명         | 타입    | 제약조건      | 설명                                         |
| -------------- | ------- | ------------- | -------------------------------------------- |
| id             | string  | PK            | 평가 라인 고유 식별자                        |
| employeeId     | string  | FK            | 피평가자 ID                                  |
| evaluatorId    | string  | FK            | 평가자 ID                                    |
| evaluatorType  | string  | NOT NULL      | 평가자 유형 (primary, secondary, additional) |
| projectId      | string  | FK            | 프로젝트 ID (2차 평가자의 경우)              |
| order          | int     | NOT NULL      | 평가 순서                                    |
| isRequired     | boolean | DEFAULT true  | 필수 평가자 여부                             |
| isAutoAssigned | boolean | DEFAULT false | 자동 할당 여부                               |
| createdAt      | string  | NOT NULL      | 생성일시                                     |
| updatedAt      | string  | NOT NULL      | 수정일시                                     |

---

## 6. 평가 상태 관리

### EMPLOYEE_EVALUATION_STATUS (직원 평가 상태)

직원별 평가 진행 상태를 관리합니다.

| 필드명                            | 타입    | 제약조건         | 설명                  |
| --------------------------------- | ------- | ---------------- | --------------------- |
| id                                | string  | PK               | 평가 상태 고유 식별자 |
| employeeId                        | string  | FK               | 직원 ID               |
| periodId                          | string  | FK               | 평가 기간 ID          |
| isExcluded                        | boolean | DEFAULT false    | 평가 제외 여부        |
| evaluationItems                   | boolean | DEFAULT false    | 평가 항목 설정 완료   |
| evaluationCriteria                | boolean | DEFAULT false    | 평가 기준 설정 완료   |
| evaluationLine                    | boolean | DEFAULT false    | 평가 라인 설정 완료   |
| performanceInput                  | string  | DEFAULT '미완료' | 성과 입력 상태        |
| selfEvaluation                    | string  | DEFAULT '미완료' | 자기 평가 상태        |
| selfEvaluationScore               | decimal |                  | 자기 평가 점수        |
| firstEvaluation                   | string  | DEFAULT '미완료' | 1차 평가 상태         |
| firstEvaluationScore              | decimal |                  | 1차 평가 점수         |
| secondEvaluation                  | string  | DEFAULT '미완료' | 2차 평가 상태         |
| secondEvaluationScore             | decimal |                  | 2차 평가 점수         |
| peerEvaluation                    | string  | DEFAULT '미완료' | 동료 평가 상태        |
| peerEvaluationScore               | decimal |                  | 동료 평가 점수        |
| additionalEvaluation              | string  | DEFAULT '미완료' | 추가 평가 상태        |
| additionalEvaluationScore         | decimal |                  | 추가 평가 점수        |
| finalApproval                     | boolean | DEFAULT false    | 최종 승인 여부        |
| finalGrade                        | string  |                  | 최종 등급             |
| jobGrade                          | string  |                  | 직무 등급             |
| selfEvaluationManuallyEnabled     | boolean | DEFAULT false    | 자기 평가 수동 허용   |
| downwardEvaluationManuallyEnabled | boolean | DEFAULT false    | 하향 평가 수동 허용   |
| createdAt                         | string  | NOT NULL         | 생성일시              |
| updatedAt                         | string  | NOT NULL         | 수정일시              |

---

## 7. 평가 데이터

### WBS_EVALUATION (WBS 평가)

WBS 항목별 자기평가 데이터를 관리합니다.

| 필드명            | 타입    | 제약조건 | 설명                 |
| ----------------- | ------- | -------- | -------------------- |
| id                | string  | PK       | WBS 평가 고유 식별자 |
| wbsItemId         | string  | FK       | WBS 항목 ID          |
| employeeId        | string  | FK       | 평가자 ID            |
| periodId          | string  | FK       | 평가 기간 ID         |
| evaluationContent | string  |          | 평가 내용            |
| score             | decimal |          | 평가 점수            |
| evaluationDate    | string  | NOT NULL | 평가일               |
| evaluatorId       | string  | FK       | 평가자 ID            |
| evaluatorName     | string  | NOT NULL | 평가자명             |
| createdAt         | string  | NOT NULL | 생성일시             |
| updatedAt         | string  | NOT NULL | 수정일시             |

### DOWNWARD_EVALUATION (하향 평가)

1차, 2차 평가 데이터를 관리합니다.

| 필드명                    | 타입    | 제약조건 | 설명                           |
| ------------------------- | ------- | -------- | ------------------------------ |
| id                        | string  | PK       | 하향 평가 고유 식별자          |
| employeeId                | string  | FK       | 피평가자 ID                    |
| evaluatorId               | string  | FK       | 평가자 ID                      |
| periodId                  | string  | FK       | 평가 기간 ID                   |
| projectId                 | string  | FK       | 프로젝트 ID                    |
| selfEvaluationId          | string  | FK       | 자기평가 ID                    |
| selfEvaluationContent     | string  |          | 자기평가 내용                  |
| selfEvaluationScore       | decimal |          | 자기평가 점수                  |
| downwardEvaluationContent | string  |          | 하향평가 내용                  |
| downwardEvaluationScore   | decimal |          | 하향평가 점수                  |
| evaluationDate            | string  | NOT NULL | 평가일                         |
| evaluationType            | string  | NOT NULL | 평가 유형 (primary, secondary) |
| createdAt                 | string  | NOT NULL | 생성일시                       |
| updatedAt                 | string  | NOT NULL | 수정일시                       |

### PEER_EVALUATION (동료 평가)

동료 평가 데이터를 관리합니다.

| 필드명            | 타입    | 제약조건          | 설명                  |
| ----------------- | ------- | ----------------- | --------------------- |
| id                | string  | PK                | 동료 평가 고유 식별자 |
| employeeId        | string  | FK                | 피평가자 ID           |
| evaluatorId       | string  | FK                | 평가자 ID             |
| periodId          | string  | FK                | 평가 기간 ID          |
| evaluationContent | string  |                   | 평가 내용             |
| score             | decimal |                   | 평가 점수             |
| evaluationDate    | string  | NOT NULL          | 평가일                |
| status            | string  | DEFAULT 'pending' | 평가 상태             |
| createdAt         | string  | NOT NULL          | 생성일시              |
| updatedAt         | string  | NOT NULL          | 수정일시              |

### ADDITIONAL_EVALUATION (추가 평가)

추가 평가 데이터를 관리합니다.

| 필드명            | 타입    | 제약조건          | 설명                  |
| ----------------- | ------- | ----------------- | --------------------- |
| id                | string  | PK                | 추가 평가 고유 식별자 |
| employeeId        | string  | FK                | 피평가자 ID           |
| evaluatorId       | string  | FK                | 평가자 ID             |
| periodId          | string  | FK                | 평가 기간 ID          |
| evaluationContent | string  |                   | 평가 내용             |
| score             | decimal |                   | 평가 점수             |
| evaluationDate    | string  | NOT NULL          | 평가일                |
| status            | string  | DEFAULT 'pending' | 평가 상태             |
| createdAt         | string  | NOT NULL          | 생성일시              |
| updatedAt         | string  | NOT NULL          | 수정일시              |

---

## 8. 평가 질문 관리

### QUESTION_GROUP (질문 그룹)

평가 질문 그룹을 관리합니다.

| 필드명      | 타입    | 제약조건      | 설명                  |
| ----------- | ------- | ------------- | --------------------- |
| id          | string  | PK            | 질문 그룹 고유 식별자 |
| name        | string  | NOT NULL      | 그룹명                |
| createdAt   | string  | NOT NULL      | 생성일시              |
| isDefault   | boolean | DEFAULT false | 기본 그룹 여부        |
| isDeletable | boolean | DEFAULT true  | 삭제 가능 여부        |

### EVALUATION_QUESTION (평가 질문)

평가에 사용되는 질문을 관리합니다.

| 필드명         | 타입    | 제약조건      | 설명                                    |
| -------------- | ------- | ------------- | --------------------------------------- |
| id             | string  | PK            | 평가 질문 고유 식별자                   |
| groupId        | string  | FK            | 질문 그룹 ID                            |
| text           | string  | NOT NULL      | 질문 내용                               |
| type           | string  | NOT NULL      | 질문 유형 (questionnaire, score, mixed) |
| minScore       | int     |               | 최소 점수                               |
| maxScore       | int     |               | 최대 점수                               |
| isNewQuestion  | boolean | DEFAULT false | 신규 질문 여부                          |
| includeInGroup | boolean | DEFAULT true  | 그룹 포함 여부                          |
| createdAt      | string  | NOT NULL      | 생성일시                                |
| updatedAt      | string  | NOT NULL      | 수정일시                                |

### EVALUATION_RESPONSE (평가 응답)

평가 질문에 대한 응답을 관리합니다.

| 필드명         | 타입    | 제약조건 | 설명                                         |
| -------------- | ------- | -------- | -------------------------------------------- |
| id             | string  | PK       | 평가 응답 고유 식별자                        |
| questionId     | string  | FK       | 질문 ID                                      |
| evaluationId   | string  | FK       | 평가 ID                                      |
| evaluationType | string  | NOT NULL | 평가 유형 (self, peer, additional, downward) |
| answer         | string  |          | 응답 내용                                    |
| score          | decimal |          | 응답 점수                                    |
| createdAt      | string  | NOT NULL | 생성일시                                     |
| updatedAt      | string  | NOT NULL | 수정일시                                     |

---

## 9. 산출물 관리

### DELIVERABLE (산출물)

WBS 항목별 산출물을 관리합니다.

| 필드명      | 타입   | 제약조건 | 설명                   |
| ----------- | ------ | -------- | ---------------------- |
| id          | string | PK       | 산출물 고유 식별자     |
| wbsItemId   | string | FK       | WBS 항목 ID            |
| employeeId  | string | FK       | 작성자 ID              |
| type        | string | NOT NULL | 산출물 유형 (url, nas) |
| title       | string | NOT NULL | 산출물 제목            |
| path        | string | NOT NULL | 산출물 경로            |
| description | string |          | 산출물 설명            |
| createdAt   | string | NOT NULL | 생성일시               |
| updatedAt   | string | NOT NULL | 수정일시               |

---

## 인덱스 권장사항

### 성능 최적화를 위한 인덱스

```sql
-- 평가 기간별 조회 최적화
CREATE INDEX idx_employee_evaluation_status_period ON EMPLOYEE_EVALUATION_STATUS(periodId);
CREATE INDEX idx_wbs_evaluation_period ON WBS_EVALUATION(periodId);
CREATE INDEX idx_downward_evaluation_period ON DOWNWARD_EVALUATION(periodId);

-- 직원별 조회 최적화
CREATE INDEX idx_employee_evaluation_status_employee ON EMPLOYEE_EVALUATION_STATUS(employeeId);
CREATE INDEX idx_evaluation_line_employee ON EVALUATION_LINE(employeeId);
CREATE INDEX idx_evaluation_line_evaluator ON EVALUATION_LINE(evaluatorId);

-- 프로젝트별 조회 최적화
CREATE INDEX idx_wbs_item_project ON WBS_ITEM(projectId);
CREATE INDEX idx_downward_evaluation_project ON DOWNWARD_EVALUATION(projectId);

-- 복합 인덱스
CREATE INDEX idx_employee_period ON EMPLOYEE_EVALUATION_STATUS(employeeId, periodId);
CREATE INDEX idx_wbs_employee_period ON WBS_EVALUATION(employeeId, periodId);
```

## 제약조건

### 외래키 제약조건

- 모든 FK 필드는 참조 무결성을 보장해야 합니다.
- CASCADE 삭제는 신중하게 적용하며, 주로 로그성 데이터에만 적용합니다.

### 체크 제약조건

```sql
-- 평가 상태 체크
ALTER TABLE EMPLOYEE_EVALUATION_STATUS
ADD CONSTRAINT chk_performance_input
CHECK (performanceInput IN ('미완료', '입력중', '완료'));

-- 점수 범위 체크
ALTER TABLE WBS_EVALUATION
ADD CONSTRAINT chk_score_range
CHECK (score >= 1 AND score <= 7);

-- 등급 체크
ALTER TABLE EMPLOYEE_EVALUATION_STATUS
ADD CONSTRAINT chk_final_grade
CHECK (finalGrade IN ('S+', 'S', 'S-', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'F'));
```
