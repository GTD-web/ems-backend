import { Transform } from 'class-transformer';

import { BadRequestException } from '@nestjs/common';

/**
 * 날짜 문자열을 UTC Date 객체로 변환하는 헬퍼 함수
 */
function convertToUTCDate(value: any): Date | undefined {
  if (!value) return undefined;

  // 이미 Date 객체인 경우 그대로 반환
  if (value instanceof Date) {
    return value;
  }

  // 문자열이 아닌 경우 400 에러 발생
  if (typeof value !== 'string') {
    throw new BadRequestException(
      `날짜는 문자열 형식이어야 합니다. 받은 값: ${typeof value}`,
    );
  }

  // 문자열인 경우 UTC로 변환
  // YYYY-MM-DD 형식 → UTC 자정으로 설정 (엄격한 검증 포함)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);

    // 월과 일의 범위 검증
    if (month < 1 || month > 12) {
      throw new BadRequestException(
        `올바르지 않은 월입니다: ${month}. 1-12 범위여야 합니다.`,
      );
    }

    if (day < 1 || day > 31) {
      throw new BadRequestException(
        `올바르지 않은 일입니다: ${day}. 1-31 범위여야 합니다.`,
      );
    }

    // 해당 월의 실제 일수 검증
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) {
      throw new BadRequestException(
        `${year}년 ${month}월에는 ${day}일이 존재하지 않습니다. 최대 ${daysInMonth}일까지 가능합니다.`,
      );
    }

    return new Date(`${value}T00:00:00.000Z`);
  }

  // YYYY-MM-DDTHH:mm:ss 형식 (Z 없음) → UTC로 강제 변환
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) {
    return new Date(`${value}.000Z`);
  }

  // YYYY-MM-DDTHH:mm:ss.sss 형식 (Z 없음) → UTC로 강제 변환
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/.test(value)) {
    return new Date(`${value}Z`);
  }

  // YYYY-MM-DDTHH:mm:ss.ssssss 형식 (마이크로초, Z 없음) → UTC로 강제 변환
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}$/.test(value)) {
    // 마이크로초를 밀리초로 변환 (뒤 3자리 제거)
    const truncated = value.substring(0, 23);
    return new Date(`${truncated}Z`);
  }

  // 이미 Z나 타임존 정보가 있는 ISO 8601 형식 허용
  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/.test(
      value,
    )
  ) {
    const date = new Date(value);

    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      throw new BadRequestException(`올바르지 않은 날짜 형식입니다: ${value}`);
    }

    return date;
  }

  // 지원하지 않는 형식
  throw new BadRequestException(
    `지원하지 않는 날짜 형식입니다: ${value}. YYYY-MM-DD 또는 ISO 8601 형식을 사용해주세요.`,
  );
}

/**
 * 날짜 문자열을 UTC Date 객체로 변환하는 데코레이터
 *
 * 지원하는 형식:
 * - YYYY-MM-DD → UTC 자정 (00:00:00.000Z)
 * - YYYY-MM-DDTHH:mm:ss → UTC 시간으로 강제 변환
 * - YYYY-MM-DDTHH:mm:ss.sss → UTC 시간으로 강제 변환
 * - YYYY-MM-DDTHH:mm:ss.ssssss → UTC 시간으로 강제 변환 (마이크로초 → 밀리초)
 * - ISO 8601 with timezone (Z, +HH:mm, -HH:mm) → 그대로 사용
 *
 * @example
 * ```typescript
 * @DateToUTC()
 * startDate: string;
 * ```
 */
export function DateToUTC() {
  return Transform(({ value }) => {
    return convertToUTCDate(value);
  });
}

/**
 * 선택적 날짜 문자열을 UTC Date 객체로 변환하는 데코레이터
 * undefined, null, 빈 문자열을 허용합니다.
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

    return convertToUTCDate(value);
  });
}
