# Admin Deliverable Management API

산출물 관리 API 가이드 - WBS 항목에 대한 산출물 관리

---

## 목차

1. [개요](#개요)
2. [빠른 시작](#빠른-시작)
3. [API 엔드포인트](#api-엔드포인트)
4. [사용 시나리오](#사용-시나리오)
5. [고급 기능](#고급-기능)
6. [모범 사례](#모범-사례)

---

## 개요

### 목적

프로젝트의 WBS(Work Breakdown Structure) 항목에 대한 산출물(문서, 코드, 디자인 등)을 관리합니다.

### 주요 기능

- ✅ 산출물 생성, 수정, 삭제
- ✅ 직원별 / WBS 항목별 산출물 조회
- ✅ 벌크 생성/삭제 (여러 산출물 일괄 처리)
- ✅ 활성/비활성 상태 관리
- ✅ 파일 경로 및 메타데이터 관리

### 산출물 유형

| 유형         | 코드           | 설명                     |
| ------------ | -------------- | ------------------------ |
| 문서         | `document`     | 설계서, 명세서 등        |
| 코드         | `code`         | 소스코드, 스크립트 등    |
| 디자인       | `design`       | UI/UX 디자인, 다이어그램 |
| 보고서       | `report`       | 진행 보고서, 결과 보고서 |
| 프레젠테이션 | `presentation` | 발표 자료                |
| 기타         | `other`        | 기타 산출물              |

---

## 빠른 시작

### 1️⃣ 산출물 생성

```http
POST /admin/performance-evaluation/deliverables
Content-Type: application/json

{
  "name": "API 설계 문서",
  "description": "RESTful API 설계 문서 v1.0",
  "type": "document",
  "filePath": "/uploads/documents/api-design-v1.pdf",
  "employeeId": "550e8400-e29b-41d4-a716-446655440000",
  "wbsItemId": "550e8400-e29b-41d4-a716-446655440001"
}
```

**응답:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "name": "API 설계 문서",
  "description": "RESTful API 설계 문서 v1.0",
  "type": "document",
  "filePath": "/uploads/documents/api-design-v1.pdf",
  "employeeId": "550e8400-e29b-41d4-a716-446655440000",
  "wbsItemId": "550e8400-e29b-41d4-a716-446655440001",
  "isActive": true,
  "createdAt": "2024-01-15T09:00:00Z",
  "version": 1
}
```

### 2️⃣ 직원별 산출물 조회

```http
GET /admin/performance-evaluation/deliverables/employee/{employeeId}?activeOnly=true
```

**응답:**

```json
{
  "deliverables": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "name": "API 설계 문서",
      "type": "document",
      "employeeId": "550e8400-e29b-41d4-a716-446655440000",
      "wbsItemId": "550e8400-e29b-41d4-a716-446655440001",
      "isActive": true
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440011",
      "name": "데이터베이스 스키마",
      "type": "code",
      "employeeId": "550e8400-e29b-41d4-a716-446655440000",
      "wbsItemId": "550e8400-e29b-41d4-a716-446655440002",
      "isActive": true
    }
  ],
  "total": 2
}
```

### 3️⃣ WBS 항목별 산출물 조회

```http
GET /admin/performance-evaluation/deliverables/wbs/{wbsItemId}?activeOnly=true
```

---

## API 엔드포인트

### 산출물 생성

```http
POST /admin/performance-evaluation/deliverables
```

**Request Body:**

| 필드        | 타입   | 필수 | 설명               |
| ----------- | ------ | ---- | ------------------ |
| name        | string | ✅   | 산출물명           |
| type        | enum   | ✅   | 산출물 유형        |
| employeeId  | string | ✅   | 직원 ID (UUID)     |
| wbsItemId   | string | ✅   | WBS 항목 ID (UUID) |
| description | string | ❌   | 산출물 설명        |
| filePath    | string | ❌   | 파일 경로          |

**응답 코드:**

- `201 Created`: 산출물 생성 성공
- `400 Bad Request`: 잘못된 요청 데이터
- `404 Not Found`: 직원 또는 WBS 항목을 찾을 수 없음

---

### 산출물 수정

```http
PUT /admin/performance-evaluation/deliverables/:id
```

**Request Body:**

| 필드        | 타입    | 필수 | 설명                 |
| ----------- | ------- | ---- | -------------------- |
| name        | string  | ❌   | 산출물명             |
| type        | enum    | ❌   | 산출물 유형          |
| description | string  | ❌   | 산출물 설명          |
| filePath    | string  | ❌   | 파일 경로            |
| employeeId  | string  | ❌   | 직원 ID (재할당)     |
| wbsItemId   | string  | ❌   | WBS 항목 ID (재할당) |
| isActive    | boolean | ❌   | 활성 상태            |

**응답 코드:**

- `200 OK`: 산출물 수정 성공
- `400 Bad Request`: 잘못된 요청 데이터
- `404 Not Found`: 산출물을 찾을 수 없음

---

### 산출물 삭제

```http
DELETE /admin/performance-evaluation/deliverables/:id
```

**참고:** 소프트 삭제 방식으로 실제 데이터는 유지됩니다.

**응답 코드:**

- `204 No Content`: 산출물 삭제 성공
- `404 Not Found`: 산출물을 찾을 수 없음

---

### 산출물 상세 조회

```http
GET /admin/performance-evaluation/deliverables/:id
```

**응답 코드:**

- `200 OK`: 조회 성공
- `404 Not Found`: 산출물을 찾을 수 없음

---

### 직원별 산출물 조회

```http
GET /admin/performance-evaluation/deliverables/employee/:employeeId
```

**Query Parameters:**

| 파라미터   | 타입    | 필수 | 기본값 | 설명               |
| ---------- | ------- | ---- | ------ | ------------------ |
| activeOnly | boolean | ❌   | true   | 활성 산출물만 조회 |

**응답 코드:**

- `200 OK`: 조회 성공

---

### WBS 항목별 산출물 조회

```http
GET /admin/performance-evaluation/deliverables/wbs/:wbsItemId
```

**Query Parameters:**

| 파라미터   | 타입    | 필수 | 기본값 | 설명               |
| ---------- | ------- | ---- | ------ | ------------------ |
| activeOnly | boolean | ❌   | true   | 활성 산출물만 조회 |

**응답 코드:**

- `200 OK`: 조회 성공

---

### 벌크 산출물 생성

```http
POST /admin/performance-evaluation/deliverables/bulk
```

**Request Body:**

```json
{
  "deliverables": [
    {
      "name": "API 설계 문서",
      "type": "document",
      "employeeId": "550e8400-e29b-41d4-a716-446655440000",
      "wbsItemId": "550e8400-e29b-41d4-a716-446655440001"
    },
    {
      "name": "데이터베이스 스키마",
      "type": "code",
      "employeeId": "550e8400-e29b-41d4-a716-446655440000",
      "wbsItemId": "550e8400-e29b-41d4-a716-446655440002"
    }
  ]
}
```

**응답:**

```json
{
  "successCount": 2,
  "failedCount": 0,
  "createdIds": [
    "550e8400-e29b-41d4-a716-446655440010",
    "550e8400-e29b-41d4-a716-446655440011"
  ],
  "failedItems": []
}
```

**응답 코드:**

- `201 Created`: 벌크 생성 완료 (일부 실패 가능)
- `400 Bad Request`: 잘못된 요청 데이터

---

### 벌크 산출물 삭제

```http
DELETE /admin/performance-evaluation/deliverables/bulk
```

**Request Body:**

```json
{
  "deliverableIds": [
    "550e8400-e29b-41d4-a716-446655440010",
    "550e8400-e29b-41d4-a716-446655440011"
  ]
}
```

**응답:**

```json
{
  "successCount": 2,
  "failedCount": 0,
  "failedIds": []
}
```

**응답 코드:**

- `200 OK`: 벌크 삭제 완료 (일부 실패 가능)
- `400 Bad Request`: 잘못된 요청 데이터

---

## 사용 시나리오

### 시나리오 1: 프로젝트 산출물 등록

**상황:** 개발자가 WBS 항목에 대한 설계 문서를 작성 완료

```http
POST /admin/performance-evaluation/deliverables
```

```json
{
  "name": "사용자 인증 API 설계서",
  "description": "OAuth 2.0 기반 사용자 인증 API 설계 문서",
  "type": "document",
  "filePath": "/uploads/docs/auth-api-design.pdf",
  "employeeId": "emp-001",
  "wbsItemId": "wbs-auth-001"
}
```

---

### 시나리오 2: 직원별 산출물 조회 (평가 준비)

**상황:** 평가 기간에 직원의 모든 산출물 확인

```http
GET /admin/performance-evaluation/deliverables/employee/emp-001?activeOnly=true
```

**결과:** 해당 직원이 작성한 모든 활성 산출물 목록 조회

---

### 시나리오 3: WBS 항목별 산출물 조회

**상황:** 특정 WBS 항목의 완료 여부 확인

```http
GET /admin/performance-evaluation/deliverables/wbs/wbs-auth-001?activeOnly=true
```

**결과:** 해당 WBS 항목에 연결된 모든 산출물 조회

---

### 시나리오 4: 여러 산출물 일괄 등록

**상황:** 스프린트 종료 시 여러 산출물을 한 번에 등록

```http
POST /admin/performance-evaluation/deliverables/bulk
```

```json
{
  "deliverables": [
    {
      "name": "API 설계 문서",
      "type": "document",
      "employeeId": "emp-001",
      "wbsItemId": "wbs-001"
    },
    {
      "name": "데이터베이스 스키마",
      "type": "code",
      "employeeId": "emp-001",
      "wbsItemId": "wbs-002"
    },
    {
      "name": "UI 디자인 파일",
      "type": "design",
      "employeeId": "emp-002",
      "wbsItemId": "wbs-003"
    }
  ]
}
```

---

### 시나리오 5: 산출물 비활성화

**상황:** 잘못된 산출물을 비활성화 (삭제하지 않고)

```http
PUT /admin/performance-evaluation/deliverables/deliverable-id-123
```

```json
{
  "isActive": false
}
```

**결과:** 산출물이 비활성화되어 기본 조회에서 제외됨

---

## 고급 기능

### 1. 활성/비활성 산출물 관리

**활성 산출물만 조회 (기본값):**

```http
GET /admin/performance-evaluation/deliverables/employee/emp-001?activeOnly=true
```

**모든 산출물 조회 (비활성 포함):**

```http
GET /admin/performance-evaluation/deliverables/employee/emp-001?activeOnly=false
```

---

### 2. 산출물 재할당

**직원 또는 WBS 항목 변경:**

```http
PUT /admin/performance-evaluation/deliverables/deliverable-id-123
```

```json
{
  "employeeId": "new-emp-002",
  "wbsItemId": "new-wbs-002"
}
```

---

### 3. 파일 경로 관리

**파일 경로 업데이트:**

```http
PUT /admin/performance-evaluation/deliverables/deliverable-id-123
```

```json
{
  "filePath": "/uploads/documents/updated-file-v2.pdf"
}
```

---

### 4. 벌크 처리 에러 핸들링

**일부 실패 시 응답 예시:**

```json
{
  "successCount": 8,
  "failedCount": 2,
  "createdIds": ["id-1", "id-2", "..."],
  "failedItems": [
    {
      "data": { "name": "Invalid Deliverable" },
      "error": "Employee not found"
    },
    {
      "data": { "name": "Another Deliverable" },
      "error": "WBS item not found"
    }
  ]
}
```

**대응 방안:**

1. `successCount`와 `failedCount` 확인
2. `failedItems` 배열에서 실패 원인 확인
3. 실패한 항목 수정 후 재시도

---

## 모범 사례

### ✅ DO: 권장 사항

1. **명확한 산출물명 사용**

   ```json
   {
     "name": "사용자 인증 API 설계서 v1.0"
   }
   ```

2. **적절한 산출물 유형 선택**
   - 문서: `document`
   - 코드: `code`
   - 디자인: `design`

3. **설명 추가로 맥락 제공**

   ```json
   {
     "description": "OAuth 2.0 기반 사용자 인증 API 설계 문서, JWT 토큰 방식 포함"
   }
   ```

4. **파일 경로 정규화**

   ```json
   {
     "filePath": "/uploads/documents/2024/auth-api-design.pdf"
   }
   ```

5. **벌크 처리 활용**
   - 여러 산출물을 동시에 등록할 때 벌크 API 사용

---

### ❌ DON'T: 피해야 할 사항

1. **불명확한 산출물명**

   ```json
   {
     "name": "문서1" // ❌
   }
   ```

2. **잘못된 산출물 유형**

   ```json
   {
     "type": "document" // 코드 파일인데 document로 설정 ❌
   }
   ```

3. **너무 긴 설명**

   ```json
   {
     "description": "... 수백 줄의 설명 ..." // ❌ 간결하게 작성
   }
   ```

4. **삭제 대신 비활성화 미사용**
   - 히스토리 유지가 필요한 경우 삭제보다 비활성화 권장

---

## 에러 코드 및 해결 방법

### 400 Bad Request

**원인:**

- 필수 필드 누락
- 잘못된 UUID 형식
- 유효하지 않은 산출물 유형

**해결:**

```json
{
  "name": "산출물명",
  "type": "document", // 유효한 유형: document, code, design, report, presentation, other
  "employeeId": "550e8400-e29b-41d4-a716-446655440000", // 올바른 UUID 형식
  "wbsItemId": "550e8400-e29b-41d4-a716-446655440001"
}
```

---

### 404 Not Found

**원인:**

- 존재하지 않는 산출물 ID
- 존재하지 않는 직원 ID
- 존재하지 않는 WBS 항목 ID

**해결:**

1. ID가 올바른지 확인
2. 직원/WBS 항목이 존재하는지 확인
3. 소프트 삭제된 항목인지 확인

---

## 참고 자료

### 관련 API

- [WBS 할당 API](./admin-wbs-assignment.md)
- [WBS 자기평가 API](./admin-wbs-self-evaluation.md)
- [프로젝트 할당 API](./admin-project-assignment.md)

### 데이터 모델

- `Deliverable`: 산출물 엔티티
- `DeliverableMapping`: 산출물-직원-WBS 매핑

### Swagger UI

- 개발 환경: `http://localhost:3000/api/docs`
- API 태그: `C-5. 관리자 - 성과평가 - 산출물`

---

**작성일**: 2024-01-15
**최종 수정일**: 2024-01-15

