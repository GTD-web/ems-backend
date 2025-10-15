# Interface Layer - Controller Development Guide

> 컨트롤러 작성 가이드 및 Swagger 문서화 표준

## ⚠️ 중요: 코딩 규칙

**Interface 레이어 내에서 코드 작성 시 반드시 [AGENTS.md](./AGENTS.md) 규칙을 따라야 합니다.**

특히 다음 사항을 엄수하세요:

- ✅ **공용 데코레이터 우선 사용** (`@interface/decorators/`)
- ❌ **인라인 `@Transform()` 직접 작성 금지**
- 📖 **필수 규칙**: [AGENTS.md](./AGENTS.md) - AI와 개발자가 반드시 따라야 할 코딩 규칙

## 📁 구조 개요

```
src/interface/
├── admin/           # 관리자 인터페이스
├── user/            # 사용자 인터페이스 (향후)
├── public/          # 공개 인터페이스 (향후)
└── interface.module.ts
```

## 🎯 컨트롤러 작성 원칙

### 1. **단순성 우선**

- try-catch 사용 금지 → 서비스 결과 그대로 반환
- ApiResponseDto 래핑 금지 → 원본 타입 그대로 노출
- 내부 변환 함수 금지 → 메서드 내 직접 변환

### 2. **책임 분리**

- 컨트롤러: API DTO ↔ Context DTO 변환만 담당
- 에러 처리: NestJS 글로벌 필터 또는 서비스 레이어에서 처리
- 비즈니스 로직: Context 서비스에서 처리

### 3. **REST API 메서드 선택**

- **POST**: 새 리소스 생성
- **GET**: 리소스 조회 (단일/목록)
- **PATCH**: 리소스 부분 수정 ✅ (권장)
- **PUT**: 리소스 전체 교체 (특별한 경우만)
- **DELETE**: 리소스 삭제

#### ✅ HTTP 상태 코드 정리표

| 메서드     | 주 성공 코드 | 설명                             |
| ---------- | ------------ | -------------------------------- |
| **GET**    | 200          | 조회 성공, 본문에 데이터 포함    |
| **POST**   | 201          | 리소스 생성됨                    |
|            | 200/202      | 결과 반환 / 비동기 처리          |
| **PUT**    | 200/204      | 수정 성공                        |
|            | 201          | 리소스 새로 생성됨               |
| **PATCH**  | 200/204      | 부분 수정 성공                   |
|            | 202          | 비동기 처리                      |
| **DELETE** | 204          | 삭제 성공 (본문 없음, 가장 흔함) |
|            | 200/202      | 삭제 결과 반환 / 비동기 처리     |

## 📝 작성 패턴

### 기본 구조

```typescript
@ApiTags('Admin - Feature Name')
@Controller('admin/feature-name')
export class FeatureController {
  constructor(private readonly featureService: FeatureContextService) {}

  @Post()
  @ApiOperation({ summary: '기능 생성' })
  @ApiResponse({ status: 201, description: '성공적으로 생성되었습니다.' })
  async createFeature(
    @Body() createData: CreateFeatureApiDto,
  ): Promise<FeatureDto> {
    // 1. API DTO → Context DTO 직접 변환
    const contextDto: CreateFeatureContextDto = {
      name: createData.name,
      // 날짜 변환 예시 (UTC 데코레이터 사용)
      startDate: createData.startDate as unknown as Date,
      // 배열 매핑 예시
      items:
        createData.items?.map((item) => ({
          id: item.id,
          value: item.value,
        })) || [],
    };

    // 2. 서비스 호출 및 결과 직접 반환
    return await this.featureService.기능_생성한다(contextDto, 'admin');
  }

  @Patch(':id/basic-info')
  @ApiOperation({ summary: '기능 기본 정보 부분 수정' })
  @ApiResponse({ status: 200, description: '성공적으로 수정되었습니다.' })
  async updateFeatureBasicInfo(
    @Param('id') id: string,
    @Body() updateData: UpdateFeatureBasicApiDto,
  ): Promise<FeatureDto> {
    const contextDto: UpdateFeatureBasicContextDto = {
      name: updateData.name,
      description: updateData.description,
      // 선택적 필드들만 포함
    };

    return await this.featureService.기능기본정보_수정한다(
      id,
      contextDto,
      'admin',
    );
  }
}
```

### DTO 변환 패턴

> ⚠️ **중요**: 값 변환이 필요한 경우 반드시 `@interface/decorators/`의 공용 데코레이터를 사용하세요.
>
> - Boolean: `@ToBoolean()`, `@ToBooleanStrict()`
> - Date: `@DateToUTC()`, `@OptionalDateToUTC()`
> - UUID: `@ParseUUID()`
>
> 상세 규칙: [AGENTS.md](./AGENTS.md) - 공용 데코레이터 사용 규칙 참조

#### 날짜 변환

```typescript
// DTO 정의
import { DateToUTC, OptionalDateToUTC } from '@interface/decorators';

export class CreateFeatureDto {
  @ApiProperty({ example: '2024-01-01' })
  @DateToUTC() // ✅ 공용 데코레이터 사용
  @IsDate()
  startDate: Date;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @OptionalDateToUTC() // ✅ Optional 날짜도 지원
  @IsOptional()
  @IsDate()
  endDate?: Date;
}

// 컨트롤러에서는 이미 변환된 Date 객체 사용
const contextDto = {
  startDate: apiDto.startDate, // 이미 Date 객체
  endDate: apiDto.endDate, // 이미 Date 객체 또는 undefined
};
```

#### 배열 매핑

```typescript
// ✅ 올바른 방법
items: apiDto.items?.map((item) => ({
  name: item.name,
  value: item.value,
})) || [],
```

#### 중첩 객체 변환

```typescript
// ✅ 올바른 방법
const contextDto: CreateContextDto = {
  basicInfo: {
    name: apiDto.name,
    description: apiDto.description,
  },
  settings: {
    enabled: apiDto.allowSetting,
    maxValue: apiDto.maxValue || 100,
  },
};
```

#### UUID 검증

```typescript
// ✅ 올바른 방법 - 공용 ParseUUID 데코레이터 사용
import { ParseUUID } from '@interface/decorators';

@Get(':id')
async getDetail(
  @ParseUUID('id') id: string,  // 자동으로 UUID 형식 검증
): Promise<FeatureDto> {
  return await this.service.getDetail(id);
}

// 다른 파라미터명 사용 시
@Get(':userId')
async getUserDetail(
  @ParseUUID('userId') userId: string,  // 파라미터명 명시
): Promise<UserDto> {
  return await this.service.getUserDetail(userId);
}

// DTO에서 UUID 검증
export class UuidParamDto {
  @ApiProperty({
    description: 'ID (UUID 형식)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4', { message: '올바른 UUID 형식이어야 합니다.' })
  @IsNotEmpty({ message: 'ID는 필수 입력 항목입니다.' })
  id: string;
}
```

## 📚 Swagger 문서 작성 가이드

### 기본 구조

```typescript
@ApiTags('관리자 - 기능명')
@Controller('admin/feature-name')
export class FeatureController {
  @Get('active')
  @ApiOperation({
    summary: '활성 기능 조회',
    description: `**중요**: 특정 조건에 대한 설명

**테스트 케이스:**
- 빈 상태: 조건에 맞는 데이터가 없을 때 빈 배열 반환
- 다중 데이터: 여러 데이터 중 조건에 맞는 것만 필터링
- 상태 확인: 반환된 데이터의 상태가 올바르게 설정됨`,
  })
  @ApiResponse({
    status: 200,
    description: '성공적으로 조회되었습니다.',
    type: [FeatureResponseDto],
  })
  @ApiResponse({ status: 400, description: '잘못된 요청입니다.' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  async getActiveFeatures(): Promise<FeatureDto[]> {
    return await this.service.getActive();
  }
}
```

### HTTP 상태 코드 문서화 원칙

#### GET 엔드포인트

```typescript
@ApiResponse({ status: 200, description: '조회 성공' })
@ApiResponse({ status: 400, description: '잘못된 요청 파라미터' })
@ApiResponse({ status: 500, description: '서버 내부 오류' })
```

#### POST 엔드포인트 (생성)

```typescript
@Post('')
@HttpCode(HttpStatus.CREATED)
@ApiOperation({
  summary: '리소스 생성',
  description: `**핵심 테스트 케이스:**
- 기본 생성: 필수 필드로 리소스 생성
- 복잡한 데이터: 다양한 하위 구조 설정
- 최소 데이터: 필수 필드만으로 생성 (기본값 자동 적용)
- 필수 필드 누락: 필수 필드 누락 시 400 에러
- 중복 데이터: 동일한 식별자로 생성 시 409 에러
- 잘못된 데이터: 검증 실패 시 적절한 에러 응답`,
})
@ApiResponse({
  status: 201,
  description: '성공적으로 생성되었습니다.',
  type: ResourceResponseDto,
})
@ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' })
@ApiResponse({
  status: 409,
  description: '중복된 데이터입니다.',
})
@ApiResponse({
  status: 500,
  description: '서버 내부 오류 (도메인 검증 실패 등)',
})
```

#### POST 엔드포인트 (상태 변경)

```typescript
@ApiResponse({ status: 200, description: '성공적으로 처리되었습니다.' })
@ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' })
@ApiResponse({ status: 404, description: '리소스를 찾을 수 없습니다.' })
@ApiResponse({ status: 422, description: '처리할 수 없는 상태입니다.' })
```

#### PATCH 엔드포인트

```typescript
@ApiResponse({ status: 200, description: '성공적으로 수정되었습니다.' })
@ApiResponse({ status: 400, description: '잘못된 요청 데이터입니다.' })
@ApiResponse({ status: 404, description: '리소스를 찾을 수 없습니다.' })
@ApiResponse({ status: 422, description: '비즈니스 로직 오류' })
```

#### DELETE 엔드포인트

```typescript
@ApiResponse({ status: 200, description: '성공적으로 삭제되었습니다.' })
@ApiResponse({ status: 400, description: '잘못된 요청입니다.' })
@ApiResponse({ status: 404, description: '리소스를 찾을 수 없습니다.' })
@ApiResponse({ status: 422, description: '삭제할 수 없는 상태입니다.' })
```

### 테스트 케이스 문서화

#### GET 엔드포인트 예시

```typescript
@ApiOperation({
  summary: '활성 리소스 조회',
  description: `**중요**: 특정 상태의 리소스만 반환됩니다.

**테스트 케이스:**
- 빈 상태: 조건에 맞는 데이터가 없을 때 빈 배열 반환
- 다중 데이터: 여러 데이터 중 조건에 맞는 것만 필터링
- 상태 확인: 반환된 데이터의 상태가 올바르게 설정됨
- 제외 조건: 특정 상태의 데이터는 결과에서 제외됨`,
})
```

#### POST 엔드포인트 예시

```typescript
@ApiOperation({
  summary: '리소스 생성',
  description: `**핵심 테스트 케이스:**
- 기본 생성: 필수 필드로 리소스 생성
- 복잡한 데이터: 다양한 하위 구조 설정
- 최소 데이터: 필수 필드만으로 생성 (기본값 자동 적용)
- 필수 필드 누락: 필수 필드 누락 시 400 에러
- 중복 데이터: 동일한 식별자로 생성 시 409 에러
- 잘못된 데이터: 검증 실패 시 적절한 에러 응답`,
})
```

#### 일반적인 패턴

```typescript
@ApiOperation({
  summary: 'API 요약',
  description: `**중요**: 핵심 동작 설명

**테스트 케이스:**
- 기본 동작: 정상적인 경우의 동작 설명
- 예외 상황: 특수한 조건에서의 동작 설명
- 에러 처리: 다양한 에러 상황에 대한 응답`,
})
```

## 🚫 금지 사항

### 1. try-catch 사용 금지

```typescript
// ❌ 금지
async createFeature() {
  try {
    const result = await this.service.create();
    return new ApiResponseDto(true, 'success', result);
  } catch (error) {
    return new ApiResponseDto(false, 'error', null, error.message);
  }
}

// ✅ 올바른 방법
async createFeature() {
  return await this.service.create();
}
```

### 2. 내부 변환 함수 금지

```typescript
// ❌ 금지
private convertApiToContext(apiDto: ApiDto): ContextDto {
  return { /* 변환 로직 */ };
}

// ✅ 올바른 방법 - 메서드 내 직접 변환
async createFeature(@Body() apiDto: ApiDto) {
  const contextDto: ContextDto = {
    name: apiDto.name,
    // 직접 변환
  };
  return await this.service.create(contextDto);
}
```

### 3. 응답 래핑 금지

```typescript
// ❌ 금지
Promise<ApiResponseDto<FeatureDto>>;

// ✅ 올바른 방법
Promise<FeatureDto>;
```

## 📋 체크리스트

### 컨트롤러 작성 시 확인사항

- [ ] try-catch 없이 작성했는가?
- [ ] 서비스 결과를 그대로 반환하는가?
- [ ] API DTO를 Context DTO로 직접 변환하는가?
- [ ] 내부 변환 함수를 사용하지 않았는가?
- [ ] 적절한 HTTP 메서드를 선택했는가? (부분 수정 시 PATCH 사용)
- [ ] **Swagger 문서화가 완료되었는가?**
  - [ ] `@ApiOperation`에 summary와 description 작성
  - [ ] 모든 성공/실패 상태 코드에 대한 `@ApiResponse` 추가
  - [ ] 테스트 케이스 정보를 description에 포함
  - [ ] POST 엔드포인트의 경우 핵심 테스트 케이스만 선별하여 문서화
  - [ ] 에러 상황별 적절한 HTTP 상태 코드 문서화 (400, 409, 422, 500 등)
- [ ] **UUID 검증이 적용되었는가?**
  - [ ] UUID 파라미터에 `@ParseId()` 또는 `@ParseUUID()` 커스텀 데코레이터 사용
  - [ ] DTO에서 `@IsUUID()` 데코레이터 사용
  - [ ] 한국어 에러 메시지 제공 확인
- [ ] 타입 안전성이 보장되는가?
- [ ] UTC 날짜 변환 데코레이터를 올바르게 사용했는가?

### 모듈 구성 시 확인사항

- [ ] Context 모듈을 올바르게 import했는가?
- [ ] 컨트롤러를 모듈에 등록했는가?
- [ ] DTO 파일이 별도로 관리되는가?

## 🎯 장점

1. **단순성**: 복잡한 래핑 로직 없이 직관적인 코드
2. **투명성**: 서비스 레이어의 결과를 그대로 노출
3. **성능**: 불필요한 변환 및 래핑 오버헤드 제거
4. **유지보수**: 각 메서드가 독립적이고 명확한 책임
5. **일관성**: NestJS 표준 패턴 준수

## 📚 참고 예시

현재 구현된 `admin/evaluation-management.controller.ts`를 참고하여 동일한 패턴으로 작성하세요.
