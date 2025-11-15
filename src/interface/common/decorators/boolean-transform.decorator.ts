import { Transform } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';

/**
 * 다양한 형식의 값을 boolean으로 변환하는 헬퍼 함수
 *
 * true로 변환되는 값: true, 'true', '1', 1, 'yes', 'on'
 * false로 변환되는 값: false, 'false', '0', 0, 'no', 'off'
 * undefined/null은 기본값으로 처리
 *
 * @param value 변환할 값
 * @param defaultValue 기본값 (undefined/null일 때 사용)
 * @param strict 엄격 모드 (true면 잘못된 값에 대해 예외 발생)
 */
function convertToBoolean(
  value: any,
  defaultValue?: boolean,
  strict: boolean = false,
): boolean {
  // undefined 또는 null인 경우 기본값 반환
  if (value === undefined || value === null) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    return false; // 기본값이 없으면 false
  }

  // 이미 boolean인 경우 그대로 반환
  if (typeof value === 'boolean') {
    return value;
  }

  // 숫자인 경우
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;

    if (strict) {
      throw new BadRequestException(
        `boolean으로 변환할 수 없는 숫자입니다: ${value}. 0 또는 1만 허용됩니다.`,
      );
    }
    return !!value; // 0이 아닌 모든 숫자는 true
  }

  // 문자열인 경우
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase().trim();

    // true로 변환
    if (['true', '1', 'yes', 'on'].includes(lowerValue)) {
      return true;
    }

    // false로 변환
    if (['false', '0', 'no', 'off', ''].includes(lowerValue)) {
      return false;
    }

    if (strict) {
      throw new BadRequestException(
        `boolean으로 변환할 수 없는 문자열입니다: "${value}". 허용되는 값: true, false, 1, 0, yes, no, on, off`,
      );
    }
    return false; // 기본값 false
  }

  // 그 외의 타입
  if (strict) {
    throw new BadRequestException(
      `boolean으로 변환할 수 없는 타입입니다: ${typeof value}`,
    );
  }
  return !!value; // truthy/falsy 변환
}

/**
 * Query string이나 form data의 값을 boolean으로 변환하는 데코레이터
 *
 * 지원하는 true 값: true, 'true', '1', 1, 'yes', 'on'
 * 지원하는 false 값: false, 'false', '0', 0, 'no', 'off', '', undefined, null
 *
 * @example
 * ```typescript
 * @ToBoolean()
 * isActive: boolean;
 * ```
 *
 * @example
 * ```typescript
 * // 기본값 true로 설정
 * @ToBoolean(true)
 * includeDeleted: boolean;
 * ```
 */
export function ToBoolean(defaultValue?: boolean) {
  return Transform(({ value }) => {
    return convertToBoolean(value, defaultValue, false);
  });
}

/**
 * Query string이나 form data의 값을 boolean으로 엄격하게 변환하는 데코레이터
 * 허용되지 않는 값이 들어오면 BadRequestException 발생
 *
 * 허용되는 true 값: true, 'true', '1', 1
 * 허용되는 false 값: false, 'false', '0', 0
 *
 * ⚠️ 'yes', 'no', 'on', 'off' 등은 허용하지 않음
 *
 * @param defaultValue - undefined/null일 때 사용할 기본값
 * @param fieldName - 에러 메시지에 표시할 필드명 (선택사항)
 *
 * @example
 * ```typescript
 * @ToBooleanStrict(false, 'includeExcluded')
 * @IsBoolean()
 * includeExcluded: boolean;
 * ```
 */
export function ToBooleanStrict(defaultValue?: boolean, fieldName?: string) {
  return Transform(({ value, key }) => {
    // undefined나 null 처리
    // defaultValue가 명시적으로 undefined인 경우 (필수 파라미터), 예외 발생하지 않고 그대로 전달
    // 이렇게 하면 @IsNotEmpty()가 먼저 체크할 수 있음
    if (value === undefined || value === null) {
      // defaultValue가 undefined가 아니면 기본값 반환
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      // defaultValue가 undefined면 그대로 반환 (필수 파라미터는 @IsNotEmpty()가 체크)
      return value;
    }

    // 이미 boolean인 경우 그대로 반환
    if (typeof value === 'boolean') {
      return value;
    }

    // 숫자인 경우 - 0, 1만 허용
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;

      throw new BadRequestException(
        `${fieldName || key}는 0 또는 1만 허용됩니다 (입력값: ${value})`,
      );
    }

    // 문자열인 경우 - 'true', 'false', '1', '0'만 허용
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase().trim();

      if (lowerValue === 'true' || lowerValue === '1') {
        return true;
      }

      if (lowerValue === 'false' || lowerValue === '0') {
        return false;
      }

      throw new BadRequestException(
        `${fieldName || key}는 true, false, 1, 0만 허용됩니다 (입력값: "${value}")`,
      );
    }

    // 그 외의 타입
    throw new BadRequestException(
      `${fieldName || key}는 boolean 값만 허용됩니다 (입력 타입: ${typeof value})`,
    );
  });
}

/**
 * 선택적 boolean 변환 데코레이터
 * undefined, null을 허용하며 그대로 반환합니다.
 *
 * @example
 * ```typescript
 * @OptionalToBoolean()
 * includeExcluded?: boolean;
 * ```
 */
export function OptionalToBoolean() {
  return Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    return convertToBoolean(value, undefined, false);
  });
}

/**
 * 선택적이지만 엄격한 boolean 변환 데코레이터
 * undefined, null을 허용하지만, 다른 값은 엄격하게 검증합니다.
 *
 * @example
 * ```typescript
 * @OptionalToBooleanStrict()
 * includeExcluded?: boolean;
 * ```
 */
export function OptionalToBooleanStrict() {
  return Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    return convertToBoolean(value, undefined, true);
  });
}
