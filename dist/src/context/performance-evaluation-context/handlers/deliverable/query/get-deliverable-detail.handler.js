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
var GetDeliverableDetailHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDeliverableDetailHandler = exports.GetDeliverableDetailQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const deliverable_service_1 = require("../../../../../domain/core/deliverable/deliverable.service");
const deliverable_exceptions_1 = require("../../../../../domain/core/deliverable/deliverable.exceptions");
class GetDeliverableDetailQuery {
    deliverableId;
    constructor(deliverableId) {
        this.deliverableId = deliverableId;
    }
}
exports.GetDeliverableDetailQuery = GetDeliverableDetailQuery;
let GetDeliverableDetailHandler = GetDeliverableDetailHandler_1 = class GetDeliverableDetailHandler {
    deliverableService;
    logger = new common_1.Logger(GetDeliverableDetailHandler_1.name);
    constructor(deliverableService) {
        this.deliverableService = deliverableService;
    }
    async execute(query) {
        this.logger.debug(`산출물 상세 조회 - ID: ${query.deliverableId}`);
        const deliverable = await this.deliverableService.조회한다(query.deliverableId);
        if (!deliverable) {
            throw new deliverable_exceptions_1.DeliverableNotFoundException(query.deliverableId);
        }
        this.logger.debug(`산출물 상세 조회 완료 - ID: ${query.deliverableId}`);
        return deliverable;
    }
};
exports.GetDeliverableDetailHandler = GetDeliverableDetailHandler;
exports.GetDeliverableDetailHandler = GetDeliverableDetailHandler = GetDeliverableDetailHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetDeliverableDetailQuery),
    __metadata("design:paramtypes", [deliverable_service_1.DeliverableService])
], GetDeliverableDetailHandler);
//# sourceMappingURL=get-deliverable-detail.handler.js.map