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
var GetWbsDeliverablesHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetWbsDeliverablesHandler = exports.GetWbsDeliverablesQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const deliverable_service_1 = require("../../../../../domain/core/deliverable/deliverable.service");
class GetWbsDeliverablesQuery {
    wbsItemId;
    activeOnly;
    constructor(wbsItemId, activeOnly = true) {
        this.wbsItemId = wbsItemId;
        this.activeOnly = activeOnly;
    }
}
exports.GetWbsDeliverablesQuery = GetWbsDeliverablesQuery;
let GetWbsDeliverablesHandler = GetWbsDeliverablesHandler_1 = class GetWbsDeliverablesHandler {
    deliverableService;
    logger = new common_1.Logger(GetWbsDeliverablesHandler_1.name);
    constructor(deliverableService) {
        this.deliverableService = deliverableService;
    }
    async execute(query) {
        this.logger.debug(`WBS 항목별 산출물 조회 - WBS: ${query.wbsItemId}`);
        const deliverables = await this.deliverableService.필터_조회한다({
            wbsItemId: query.wbsItemId,
            activeOnly: query.activeOnly,
            orderBy: 'createdAt',
            orderDirection: 'DESC',
        });
        this.logger.debug(`WBS 항목별 산출물 조회 완료 - 개수: ${deliverables.length}`);
        return deliverables;
    }
};
exports.GetWbsDeliverablesHandler = GetWbsDeliverablesHandler;
exports.GetWbsDeliverablesHandler = GetWbsDeliverablesHandler = GetWbsDeliverablesHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetWbsDeliverablesQuery),
    __metadata("design:paramtypes", [deliverable_service_1.DeliverableService])
], GetWbsDeliverablesHandler);
//# sourceMappingURL=get-wbs-deliverables.handler.js.map