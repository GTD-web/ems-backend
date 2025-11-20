import { Transform } from 'class-transformer';

/**
 * Query string이나 form data의 값을 배열로 변환하는 데코레이터
 *
 * Query string에서 단일 값과 배열을 모두 처리합니다:
 * - 단일 값: ?param=value → ['value']
 * - 배열: ?param=value1&param=value2 → ['value1', 'value2']
 * - undefined/null → undefined (또는 빈 배열)
 *
 * @param emptyArrayOnUndefined true면 undefined를 빈 배열([])로 변환, false면 undefined 그대로 반환
 *
 * @example
 * ```typescript
 * // undefined는 undefined로 유지
 * @ToArray()
 * @IsArray()
 * @IsString({ each: true })
 * requestMethod?: string[];
 * ```
 *
 * @example
 * ```typescript
 * // undefined를 빈 배열로 변환
 * @ToArray(true)
 * @IsArray()
 * @IsString({ each: true })
 * tags: string[];
 * ```
 */
export function ToArray(emptyArrayOnUndefined: boolean = false) {
  return Transform(({ value }) => {
    // undefined 또는 null 처리
    if (value === undefined || value === null) {
      return emptyArrayOnUndefined ? [] : undefined;
    }

    // 이미 배열인 경우 그대로 반환
    if (Array.isArray(value)) {
      return value;
    }

    // 단일 값인 경우 배열로 래핑
    return [value];
  });
}

/**
 * 선택적 배열 변환 데코레이터
 * undefined, null을 허용하며 undefined를 그대로 반환합니다.
 * @IsOptional()과 함께 사용하기 적합합니다.
 *
 * @example
 * ```typescript
 * @ApiPropertyOptional()
 * @IsOptional()
 * @OptionalToArray()
 * @IsArray()
 * @IsString({ each: true })
 * requestMethod?: string[];
 * ```
 */
export function OptionalToArray() {
  return ToArray(false);
}

