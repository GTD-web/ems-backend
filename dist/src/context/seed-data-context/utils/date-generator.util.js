"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateGeneratorUtil = void 0;
class DateGeneratorUtil {
    static generateDateRange(startFrom, minDuration, maxDuration, unit) {
        const duration = Math.floor(Math.random() * (maxDuration - minDuration + 1)) + minDuration;
        const startDate = new Date(startFrom);
        const endDate = new Date(startDate);
        if (unit === 'days') {
            endDate.setDate(endDate.getDate() + duration);
        }
        else {
            endDate.setMonth(endDate.getMonth() + duration);
        }
        return { startDate, endDate };
    }
    static addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    static addMonths(date, months) {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    }
    static generatePastDate(maxDaysAgo) {
        const daysAgo = Math.floor(Math.random() * maxDaysAgo);
        return this.addDays(new Date(), -daysAgo);
    }
}
exports.DateGeneratorUtil = DateGeneratorUtil;
//# sourceMappingURL=date-generator.util.js.map