# Interface 레이어 코딩 규칙

## 개요

이 문서는 `src/interface/` 폴더 내에서 코드를 작성할 때 따라야 하는 규칙을 정의합니다.

## 1. 공용 데코레이터 사용 우선 (중요 ⭐)

### 규칙

**절대 인라인 Transform을 직접 작성하지 말고, 항상 `@interface/decorators/`의 공용 데코레이터를 우선 사용해야 합니다.**

### 공용 데코레이터 목록

#### Boolean 변환

- ❌ **금지**: `@Transform(({ value }) => { ... })` 직접 작성
- ✅ **사용**: `@ToBoolean()`, `@ToBooleanStrict()`, `@OptionalToBoolean()`, `@OptionalToBooleanStrict()`

```typescript
// ❌ 나쁜 예 - 직접 Transform 작성
@Transform(({ value }) => {
  if (value === 'true') return true;
  return false;
})
@IsBoolean()
includeExcluded?: boolean;

// ✅ 좋은 예 - 공용 데코레이터 사용
import { ToBoolean } from '@interface/decorators';

@ToBoolean(false)
@IsBoolean()
includeExcluded?: boolean;
```

#### Date 변환

- ❌ **금지**: `@Transform(({ value }) => new Date(value))` 직접 작성
- ✅ **사용**: `@DateToUTC()`, `@OptionalDateToUTC()`

```typescript
// ❌ 나쁜 예
@Transform(({ value }) => new Date(value))
@IsDate()
startDate: Date;

// ✅ 좋은 예
import { DateToUTC } from '@interface/decorators';

@DateToUTC()
@IsDate()
startDate: Date;
```

#### UUID 파싱

- ❌ **금지**: 컨트롤러에서 직접 UUID 검증
- ✅ **사용**: `@ParseUUID(paramName)` 데코레이터

```typescript
// ❌ 나쁜 예
@Get(':id')
async getItem(@Param('id') id: string) {
  if (!isUUID(id)) throw new BadRequestException();
  // ...
}

// ✅ 좋은 예
import { ParseUUID } from '@interface/decorators';

@Get(':id')
async getItem(@ParseUUID('id') id: string) {
  // ...
}
```

### 새로운 변환이 필요한 경우

1. **먼저 확인**: `@interface/decorators/`에 유사한 데코레이터가 있는지 확인
2. **재사용 가능성 판단**: 해당 변환 로직이 다른 곳에서도 사용될 가능성이 있는가?
3. **공용 데코레이터 생성**:
   - 재사용 가능하다면 `@interface/decorators/`에 새 데코레이터 추가
   - `index.ts`에 export 추가
   - 코드 자체가 자기 문서화(self-documenting)되도록 작성
4. **코드 리뷰 시 체크**: PR 리뷰 시 인라인 Transform 사용 여부 확인

## 2. DTO 작성 규칙

### Import 순서

```typescript
// 1. NestJS/Swagger 관련
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// 2. class-transformer (Type만 필요한 경우)
import { Type } from 'class-transformer';

// 3. class-validator
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

// 4. 공용 데코레이터 (Transform은 여기서)
import { ToBoolean, DateToUTC, ParseUUID } from '@interface/decorators';
```

### 데코레이터 순서

```typescript
export class ExampleDto {
  @ApiProperty() // 1. Swagger 문서화
  @IsNotEmpty() // 2. 유효성 검사
  @IsString() // 3. 타입 검증
  name: string;

  @ApiPropertyOptional() // 1. Swagger 문서화
  @IsOptional() // 2. Optional 선언
  @ToBoolean(false) // 3. 값 변환
  @IsBoolean() // 4. 타입 검증
  isActive?: boolean;

  @ApiPropertyOptional()
  @OptionalDateToUTC() // Optional 변환 데코레이터는 @IsOptional() 대신 사용 가능
  @IsDate()
  startDate?: Date;
}
```

## 3. API 데코레이터 작성 규칙

### API 문서화

- 모든 엔드포인트에 `@ApiOperation()` 추가
- **중요** 표시와 함께 간단한 설명 작성
- 테스트 케이스를 기반으로 상세 설명 추가

```typescript
@ApiOperation({
  summary: '평가 대상자 조회',
  description: `**중요**: 특정 평가기간의 평가 대상자 목록을 조회합니다.

**테스트 케이스:**
- 기본 조회: 모든 평가 대상자를 조회할 수 있어야 함
- 필터링: includeExcluded 파라미터로 제외된 대상자 포함 여부 제어
- 빈 결과: 대상자가 없는 경우 빈 배열 반환
- 잘못된 UUID: 잘못된 UUID 형식으로 요청 시 400 에러`,
})
```

### Query 파라미터 문서화

```typescript
@ApiQuery({
  name: 'includeExcluded',
  required: false,
  description: '제외된 대상자 포함 여부 (기본값: false, 가능값: "true", "false", "1", "0")',
  type: String,  // Boolean이 아닌 String으로 명시 (query string이므로)
  example: 'false',
})
```

## 4. 컨트롤러 작성 규칙

### 메서드 명명 규칙

- HTTP 메서드를 접두사로 사용: `get-`, `post-`, `put-`, `patch-`, `delete-`
- RESTful 명명: `getItems()`, `getItem()`, `createItem()`, `updateItem()`, `deleteItem()`

### 파라미터 데코레이터 우선순위

```typescript
// ✅ 좋은 예 - 공용 데코레이터 사용
@Get(':id')
async getItem(
  @ParseUUID('id') id: string,  // UUID 자동 검증
  @Query() query: QueryDto,      // DTO로 검증
) {
  // ...
}

// ❌ 나쁜 예 - 직접 검증
@Get(':id')
async getItem(
  @Param('id') id: string,
  @Query('filter') filter: string,
) {
  // 수동 검증 필요
}
```

## 5. 에러 처리

### HTTP 상태 코드 가이드

- `200 OK`: 성공적인 GET, PUT, PATCH 요청
- `201 Created`: 성공적인 POST 요청 (리소스 생성)
- `204 No Content`: 성공적인 DELETE 요청 (응답 본문 없음)
- `400 Bad Request`: 잘못된 요청 (유효성 검증 실패, 잘못된 형식 등)
- `404 Not Found`: 리소스를 찾을 수 없음
- `409 Conflict`: 리소스 충돌 (중복 등록, 이미 처리된 요청 등)

### 예외 처리 예시

```typescript
// Domain 레이어에서 정의한 예외를 그대로 사용
// HTTP 상태 코드는 예외 클래스에서 정의됨

// 409 Conflict 예시
throw new AlreadyExcludedEvaluationTargetException(periodId, employeeId);

// 404 Not Found 예시
throw new EvaluationPeriodEmployeeMappingNotFoundException(mappingId);
```

## 6. 테스트 작성 규칙

### E2E 테스트 파일 구조

```typescript
describe('엔드포인트 그룹', () => {
  // 성공 케이스
  describe('성공 케이스', () => {
    it('기본 동작을 테스트한다', async () => {
      // Given - 테스트 데이터 준비
      // When - API 호출
      // Then - 결과 검증
    });
  });

  // 실패 케이스
  describe('실패 케이스', () => {
    it('잘못된 입력에 대한 에러를 테스트한다', async () => {
      // Given - 잘못된 데이터 준비
      // When & Then - 에러 검증
    });
  });
});
```

### Query 파라미터 테스트

```typescript
// Boolean query 파라미터는 문자열로 전달
await request(app.getHttpServer())
  .get('/api/items')
  .query({ includeExcluded: 'true' }) // ✅ 문자열
  .expect(200);

// 기본값 테스트 - 파라미터 생략
await request(app.getHttpServer())
  .get('/api/items')
  // query 생략 시 기본값 적용
  .expect(200);
```

## 7. 체크리스트

코드 작성 완료 후 다음 사항을 확인하세요:

### DTO 체크리스트

- [ ] `@Transform()` 직접 사용하지 않았는가?
- [ ] 공용 데코레이터(`@ToBoolean`, `@DateToUTC` 등) 사용했는가?
- [ ] `@interface/decorators`에서 import 했는가?
- [ ] 데코레이터 순서가 올바른가? (문서화 → 검증 → 변환 → 타입)

### API 문서화 체크리스트

- [ ] `@ApiOperation()`에 설명 추가했는가?
- [ ] 테스트 케이스 기반 설명 추가했는가?
- [ ] Query 파라미터 타입을 String으로 명시했는가? (boolean query의 경우)
- [ ] 예제 값이 적절한가?

### 컨트롤러 체크리스트

- [ ] `@ParseUUID()` 데코레이터 사용했는가?
- [ ] DTO로 요청 데이터 검증하는가?
- [ ] HTTP 상태 코드가 적절한가?

### 테스트 체크리스트

- [ ] 성공 케이스와 실패 케이스 모두 작성했는가?
- [ ] Query 파라미터를 문자열로 전달했는가?
- [ ] Given-When-Then 패턴을 따랐는가?
- [ ] 엣지 케이스(빈 배열, null, undefined 등) 테스트했는가?

## 8. 참고 문서

### 역할 구분

**이 문서 (AGENTS.md)** - 🚨 **필수 규칙**

- AI와 개발자가 반드시 따라야 할 코딩 규칙
- "무엇을 하면 안 되는가" (금지사항)
- 간결한 Do/Don't 가이드

**[README.md](./README.md)** - 📚 **상세 가이드**

- 컨트롤러 작성 패턴과 다양한 예제
- "어떻게 구현하는가" (구현 방법)
- Swagger 문서화 표준
- 전체 아키텍처 설명

💡 **작업 순서**: AGENTS.md 규칙 확인 → README.md 패턴 참고 → 코드 작성

## 9. 규칙 위반 시

- **코드 리뷰 시 반려**: 인라인 Transform 사용 시 수정 요청
- **리팩토링 우선**: 기존 코드에서 인라인 Transform 발견 시 공용 데코레이터로 교체
- **새 데코레이터 제안**: 필요한 공용 데코레이터가 없다면 추가 제안

---

**이 규칙을 따르면:**

- ✅ 코드 재사용성 향상
- ✅ 일관된 코드 스타일 유지
- ✅ 유지보수 용이성 증가
- ✅ 버그 감소 (검증된 공용 로직 사용)
