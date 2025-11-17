"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseId = exports.ParseUUID = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
exports.ParseUUID = (0, common_1.createParamDecorator)((paramName, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const value = request.params[paramName];
    if (!value || typeof value !== 'string' || value.trim() === '') {
        throw new common_1.BadRequestException(`${paramName} 파라미터가 필요합니다.`);
    }
    if (!(0, uuid_1.validate)(value.trim())) {
        throw new common_1.BadRequestException(`${paramName} 파라미터는 올바른 UUID 형식이어야 합니다. 입력값: ${value}`);
    }
    return value.trim();
});
exports.ParseId = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const value = request.params.id;
    if (!value || typeof value !== 'string' || value.trim() === '') {
        throw new common_1.BadRequestException('ID 파라미터가 필요합니다.');
    }
    if (!(0, uuid_1.validate)(value.trim())) {
        throw new common_1.BadRequestException(`ID는 올바른 UUID 형식이어야 합니다. 입력값: ${value}`);
    }
    return value.trim();
});
//# sourceMappingURL=parse-uuid.decorator.js.map