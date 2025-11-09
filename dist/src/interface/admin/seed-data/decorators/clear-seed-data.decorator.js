"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClearSeedData = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ApiClearSeedData = () => (0, common_1.applyDecorators)((0, swagger_1.ApiOperation)({
    summary: '시드 데이터 삭제',
    description: '생성된 시드 데이터를 삭제합니다.',
}), (0, swagger_1.ApiResponse)({
    status: 200,
    description: '시드 데이터 삭제 성공',
}), (0, swagger_1.ApiResponse)({
    status: 500,
    description: '서버 오류 (삭제 중 오류 발생)',
}));
exports.ApiClearSeedData = ApiClearSeedData;
//# sourceMappingURL=clear-seed-data.decorator.js.map