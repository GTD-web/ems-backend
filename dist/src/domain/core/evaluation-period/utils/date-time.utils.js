"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateTimeUtils = void 0;
class DateTimeUtils {
    static 일수계산한다(startDate, endDate) {
        const diffInTime = endDate.getTime() - startDate.getTime();
        return Math.ceil(diffInTime / (1000 * 60 * 60 * 24)) + 1;
    }
    static 날짜범위내인가(targetDate, startDate, endDate) {
        return targetDate >= startDate && targetDate <= endDate;
    }
    static 현재날짜이후인가(targetDate) {
        const now = new Date();
        return now > targetDate;
    }
    static 현재날짜이전인가(targetDate) {
        const now = new Date();
        return now < targetDate;
    }
    static 날짜범위겹침확인한다(start1, end1, start2, end2) {
        return start1 <= end2 && end1 >= start2;
    }
    static 날짜문자열변환한다(date) {
        return date.toISOString().split('T')[0];
    }
    static 문자열날짜변환한다(dateString) {
        return new Date(dateString);
    }
    static 일수더하기(date, days) {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + days);
        return newDate;
    }
    static 일수빼기(date, days) {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() - days);
        return newDate;
    }
    static 월첫째날(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }
    static 월마지막날(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }
    static 년첫째날(year) {
        return new Date(year, 0, 1);
    }
    static 년마지막날(year) {
        return new Date(year, 11, 31);
    }
    static 평가기간진행률계산한다(startDate, endDate, currentDate) {
        const now = currentDate || new Date();
        if (now < startDate) {
            return 0;
        }
        if (now > endDate) {
            return 100;
        }
        const totalDays = this.일수계산한다(startDate, endDate);
        const elapsedDays = this.일수계산한다(startDate, now);
        return Math.round((elapsedDays / totalDays) * 100);
    }
    static 평가기간남은일수계산한다(endDate, currentDate) {
        const now = currentDate || new Date();
        const diffInTime = endDate.getTime() - now.getTime();
        return Math.ceil(diffInTime / (1000 * 60 * 60 * 24));
    }
}
exports.DateTimeUtils = DateTimeUtils;
//# sourceMappingURL=date-time.utils.js.map