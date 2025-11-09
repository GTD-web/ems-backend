"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToBoolean = ToBoolean;
exports.ToBooleanStrict = ToBooleanStrict;
exports.OptionalToBoolean = OptionalToBoolean;
exports.OptionalToBooleanStrict = OptionalToBooleanStrict;
const class_transformer_1 = require("class-transformer");
const common_1 = require("@nestjs/common");
function convertToBoolean(value, defaultValue, strict = false) {
    if (value === undefined || value === null) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        return false;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'number') {
        if (value === 1)
            return true;
        if (value === 0)
            return false;
        if (strict) {
            throw new common_1.BadRequestException(`boolean으로 변환할 수 없는 숫자입니다: ${value}. 0 또는 1만 허용됩니다.`);
        }
        return !!value;
    }
    if (typeof value === 'string') {
        const lowerValue = value.toLowerCase().trim();
        if (['true', '1', 'yes', 'on'].includes(lowerValue)) {
            return true;
        }
        if (['false', '0', 'no', 'off', ''].includes(lowerValue)) {
            return false;
        }
        if (strict) {
            throw new common_1.BadRequestException(`boolean으로 변환할 수 없는 문자열입니다: "${value}". 허용되는 값: true, false, 1, 0, yes, no, on, off`);
        }
        return false;
    }
    if (strict) {
        throw new common_1.BadRequestException(`boolean으로 변환할 수 없는 타입입니다: ${typeof value}`);
    }
    return !!value;
}
function ToBoolean(defaultValue) {
    return (0, class_transformer_1.Transform)(({ value }) => {
        return convertToBoolean(value, defaultValue, false);
    });
}
function ToBooleanStrict(defaultValue, fieldName) {
    return (0, class_transformer_1.Transform)(({ value, key }) => {
        if (value === undefined || value === null) {
            return defaultValue ?? false;
        }
        if (typeof value === 'boolean') {
            return value;
        }
        if (typeof value === 'number') {
            if (value === 1)
                return true;
            if (value === 0)
                return false;
            throw new common_1.BadRequestException(`${fieldName || key}는 0 또는 1만 허용됩니다 (입력값: ${value})`);
        }
        if (typeof value === 'string') {
            const lowerValue = value.toLowerCase().trim();
            if (lowerValue === 'true' || lowerValue === '1') {
                return true;
            }
            if (lowerValue === 'false' || lowerValue === '0') {
                return false;
            }
            throw new common_1.BadRequestException(`${fieldName || key}는 true, false, 1, 0만 허용됩니다 (입력값: "${value}")`);
        }
        throw new common_1.BadRequestException(`${fieldName || key}는 boolean 값만 허용됩니다 (입력 타입: ${typeof value})`);
    });
}
function OptionalToBoolean() {
    return (0, class_transformer_1.Transform)(({ value }) => {
        if (value === undefined || value === null) {
            return undefined;
        }
        return convertToBoolean(value, undefined, false);
    });
}
function OptionalToBooleanStrict() {
    return (0, class_transformer_1.Transform)(({ value }) => {
        if (value === undefined || value === null) {
            return undefined;
        }
        return convertToBoolean(value, undefined, true);
    });
}
//# sourceMappingURL=boolean-transform.decorator.js.map