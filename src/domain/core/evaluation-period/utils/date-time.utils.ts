/**
 * 날짜/시간 유틸리티 클래스
 * 평가 기간 관련 날짜 계산 및 검증 기능을 제공합니다.
 */
export class DateTimeUtils {
  /**
   * 두 날짜 사이의 일수를 계산한다
   * @param startDate 시작일
   * @param endDate 종료일
   * @returns 일수 (종료일 포함)
   */
  static 일수계산한다(startDate: Date, endDate: Date): number {
    const diffInTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffInTime / (1000 * 60 * 60 * 24)) + 1; // 종료일 포함
  }

  /**
   * 날짜가 특정 범위 내에 있는지 확인한다
   * @param targetDate 확인할 날짜
   * @param startDate 시작일
   * @param endDate 종료일
   * @returns 범위 내 여부
   */
  static 날짜범위내인가(
    targetDate: Date,
    startDate: Date,
    endDate: Date,
  ): boolean {
    return targetDate >= startDate && targetDate <= endDate;
  }

  /**
   * 현재 날짜가 특정 날짜보다 이후인지 확인한다
   * @param targetDate 비교할 날짜
   * @returns 이후 여부
   */
  static 현재날짜이후인가(targetDate: Date): boolean {
    const now = new Date();
    return now > targetDate;
  }

  /**
   * 현재 날짜가 특정 날짜보다 이전인지 확인한다
   * @param targetDate 비교할 날짜
   * @returns 이전 여부
   */
  static 현재날짜이전인가(targetDate: Date): boolean {
    const now = new Date();
    return now < targetDate;
  }

  /**
   * 두 날짜 범위가 겹치는지 확인한다
   * @param start1 첫 번째 범위 시작일
   * @param end1 첫 번째 범위 종료일
   * @param start2 두 번째 범위 시작일
   * @param end2 두 번째 범위 종료일
   * @returns 겹침 여부
   */
  static 날짜범위겹침확인한다(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date,
  ): boolean {
    return start1 <= end2 && end1 >= start2;
  }

  /**
   * 날짜를 YYYY-MM-DD 형식의 문자열로 변환한다
   * @param date 변환할 날짜
   * @returns 형식화된 날짜 문자열
   */
  static 날짜문자열변환한다(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 문자열을 Date 객체로 변환한다
   * @param dateString YYYY-MM-DD 형식의 날짜 문자열
   * @returns Date 객체
   */
  static 문자열날짜변환한다(dateString: string): Date {
    return new Date(dateString);
  }

  /**
   * 날짜에 일수를 더한다
   * @param date 기준 날짜
   * @param days 더할 일수
   * @returns 새로운 날짜
   */
  static 일수더하기(date: Date, days: number): Date {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  }

  /**
   * 날짜에서 일수를 뺀다
   * @param date 기준 날짜
   * @param days 뺄 일수
   * @returns 새로운 날짜
   */
  static 일수빼기(date: Date, days: number): Date {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - days);
    return newDate;
  }

  /**
   * 월의 첫 번째 날을 반환한다
   * @param date 기준 날짜
   * @returns 월의 첫 번째 날
   */
  static 월첫째날(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * 월의 마지막 날을 반환한다
   * @param date 기준 날짜
   * @returns 월의 마지막 날
   */
  static 월마지막날(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  /**
   * 년도의 첫 번째 날을 반환한다
   * @param year 년도
   * @returns 년도의 첫 번째 날
   */
  static 년첫째날(year: number): Date {
    return new Date(year, 0, 1);
  }

  /**
   * 년도의 마지막 날을 반환한다
   * @param year 년도
   * @returns 년도의 마지막 날
   */
  static 년마지막날(year: number): Date {
    return new Date(year, 11, 31);
  }

  /**
   * 평가 기간의 진행률을 계산한다
   * @param startDate 시작일
   * @param endDate 종료일
   * @param currentDate 현재 날짜 (선택적, 기본값: 현재 날짜)
   * @returns 진행률 (0-100)
   */
  static 평가기간진행률계산한다(
    startDate: Date,
    endDate: Date,
    currentDate?: Date,
  ): number {
    const now = currentDate || new Date();

    if (now < startDate) {
      return 0; // 아직 시작되지 않음
    }

    if (now > endDate) {
      return 100; // 이미 종료됨
    }

    const totalDays = this.일수계산한다(startDate, endDate);
    const elapsedDays = this.일수계산한다(startDate, now);

    return Math.round((elapsedDays / totalDays) * 100);
  }

  /**
   * 평가 기간의 남은 일수를 계산한다
   * @param endDate 종료일
   * @param currentDate 현재 날짜 (선택적, 기본값: 현재 날짜)
   * @returns 남은 일수 (음수면 이미 종료됨)
   */
  static 평가기간남은일수계산한다(endDate: Date, currentDate?: Date): number {
    const now = currentDate || new Date();
    const diffInTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffInTime / (1000 * 60 * 60 * 24));
  }
}
