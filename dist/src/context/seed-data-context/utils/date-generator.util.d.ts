export declare class DateGeneratorUtil {
    static generateDateRange(startFrom: Date, minDuration: number, maxDuration: number, unit: 'days' | 'months'): {
        startDate: Date;
        endDate: Date;
    };
    static addDays(date: Date, days: number): Date;
    static addMonths(date: Date, months: number): Date;
    static generatePastDate(maxDaysAgo: number): Date;
}
