"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiGetSeedDataStatus = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const get_seed_data_status_dto_1 = require("../../dto/seed-data/get-seed-data-status.dto");
const ApiGetSeedDataStatus = () => (0, common_1.applyDecorators)((0, swagger_1.ApiOperation)({
    summary: '시드 데이터 상태 조회',
    description: '현재 시스템에 존재하는 시드 데이터의 상태를 조회합니다.',
}), (0, swagger_1.ApiResponse)({
    status: 200,
    description: '상태 조회 성공',
    type: get_seed_data_status_dto_1.GetSeedDataStatusDto,
}));
exports.ApiGetSeedDataStatus = ApiGetSeedDataStatus;
//# sourceMappingURL=get-seed-data-status.decorator.js.map