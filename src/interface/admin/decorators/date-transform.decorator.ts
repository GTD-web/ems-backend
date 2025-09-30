import { Transform } from 'class-transformer';

/**
 * 날짜 문자열을 UTC Date 객체로 변환하는 데코레이터
 *
 * @example
 * ```typescript
 * @DateToUTC()
 * startDate: string;
 * ```
 */
export function DateToUTC() {
  return Transform(({ value }) => {
    if (!value) return undefined;

    // 이미 Date 객체인 경우 그대로 반환
    if (value instanceof Date) {
      return value;
    }

    // 문자열인 경우 UTC로 변환
    if (typeof value === 'string') {
      // ISO 8601 형식이 아닌 경우 (YYYY-MM-DD) UTC 자정으로 설정
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T00:00:00.000Z`);
      }

      // ISO 8601 형식인 경우 그대로 Date 생성 (자동으로 UTC 변환됨)
      const date = new Date(value);

      // 유효한 날짜인지 확인
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${value}`);
      }

      return date;
    }

    return undefined;
  });
}

/**
 * 선택적 날짜 문자열을 UTC Date 객체로 변환하는 데코레이터
 * undefined 값을 허용합니다.
 *
 * @example
 * ```typescript
 * @OptionalDateToUTC()
 * endDate?: string;
 * ```
 */
export function OptionalDateToUTC() {
  return Transform(({ value }) => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    // 이미 Date 객체인 경우 그대로 반환
    if (value instanceof Date) {
      return value;
    }

    // 문자열인 경우 UTC로 변환
    if (typeof value === 'string') {
      // ISO 8601 형식이 아닌 경우 (YYYY-MM-DD) UTC 자정으로 설정
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T00:00:00.000Z`);
      }

      // ISO 8601 형식인 경우 그대로 Date 생성 (자동으로 UTC 변환됨)
      const date = new Date(value);

      // 유효한 날짜인지 확인
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${value}`);
      }

      return date;
    }

    return undefined;
  });
}
