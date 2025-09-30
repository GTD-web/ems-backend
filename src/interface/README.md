# Interface Layer - 컨트롤러 작성 가이드

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

#### 날짜 변환

```typescript
// ✅ 올바른 방법 (UTC 데코레이터 사용 시)
startDate: apiDto.startDate as unknown as Date,
endDate: apiDto.endDate as unknown as Date,

// DTO에서 @DateToUTC() 또는 @OptionalDateToUTC() 데코레이터 사용
// class-transformer가 자동으로 UTC Date 객체로 변환
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
- [ ] Swagger 문서화가 완료되었는가?
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
