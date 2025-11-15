"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateToUTC = DateToUTC;
exports.OptionalDateToUTC = OptionalDateToUTC;
const class_transformer_1 = require("class-transformer");
const common_1 = require("@nestjs/common");
function convertToUTCDate(value) {
    if (!value)
        return undefined;
    if (value instanceof Date) {
        return value;
    }
    if (typeof value !== 'string') {
        throw new common_1.BadRequestException(`날짜는 문자열 형식이어야 합니다. 받은 값: ${typeof value}`);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-').map(Number);
        if (month < 1 || month > 12) {
            throw new common_1.BadRequestException(`올바르지 않은 월입니다: ${month}. 1-12 범위여야 합니다.`);
        }
        if (day < 1 || day > 31) {
            throw new common_1.BadRequestException(`올바르지 않은 일입니다: ${day}. 1-31 범위여야 합니다.`);
        }
        const daysInMonth = new Date(year, month, 0).getDate();
        if (day > daysInMonth) {
            throw new common_1.BadRequestException(`${year}년 ${month}월에는 ${day}일이 존재하지 않습니다. 최대 ${daysInMonth}일까지 가능합니다.`);
        }
        return new Date(`${value}T00:00:00.000Z`);
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) {
        return new Date(`${value}.000Z`);
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/.test(value)) {
        return new Date(`${value}Z`);
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}$/.test(value)) {
        const truncated = value.substring(0, 23);
        return new Date(`${truncated}Z`);
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/.test(value)) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            throw new common_1.BadRequestException(`올바르지 않은 날짜 형식입니다: ${value}`);
        }
        return date;
    }
    throw new common_1.BadRequestException(`지원하지 않는 날짜 형식입니다: ${value}. YYYY-MM-DD 또는 ISO 8601 형식을 사용해주세요.`);
}
function DateToUTC() {
    return (0, class_transformer_1.Transform)(({ value }) => {
        return convertToUTCDate(value);
    });
}
function OptionalDateToUTC() {
    return (0, class_transformer_1.Transform)(({ value }) => {
        if (value === null || value === undefined || value === '') {
            return undefined;
        }
        return convertToUTCDate(value);
    });
}
//# sourceMappingURL=date-transform.decorator.js.map