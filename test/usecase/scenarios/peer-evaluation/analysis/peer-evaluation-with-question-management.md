# 동료평가 관리 엔드포인트 분석 및 평가 질문 관리 연계

## 개요

이 문서는 `PeerEvaluationManagementController`의 모든 엔드포인트를 분석하고, 평가 질문 관리(`EvaluationQuestionManagementController`)와의 연계 관계를 설명합니다.

**컨트롤러 경로**: `/admin/performance-evaluation/peer-evaluations`

**총 엔드포인트 수**: 12개

**주요 연계 기능**:
- 동료평가 요청 시 평가 질문 할당
- 동료평가 상세 조회 시 평가 질문 목록 포함
- 동료평가 답변 저장/업데이트
- 동료평가 제출 시 모든 질문 답변 검증

---

## 1. 평가 질문 관리와의 연계 구조

### 1.1 데이터 흐름

```
평가 질문 관리 (EvaluationQuestionManagementController)
    ↓
평가 질문 생성/관리
    ↓
동료평가 요청 시 questionIds 전달
    ↓
동료평가-질문 매핑 생성 (PeerEvaluationQuestionMapping)
    ↓
평가자가 답변 작성 (questionId 기반)
    ↓
동료평가 제출 (모든 질문 답변 검증)
```

### 1.2 핵심 연계 포인트

1. **질문 할당**: 동료평가 요청 시 `questionIds` 배열로 평가 질문을 할당
2. **질문 조회**: 동료평가 상세 조회 시 매핑된 평가 질문 목록 포함
3. **답변 저장**: 평가 질문의 `questionId`를 사용하여 답변 저장
4. **제출 검증**: 모든 매핑된 질문에 답변이 있는지 확인 후 제출

---

## 2. 동료평가 요청 엔드포인트

### 2.1 동료평가 요청(할당)

**엔드포인트**: `POST /admin/performance-evaluation/peer-evaluations/requests`

**요약**: 관리자가 평가자에게 피평가자를 평가하도록 요청(할당)합니다.

**평가 질문 관리 연계**:
- `questionIds` 파라미터로 평가 질문을 할당
- 평가 질문 관리에서 생성한 질문 ID를 사용
- 질문이 없어도 요청 생성 가능 (나중에 질문 추가 가능)

**요청 본문** (`RequestPeerEvaluationDto`):
```typescript
{
  evaluatorId: string;           // 평가자 ID (필수)
  evaluateeId: string;           // 피평가자 ID (필수)
  periodId: string;               // 평가기간 ID (필수)
  requestDeadline?: Date;         // 요청 마감일 (선택)
  questionIds?: string[];         // 평가 질문 ID 목록 (선택) ⭐ 평가 질문 관리 연계
  requestedBy?: string;           // 요청자 ID (선택)
}
```

**응답** (`PeerEvaluationResponseDto`, 201 Created):
```typescript
{
  id: string;            // 생성된 동료평가 ID
  message: string;       // "동료평가가 성공적으로 요청되었습니다."
}
```

**평가 질문 관리 연계 동작**:
1. `questionIds`가 제공되면 각 질문에 대해 `PeerEvaluationQuestionMapping` 생성
2. 질문의 `displayOrder`는 배열 인덱스 순서대로 할당 (0부터 시작)
3. 평가 질문 관리에서 생성한 질문 ID가 유효한지 검증
4. 존재하지 않는 질문 ID는 무시하고 나머지만 매핑

**사용 예시**:
```typescript
// 1. 평가 질문 관리에서 질문 생성
POST /admin/performance-evaluation/evaluation-questions
{
  "text": "프로젝트 수행 능력은 어떠한가요?",
  "minScore": 1,
  "maxScore": 5
}
// 응답: { id: "question-id-1", ... }

// 2. 동료평가 요청 시 질문 할당
POST /admin/performance-evaluation/peer-evaluations/requests
{
  "evaluatorId": "evaluator-id",
  "evaluateeId": "evaluatee-id",
  "periodId": "period-id",
  "questionIds": ["question-id-1", "question-id-2"]  // ⭐ 평가 질문 관리에서 생성한 ID
}
```

---

### 2.2 한 명의 피평가자를 여러 평가자에게 요청

**엔드포인트**: `POST /admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators`

**요약**: 한 명의 피평가자를 여러 평가자가 평가하도록 일괄 요청합니다.

**평가 질문 관리 연계**:
- 모든 평가자에게 동일한 `questionIds` 할당
- 평가 질문 관리에서 생성한 질문을 재사용

**요청 본문** (`RequestPeerEvaluationToMultipleEvaluatorsDto`):
```typescript
{
  evaluatorIds: string[];         // 평가자 ID 목록 (필수)
  evaluateeId: string;            // 피평가자 ID (필수)
  periodId: string;                // 평가기간 ID (필수)
  requestDeadline?: Date;         // 요청 마감일 (선택)
  questionIds?: string[];         // 평가 질문 ID 목록 (선택) ⭐ 평가 질문 관리 연계
  requestedBy?: string;           // 요청자 ID (선택)
}
```

**응답** (`BulkPeerEvaluationRequestResponseDto`, 201 Created):
```typescript
{
  results: PeerEvaluationRequestResult[];  // 개별 요청 결과
  summary: {
    total: number;      // 전체 요청 개수
    success: number;    // 성공 개수
    failed: number;     // 실패 개수
  };
  message: string;      // 결과 메시지
  ids?: string[];       // 생성된 동료평가 ID 목록 (deprecated)
  count?: number;        // 생성된 요청 개수 (deprecated)
}
```

**평가 질문 관리 연계 동작**:
1. 각 평가자에 대해 동일한 `questionIds`로 질문 매핑 생성
2. 모든 평가자가 동일한 질문 세트로 평가
3. 평가 질문 관리에서 생성한 질문을 일괄 할당

---

### 2.3 한 명의 평가자가 여러 피평가자를 평가하도록 요청

**엔드포인트**: `POST /admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees`

**요약**: 한 명의 평가자가 여러 피평가자를 평가하도록 일괄 요청합니다.

**평가 질문 관리 연계**:
- 모든 피평가자에 대해 동일한 `questionIds` 할당
- 평가 질문 관리에서 생성한 질문을 재사용

**요청 본문** (`RequestMultiplePeerEvaluationsDto`):
```typescript
{
  evaluatorId: string;            // 평가자 ID (필수)
  evaluateeIds: string[];         // 피평가자 ID 목록 (필수)
  periodId: string;                // 평가기간 ID (필수)
  requestDeadline?: Date;         // 요청 마감일 (선택)
  questionIds?: string[];         // 평가 질문 ID 목록 (선택) ⭐ 평가 질문 관리 연계
  requestedBy?: string;           // 요청자 ID (선택)
}
```

**응답** (`BulkPeerEvaluationRequestResponseDto`, 201 Created):
```typescript
{
  results: PeerEvaluationRequestResult[];
  summary: { total, success, failed };
  message: string;
  ids?: string[];
  count?: number;
}
```

**평가 질문 관리 연계 동작**:
1. 각 피평가자에 대해 동일한 `questionIds`로 질문 매핑 생성
2. 한 평가자가 여러 피평가자를 동일한 질문 세트로 평가
3. 평가 질문 관리에서 생성한 질문을 일괄 할당

---

## 3. 동료평가 조회 엔드포인트

### 3.1 동료평가 상세정보 조회

**엔드포인트**: `GET /admin/performance-evaluation/peer-evaluations/:id`

**요약**: 동료평가의 상세정보를 조회합니다.

**평가 질문 관리 연계**:
- 매핑된 평가 질문 목록을 포함하여 반환
- 각 질문의 상세 정보 (text, minScore, maxScore) 포함
- 질문별 답변 정보 (answer, score, answeredAt) 포함
- 질문은 `displayOrder` 오름차순으로 정렬

**경로 파라미터**:
- `id`: 동료평가 ID (UUID)

**응답** (`PeerEvaluationDetailResponseDto`, 200 OK):
```typescript
{
  id: string;
  evaluationDate: Date;
  status: string;
  isCompleted: boolean;
  completedAt?: Date;
  requestDeadline?: Date;
  // ... 기타 필드
  
  questions: EvaluationQuestionInDetailDto[];  // ⭐ 평가 질문 관리 연계
}
```

**평가 질문 정보 구조** (`EvaluationQuestionInDetailDto`):
```typescript
{
  id: string;              // 질문 ID (평가 질문 관리에서 생성한 ID)
  text: string;            // 질문 내용
  minScore?: number;       // 최소 점수
  maxScore?: number;       // 최대 점수
  displayOrder: number;   // 표시 순서
  answer?: string;         // 답변 내용
  score?: number;          // 답변 점수
  answeredAt?: Date;       // 답변 작성일
  answeredBy?: string;     // 답변 작성자 ID
}
```

**평가 질문 관리 연계 동작**:
1. `PeerEvaluationQuestionMapping`을 통해 매핑된 질문 조회
2. 평가 질문 관리의 `EvaluationQuestion` 엔티티와 조인하여 질문 상세 정보 조회
3. 질문별 답변 정보도 함께 반환
4. 평가 질문 관리에서 삭제된 질문은 제외

---

### 3.2 동료평가 목록 조회 (통합)

**엔드포인트**: `GET /admin/performance-evaluation/peer-evaluations`

**요약**: 동료평가 목록을 상세 정보와 함께 페이지네이션 형태로 조회합니다.

**평가 질문 관리 연계**:
- 각 동료평가의 매핑된 질문 목록 포함
- 질문 정보는 상세 조회와 동일한 구조

**Query 파라미터**:
- `evaluatorId`: 평가자 ID (선택)
- `evaluateeId`: 피평가자 ID (선택)
- `periodId`: 평가기간 ID (선택)
- `status`: 평가 상태 (선택)
- `page`: 페이지 번호 (선택, 기본값: 1)
- `limit`: 페이지 크기 (선택, 기본값: 10)

**응답** (`PeerEvaluationListResponseDto`, 200 OK):
```typescript
{
  evaluations: PeerEvaluationDetailResponseDto[];  // 각 항목에 questions 포함
  total: number;
  page: number;
  limit: number;
}
```

**평가 질문 관리 연계 동작**:
1. 각 동료평가에 대해 매핑된 질문 목록 조회
2. 평가 질문 관리의 질문 정보와 답변 정보 포함
3. 질문은 `displayOrder` 오름차순으로 정렬

---

### 3.3 평가자에게 할당된 피평가자 목록 조회

**엔드포인트**: `GET /admin/performance-evaluation/peer-evaluations/evaluator/:evaluatorId/assigned-evaluatees`

**요약**: 평가자가 평가해야 하는 피평가자 상세 목록을 배열 형태로 조회합니다.

**평가 질문 관리 연계**:
- 각 피평가자에 대한 평가에 매핑된 질문 정보는 별도 조회 필요
- 이 엔드포인트는 피평가자 목록만 반환 (질문 정보는 상세 조회에서 확인)

**경로 파라미터**:
- `evaluatorId`: 평가자 ID (UUID)

**Query 파라미터**:
- `periodId`: 평가기간 ID (선택)
- `includeCompleted`: 완료된 평가 포함 여부 (선택, 기본값: false)

**응답** (`AssignedEvaluateeDto[]`, 200 OK):
```typescript
[
  {
    evaluationId: string;      // 동료평가 ID
    evaluateeId: string;       // 피평가자 ID
    periodId: string;         // 평가기간 ID
    status: string;           // 평가 상태
    isCompleted: boolean;     // 완료 여부
    // ... 기타 필드
    // ⚠️ 질문 정보는 포함되지 않음 (상세 조회에서 확인)
  }
]
```

**평가 질문 관리 연계**:
- 질문 정보가 필요하면 각 `evaluationId`로 상세 조회 필요
- 상세 조회 시 `questions` 배열에 평가 질문 정보 포함

---

## 4. 동료평가 답변 관리 엔드포인트

### 4.1 동료평가 질문 답변 저장/업데이트 (Upsert)

**엔드포인트**: `POST /admin/performance-evaluation/peer-evaluations/:id/answers`

**요약**: 동료평가에 매핑된 질문들에 대한 답변을 저장하거나 업데이트합니다.

**평가 질문 관리 연계**:
- `questionId`를 사용하여 답변 저장
- 평가 질문 관리에서 생성한 질문 ID를 사용
- 매핑되지 않은 질문의 답변은 무시

**경로 파라미터**:
- `id`: 동료평가 ID (UUID)

**요청 본문** (`UpsertPeerEvaluationAnswersDto`):
```typescript
{
  peerEvaluationId: string;     // 동료평가 ID (필수)
  answers: [                    // 답변 목록 (필수)
    {
      questionId: string;       // 질문 ID ⭐ 평가 질문 관리에서 생성한 ID
      answer: string;            // 답변 내용
      score?: number;            // 답변 점수 (선택)
    }
  ];
}
```

**응답** (`UpsertPeerEvaluationAnswersResponseDto`, 201 Created):
```typescript
{
  savedCount: number;          // 저장/업데이트된 답변 개수
  message: string;             // "답변이 성공적으로 저장되었습니다."
}
```

**평가 질문 관리 연계 동작**:
1. `questionId`로 `PeerEvaluationQuestionMapping` 조회
2. 매핑이 존재하면 답변 저장/업데이트
3. 매핑이 없으면 해당 답변 무시 (스킵)
4. 평가 질문 관리에서 삭제된 질문은 매핑이 없으므로 답변 불가

**사용 예시**:
```typescript
// 1. 평가 질문 관리에서 질문 생성
POST /admin/performance-evaluation/evaluation-questions
// 응답: { id: "question-id-1", ... }

// 2. 동료평가 요청 시 질문 할당
POST /admin/performance-evaluation/peer-evaluations/requests
{
  "questionIds": ["question-id-1"]
}
// 응답: { id: "evaluation-id", ... }

// 3. 답변 저장
POST /admin/performance-evaluation/peer-evaluations/evaluation-id/answers
{
  "peerEvaluationId": "evaluation-id",
  "answers": [
    {
      "questionId": "question-id-1",  // ⭐ 평가 질문 관리에서 생성한 ID
      "answer": "팀원과의 협업 능력이 뛰어나며, 적극적으로 의견을 나눕니다.",
      "score": 4
    }
  ]
}
```

---

### 4.2 동료평가 제출

**엔드포인트**: `POST /admin/performance-evaluation/peer-evaluations/:id/submit`

**요약**: 동료평가를 제출합니다.

**평가 질문 관리 연계**:
- 매핑된 모든 질문에 답변이 있는지 검증
- 모든 질문에 답변이 있어야 제출 가능
- 평가 질문 관리에서 생성한 질문에 대한 답변 완료 여부 확인

**경로 파라미터**:
- `id`: 동료평가 ID (UUID)

**응답**: 200 OK (응답 본문 없음)

**평가 질문 관리 연계 동작**:
1. `PeerEvaluationQuestionMapping`을 통해 매핑된 질문 목록 조회
2. 각 질문에 대해 답변 존재 여부 확인 (`answer` 필드 확인)
3. 모든 질문에 답변이 있으면 제출 성공
4. 미응답 질문이 있으면 제출 실패 (400 에러)

**검증 로직**:
```typescript
// 의사코드
const mappedQuestions = getMappedQuestions(evaluationId);
const unansweredQuestions = mappedQuestions.filter(q => !q.answer);

if (unansweredQuestions.length > 0) {
  throw new BadRequestException(
    `미응답 질문이 있습니다: ${unansweredQuestions.map(q => q.text).join(', ')}`
  );
}

// 모든 질문에 답변이 있으면 제출 성공
submitEvaluation(evaluationId);
```

---

## 5. 동료평가 취소 엔드포인트

### 5.1 동료평가 요청 취소

**엔드포인트**: `DELETE /admin/performance-evaluation/peer-evaluations/:id`

**요약**: 관리자가 보낸 동료평가 요청을 취소합니다.

**평가 질문 관리 연계**:
- 동료평가 취소 시 질문 매핑은 유지 (Soft Delete)
- 평가 질문 관리의 질문 자체는 영향 없음

**경로 파라미터**:
- `id`: 동료평가 ID (UUID)

**응답**: 204 No Content (응답 본문 없음)

---

### 5.2 평가기간의 피평가자의 모든 동료평가 요청 취소

**엔드포인트**: `DELETE /admin/performance-evaluation/peer-evaluations/evaluatee/:evaluateeId/period/:periodId/cancel-all`

**요약**: 특정 피평가자의 특정 평가기간 내 모든 동료평가 요청을 일괄 취소합니다.

**평가 질문 관리 연계**:
- 일괄 취소 시 모든 질문 매핑은 유지 (Soft Delete)
- 평가 질문 관리의 질문 자체는 영향 없음

**경로 파라미터**:
- `evaluateeId`: 피평가자 ID (UUID)
- `periodId`: 평가기간 ID (UUID)

**응답** (200 OK):
```typescript
{
  message: string;           // "동료평가 요청들이 성공적으로 취소되었습니다."
  cancelledCount: number;   // 취소된 평가 개수
}
```

---

## 6. 평가 질문 관리와의 연계 시나리오

### 6.1 전체 워크플로우

```
1. 평가 질문 관리에서 질문 생성
   POST /admin/performance-evaluation/evaluation-questions
   → 질문 ID: "question-1", "question-2"

2. 동료평가 요청 시 질문 할당
   POST /admin/performance-evaluation/peer-evaluations/requests
   {
     "evaluatorId": "evaluator-1",
     "evaluateeId": "evaluatee-1",
     "periodId": "period-1",
     "questionIds": ["question-1", "question-2"]  // ⭐ 평가 질문 관리에서 생성한 ID
   }
   → 동료평가 ID: "evaluation-1"
   → PeerEvaluationQuestionMapping 생성 (2개)

3. 평가자가 질문 확인
   GET /admin/performance-evaluation/peer-evaluations/evaluation-1
   → questions 배열에 질문 정보 포함

4. 평가자가 답변 작성
   POST /admin/performance-evaluation/peer-evaluations/evaluation-1/answers
   {
     "peerEvaluationId": "evaluation-1",
     "answers": [
       { "questionId": "question-1", "answer": "...", "score": 4 },
       { "questionId": "question-2", "answer": "...", "score": 5 }
     ]
   }

5. 평가자가 제출
   POST /admin/performance-evaluation/peer-evaluations/evaluation-1/submit
   → 모든 질문에 답변이 있는지 검증 후 제출
```

### 6.2 질문 그룹 활용 시나리오

```
1. 평가 질문 관리에서 질문 그룹 생성
   POST /admin/performance-evaluation/evaluation-questions/question-groups
   → 그룹 ID: "group-1"

2. 평가 질문 관리에서 질문 생성 및 그룹에 추가
   POST /admin/performance-evaluation/evaluation-questions
   {
     "text": "질문 1",
     "groupId": "group-1",
     "displayOrder": 0
   }
   → 질문 ID: "question-1"

   POST /admin/performance-evaluation/evaluation-questions/question-group-mappings
   {
     "groupId": "group-1",
     "questionId": "question-2",
     "displayOrder": 1
   }

3. 그룹의 질문 목록 조회
   GET /admin/performance-evaluation/evaluation-questions/question-groups/group-1/questions
   → ["question-1", "question-2"]

4. 동료평가 요청 시 그룹의 질문 ID 사용
   POST /admin/performance-evaluation/peer-evaluations/requests
   {
     "questionIds": ["question-1", "question-2"]  // 그룹에서 조회한 질문 ID
   }
```

### 6.3 질문 추가/제거 시나리오

```
1. 동료평가 요청 생성 (질문 없이)
   POST /admin/performance-evaluation/peer-evaluations/requests
   {
     "evaluatorId": "evaluator-1",
     "evaluateeId": "evaluatee-1",
     "periodId": "period-1"
     // questionIds 없음
   }
   → 동료평가 ID: "evaluation-1"

2. 나중에 질문 추가 (별도 엔드포인트 사용)
   → 평가 질문 관리에서 질문 생성
   → 동료평가에 질문 추가 (별도 핸들러 사용)

3. 질문 제거 (별도 엔드포인트 사용)
   → 동료평가에서 질문 제거 (별도 핸들러 사용)
```

---

## 7. 평가 질문 관리와의 데이터 관계

### 7.1 엔티티 관계

```
EvaluationQuestion (평가 질문 관리)
    ↓ (1:N)
PeerEvaluationQuestionMapping (동료평가-질문 매핑)
    ↓ (N:1)
PeerEvaluation (동료평가)
```

### 7.2 주요 필드 매핑

| 평가 질문 관리 | 동료평가 관리 | 설명 |
|--------------|------------|------|
| `EvaluationQuestion.id` | `PeerEvaluationQuestionMapping.questionId` | 질문 ID 매핑 |
| `EvaluationQuestion.text` | 응답의 `questions[].text` | 질문 내용 |
| `EvaluationQuestion.minScore` | 응답의 `questions[].minScore` | 최소 점수 |
| `EvaluationQuestion.maxScore` | 응답의 `questions[].maxScore` | 최대 점수 |
| - | `PeerEvaluationQuestionMapping.displayOrder` | 표시 순서 |
| - | `PeerEvaluationQuestionMapping.answer` | 답변 내용 |
| - | `PeerEvaluationQuestionMapping.score` | 답변 점수 |

### 7.3 데이터 일관성

1. **질문 삭제 시**: 평가 질문 관리에서 질문을 삭제하면 동료평가의 매핑은 유지되지만, 질문 정보는 조회되지 않음
2. **질문 수정 시**: 평가 질문 관리에서 질문 내용을 수정하면 동료평가 조회 시 수정된 내용이 반영됨
3. **답변 저장 시**: 매핑이 존재하는 질문에만 답변 저장 가능

---

## 8. 요약

### 8.1 엔드포인트 통계

| 카테고리 | 엔드포인트 수 | 평가 질문 관리 연계 |
|---------|-------------|------------------|
| 동료평가 요청 | 3개 | ⭐ 질문 할당 (questionIds) |
| 동료평가 조회 | 5개 | ⭐ 질문 목록 포함 |
| 동료평가 답변 | 1개 | ⭐ 질문 ID 기반 답변 저장 |
| 동료평가 제출 | 1개 | ⭐ 모든 질문 답변 검증 |
| 동료평가 취소 | 2개 | - |
| **총계** | **12개** | **10개 엔드포인트가 평가 질문 관리와 연계** |

### 8.2 평가 질문 관리 연계 요약

1. **질문 할당** (3개 엔드포인트)
   - 동료평가 요청 시 `questionIds`로 질문 할당
   - 평가 질문 관리에서 생성한 질문 ID 사용

2. **질문 조회** (5개 엔드포인트)
   - 동료평가 상세/목록 조회 시 매핑된 질문 목록 포함
   - 평가 질문 관리의 질문 정보와 답변 정보 함께 반환

3. **답변 저장** (1개 엔드포인트)
   - `questionId`를 사용하여 답변 저장/업데이트
   - 매핑된 질문에만 답변 저장 가능

4. **제출 검증** (1개 엔드포인트)
   - 모든 매핑된 질문에 답변이 있는지 검증
   - 미응답 질문이 있으면 제출 불가

### 8.3 주요 특징

- **유연한 질문 할당**: 동료평가 요청 시 질문을 할당하거나 나중에 추가 가능
- **질문 재사용**: 평가 질문 관리에서 생성한 질문을 여러 동료평가에 재사용
- **질문 그룹 활용**: 질문 그룹을 통해 질문 세트를 관리하고 동료평가에 할당
- **답변 검증**: 제출 시 모든 질문에 답변이 있는지 자동 검증
- **데이터 일관성**: 평가 질문 관리와 동료평가 관리 간 데이터 일관성 유지

