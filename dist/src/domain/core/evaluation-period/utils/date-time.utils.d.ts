export declare class DateTimeUtils {
    static 일수계산한다(startDate: Date, endDate: Date): number;
    static 날짜범위내인가(targetDate: Date, startDate: Date, endDate: Date): boolean;
    static 현재날짜이후인가(targetDate: Date): boolean;
    static 현재날짜이전인가(targetDate: Date): boolean;
    static 날짜범위겹침확인한다(start1: Date, end1: Date, start2: Date, end2: Date): boolean;
    static 날짜문자열변환한다(date: Date): string;
    static 문자열날짜변환한다(dateString: string): Date;
    static 일수더하기(date: Date, days: number): Date;
    static 일수빼기(date: Date, days: number): Date;
    static 월첫째날(date: Date): Date;
    static 월마지막날(date: Date): Date;
    static 년첫째날(year: number): Date;
    static 년마지막날(year: number): Date;
    static 평가기간진행률계산한다(startDate: Date, endDate: Date, currentDate?: Date): number;
    static 평가기간남은일수계산한다(endDate: Date, currentDate?: Date): number;
}
