/**
 * 날짜 생성 헬퍼
 */
export class DateGeneratorUtil {
  /**
   * 랜덤 날짜 범위 생성
   */
  static generateDateRange(
    startFrom: Date,
    minDuration: number,
    maxDuration: number,
    unit: 'days' | 'months',
  ): { startDate: Date; endDate: Date } {
    const duration =
      Math.floor(Math.random() * (maxDuration - minDuration + 1)) + minDuration;

    const startDate = new Date(startFrom);
    const endDate = new Date(startDate);

    if (unit === 'days') {
      endDate.setDate(endDate.getDate() + duration);
    } else {
      endDate.setMonth(endDate.getMonth() + duration);
    }

    return { startDate, endDate };
  }

  /**
   * 특정 날짜에서 일수 더하기
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * 특정 날짜에서 개월 더하기
   */
  static addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  /**
   * 과거 랜덤 날짜 생성 (현재 기준)
   */
  static generatePastDate(maxDaysAgo: number): Date {
    const daysAgo = Math.floor(Math.random() * maxDaysAgo);
    return this.addDays(new Date(), -daysAgo);
  }
}
