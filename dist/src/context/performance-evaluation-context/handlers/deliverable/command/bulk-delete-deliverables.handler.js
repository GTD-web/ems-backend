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
var BulkDeleteDeliverablesHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkDeleteDeliverablesHandler = exports.BulkDeleteDeliverablesCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const deliverable_service_1 = require("../../../../../domain/core/deliverable/deliverable.service");
class BulkDeleteDeliverablesCommand {
    deliverableIds;
    deletedBy;
    constructor(deliverableIds, deletedBy) {
        this.deliverableIds = deliverableIds;
        this.deletedBy = deletedBy;
    }
}
exports.BulkDeleteDeliverablesCommand = BulkDeleteDeliverablesCommand;
let BulkDeleteDeliverablesHandler = BulkDeleteDeliverablesHandler_1 = class BulkDeleteDeliverablesHandler {
    deliverableService;
    logger = new common_1.Logger(BulkDeleteDeliverablesHandler_1.name);
    constructor(deliverableService) {
        this.deliverableService = deliverableService;
    }
    async execute(command) {
        this.logger.log(`산출물 벌크 삭제 시작 - 개수: ${command.deliverableIds.length}`);
        const result = {
            successCount: 0,
            failedCount: 0,
            failedIds: [],
        };
        for (const id of command.deliverableIds) {
            try {
                if (!id || typeof id !== 'string') {
                    throw new Error(`잘못된 ID 형식입니다: ${id}`);
                }
                await this.deliverableService.삭제한다(id, command.deletedBy);
                result.successCount++;
            }
            catch (error) {
                this.logger.error(`산출물 삭제 실패 - ID: ${id}`, error.stack);
                result.failedCount++;
                result.failedIds.push({
                    id: String(id),
                    error: error.message || 'Deletion failed',
                });
            }
        }
        this.logger.log(`산출물 벌크 삭제 완료 - 성공: ${result.successCount}, 실패: ${result.failedCount}`);
        return result;
    }
};
exports.BulkDeleteDeliverablesHandler = BulkDeleteDeliverablesHandler;
exports.BulkDeleteDeliverablesHandler = BulkDeleteDeliverablesHandler = BulkDeleteDeliverablesHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(BulkDeleteDeliverablesCommand),
    __metadata("design:paramtypes", [deliverable_service_1.DeliverableService])
], BulkDeleteDeliverablesHandler);
//# sourceMappingURL=bulk-delete-deliverables.handler.js.map