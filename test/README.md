# E2E 테스트 케이스 작성 가이드

## 📋 개요

이 문서는 평가 관리 시스템의 E2E 테스트 케이스 작성 방법과 필수 테스트 시나리오를 정리한 가이드입니다.

## 🏗️ 테스트 구조

### 디렉토리 구조

```
test/
├── interface/admin/evaluation-period-management/
│   ├── get-active-periods.e2e-spec.ts
│   ├── get-evaluation-periods.e2e-spec.ts
│   ├── get-evaluation-period-detail.e2e-spec.ts
│   └── post-evaluation-period.e2e-spec.ts
├── base-e2e.spec.ts
├── setup.ts
└── jest-e2e.json
```

### 파일 명명 규칙

- `{method}-{endpoint-name}.e2e-spec.ts`
- 예: `get-active-periods.e2e-spec.ts`, `post-evaluation-period.e2e-spec.ts`

## 🧪 테스트 케이스 분류

### 1. **성공 케이스 (Happy Path)**

- ✅ 유효한 데이터로 정상 처리
- ✅ 최소한의 필수 데이터로 처리
- ✅ 복잡한 데이터 구조 처리
- ✅ 특수 문자 및 다국어 처리
- ✅ 대용량 데이터 처리

### 2. **클라이언트 에러 (400번대)**

- ❌ **400 Bad Request**
  - 필수 필드 누락
  - 잘못된 데이터 타입
  - 범위 초과 값
  - 빈 문자열/null 값
  - 잘못된 JSON 형식
- ❌ **404 Not Found**
  - 존재하지 않는 리소스 ID
- ❌ **409 Conflict**
  - 중복된 데이터 (이름, 날짜 범위 겹침)
- ❌ **415 Unsupported Media Type**
  - Content-Type 헤더 누락

### 3. **서버 에러 (500번대)**

- ❌ **500 Internal Server Error**
  - 도메인 비즈니스 규칙 위반
  - 날짜 변환 에러
  - 데이터베이스 제약 조건 위반

### 4. **경계값 테스트 (Boundary Testing)**

- 🔢 **숫자 필드**
  - 최소값 (0, 1)
  - 최대값 (100, 1000)
  - 소수점 값
  - 음수 값
- 📝 **문자열 필드**
  - 최소 길이 (1자)
  - 최대 길이 (100자, 1000자)
  - 공백 문자만 포함
  - 특수 문자 포함
- 📅 **날짜 필드**
  - 과거/현재/미래 날짜
  - 윤년/평년 2월 29일
  - 시작일 = 종료일
  - 시작일 > 종료일

### 5. **입력값 검증 테스트**

- 🔍 **데이터 타입 검증**
  - 문자열 → 숫자 변환 시도
  - 숫자 → 문자열 변환 시도
  - 배열 → 객체 변환 시도
- 🔍 **형식 검증**
  - UUID 형식
  - 날짜 형식 (YYYY-MM-DD)
  - 이메일 형식
- 🔍 **비즈니스 규칙 검증**
  - 등급 구간 겹침
  - 중복된 등급명
  - 평가 기간 겹침

### 6. **도메인 예외 처리 테스트**

- 🚫 **존재하지 않는 리소스**
  - 잘못된 UUID
  - 삭제된 리소스
- 🚫 **상태 전이 에러**
  - 잘못된 상태에서 액션 시도
  - 이미 완료된 작업 재시도
- 🚫 **권한 에러** (향후 추가)
  - 접근 권한 없는 리소스
  - 수정 권한 없는 액션

## 📝 테스트 케이스 작성 템플릿

### GET 엔드포인트 테스트

```typescript
describe('GET /endpoint', () => {
  // 1. 성공 케이스
  it('정상 데이터를 조회해야 한다', async () => {
    // Given: 테스트 데이터 생성
    // When: API 호출
    // Then: 응답 검증
  });

  // 2. 빈 결과 케이스
  it('데이터가 없을 때 빈 목록을 반환해야 한다', async () => {});

  // 3. 페이징 테스트 (목록 조회)
  it('페이징이 정상 작동해야 한다', async () => {});

  // 4. 필터링 테스트
  it('필터 조건에 맞는 데이터만 조회해야 한다', async () => {});

  // 5. 정렬 테스트
  it('정렬이 정상 작동해야 한다', async () => {});

  // 6. 에러 케이스
  it('존재하지 않는 ID로 조회 시 404 에러가 발생해야 한다', async () => {});
  it('잘못된 UUID 형식으로 조회 시 적절한 에러가 발생해야 한다', async () => {});
});
```

### POST 엔드포인트 테스트

```typescript
describe('POST /endpoint', () => {
  // 1. 성공 케이스
  it('유효한 데이터로 생성해야 한다', async () => {});
  it('최소한의 필수 데이터로 생성해야 한다', async () => {});
  it('복잡한 데이터 구조로 생성해야 한다', async () => {});

  // 2. 필수 필드 검증
  it('필수 필드가 누락된 경우 400 에러가 발생해야 한다', async () => {});

  // 3. 데이터 타입 검증
  it('잘못된 데이터 타입인 경우 400 에러가 발생해야 한다', async () => {});

  // 4. 경계값 테스트
  it('최소값/최대값 경계에서 정상 처리되어야 한다', async () => {});
  it('범위를 벗어난 값인 경우 400 에러가 발생해야 한다', async () => {});

  // 5. 비즈니스 규칙 검증
  it('중복된 데이터인 경우 409 에러가 발생해야 한다', async () => {});
  it('비즈니스 규칙 위반 시 500 에러가 발생해야 한다', async () => {});

  // 6. HTTP 관련 에러
  it('Content-Type이 없는 경우 적절한 에러가 발생해야 한다', async () => {});
  it('잘못된 JSON 형식인 경우 400 에러가 발생해야 한다', async () => {});
});
```

### PATCH 엔드포인트 테스트

```typescript
describe('PATCH /endpoint/:id', () => {
  // 1. 성공 케이스
  it('유효한 데이터로 부분 수정해야 한다', async () => {});
  it('단일 필드만 수정해야 한다', async () => {});

  // 2. 존재하지 않는 리소스
  it('존재하지 않는 ID로 수정 시 404 에러가 발생해야 한다', async () => {});

  // 3. 데이터 검증
  it('잘못된 데이터로 수정 시 400 에러가 발생해야 한다', async () => {});

  // 4. 상태 전이 검증
  it('잘못된 상태에서 수정 시 422 에러가 발생해야 한다', async () => {});
});
```

### DELETE 엔드포인트 테스트

```typescript
describe('DELETE /endpoint/:id', () => {
  // 1. 성공 케이스
  it('존재하는 리소스를 삭제해야 한다', async () => {});

  // 2. 존재하지 않는 리소스
  it('존재하지 않는 ID로 삭제 시 404 에러가 발생해야 한다', async () => {});

  // 3. 삭제 불가능한 상태
  it('삭제할 수 없는 상태의 리소스 삭제 시 422 에러가 발생해야 한다', async () => {});

  // 4. 연관 데이터 확인
  it('삭제 후 연관 데이터가 정리되어야 한다', async () => {});
});
```

## 🎯 필수 테스트 시나리오

### 1. **CRUD 기본 시나리오**

- [ ] 생성 → 조회 → 수정 → 삭제
- [ ] 목록 조회 → 상세 조회
- [ ] 페이징 → 필터링 → 정렬

### 2. **상태 전이 시나리오**

- [ ] 대기 → 진행 중 → 완료
- [ ] 각 상태에서 허용/불허 액션 테스트

### 3. **동시성 시나리오**

- [ ] 동시 생성 시 중복 방지
- [ ] 동시 수정 시 충돌 처리

### 4. **데이터 무결성 시나리오**

- [ ] 외래 키 제약 조건
- [ ] 유니크 제약 조건
- [ ] 체크 제약 조건

## 🔧 테스트 작성 시 주의사항

### 1. **데이터 격리**

```typescript
beforeEach(async () => {
  await testSuite.cleanupBeforeTest(); // 각 테스트 전 DB 정리
});
```

### 2. **테스트 데이터 관리**

- 겹치지 않는 날짜 범위 사용
- 고유한 이름 사용 (타임스탬프 활용)
- 실제 운영 데이터와 구분되는 테스트 데이터

### 3. **에러 코드 검증**

```typescript
// 정확한 HTTP 상태 코드 검증
.expect(400); // Bad Request
.expect(404); // Not Found
.expect(409); // Conflict
.expect(422); // Unprocessable Entity
.expect(500); // Internal Server Error

// 여러 상태 코드 허용 (불확실한 경우)
expect([400, 404, 500]).toContain(response.status);
```

### 4. **응답 데이터 검증**

```typescript
// 구조 검증
expect(response.body).toMatchObject({
  id: expect.any(String),
  name: expectedName,
  createdAt: expect.any(String),
});

// 배열 검증
expect(response.body.items).toHaveLength(expectedLength);
expect(response.body.items).toEqual(
  expect.arrayContaining([expect.objectContaining({ name: 'Expected Name' })]),
);
```

## 📊 테스트 커버리지 목표

- **라인 커버리지**: 80% 이상
- **브랜치 커버리지**: 70% 이상
- **함수 커버리지**: 90% 이상
- **E2E 시나리오 커버리지**: 주요 사용자 플로우 100%

## 🚀 테스트 실행

```bash
# 전체 E2E 테스트
npm run test:e2e

# 특정 파일 테스트
npm run test:e2e -- --testPathPatterns="post-evaluation-period"

# 커버리지 포함 테스트
npm run test:e2e:cov

# 감시 모드
npm run test:e2e:watch
```

## 📚 참고 자료

- [Jest 공식 문서](https://jestjs.io/docs/getting-started)
- [Supertest 공식 문서](https://github.com/visionmedia/supertest)
- [NestJS 테스팅 가이드](https://docs.nestjs.com/fundamentals/testing)
- [Testcontainers 공식 문서](https://testcontainers.com/)

---

> 💡 **팁**: 테스트는 문서의 역할도 합니다. 테스트 케이스 이름과 설명을 명확하게 작성하여 API의 동작을 이해할 수 있도록 하세요.
