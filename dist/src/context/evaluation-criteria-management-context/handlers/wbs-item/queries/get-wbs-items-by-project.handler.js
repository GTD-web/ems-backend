"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GetWbsItemsByProjectHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetWbsItemsByProjectHandler = exports.GetWbsItemsByProjectQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const wbs_item_service_1 = require("../../../../../domain/common/wbs-item/wbs-item.service");
class GetWbsItemsByProjectQuery {
    projectId;
    constructor(projectId) {
        this.projectId = projectId;
    }
}
exports.GetWbsItemsByProjectQuery = GetWbsItemsByProjectQuery;
let GetWbsItemsByProjectHandler = GetWbsItemsByProjectHandler_1 = class GetWbsItemsByProjectHandler {
    wbsItemService;
    logger = new common_1.Logger(GetWbsItemsByProjectHandler_1.name);
    constructor(wbsItemService) {
        this.wbsItemService = wbsItemService;
    }
    async execute(query) {
        const { projectId } = query;
        this.logger.log('프로젝트별 WBS 목록 조회 시작', {
            projectId,
        });
        try {
            const wbsItems = await this.wbsItemService.프로젝트별_조회한다(projectId);
            this.logger.log('프로젝트별 WBS 목록 조회 완료', {
                projectId,
                count: wbsItems.length,
            });
            return {
                wbsItems,
            };
        }
        catch (error) {
            this.logger.error('프로젝트별 WBS 목록 조회 실패', {
                error: error.message,
                projectId,
            });
            throw error;
        }
    }
};
exports.GetWbsItemsByProjectHandler = GetWbsItemsByProjectHandler;
exports.GetWbsItemsByProjectHandler = GetWbsItemsByProjectHandler = GetWbsItemsByProjectHandler_1 = __decorate([
    (0, cqrs_1.QueryHandler)(GetWbsItemsByProjectQuery),
    __metadata("design:paramtypes", [wbs_item_service_1.WbsItemService])
], GetWbsItemsByProjectHandler);
//# sourceMappingURL=get-wbs-items-by-project.handler.js.map