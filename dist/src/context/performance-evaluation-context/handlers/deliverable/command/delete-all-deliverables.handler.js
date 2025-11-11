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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DeleteAllDeliverablesHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteAllDeliverablesHandler = exports.DeleteAllDeliverablesCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const deliverable_entity_1 = require("../../../../../domain/core/deliverable/deliverable.entity");
const deliverable_service_1 = require("../../../../../domain/core/deliverable/deliverable.service");
class DeleteAllDeliverablesCommand {
    deletedBy;
    constructor(deletedBy) {
        this.deletedBy = deletedBy;
    }
}
exports.DeleteAllDeliverablesCommand = DeleteAllDeliverablesCommand;
let DeleteAllDeliverablesHandler = DeleteAllDeliverablesHandler_1 = class DeleteAllDeliverablesHandler {
    deliverableService;
    deliverableRepository;
    logger = new common_1.Logger(DeleteAllDeliverablesHandler_1.name);
    constructor(deliverableService, deliverableRepository) {
        this.deliverableService = deliverableService;
        this.deliverableRepository = deliverableRepository;
    }
    async execute(command) {
        this.logger.log('모든 산출물 삭제 시작');
        const result = {
            successCount: 0,
            failedCount: 0,
            failedIds: [],
        };
        try {
            const allDeliverables = await this.deliverableRepository.find({
                where: {
                    deletedAt: (0, typeorm_2.IsNull)(),
                },
            });
            this.logger.log(`조회된 산출물 개수: ${allDeliverables.length}`);
            if (allDeliverables.length === 0) {
                this.logger.log('삭제할 산출물이 없습니다.');
                return result;
            }
            for (const deliverable of allDeliverables) {
                try {
                    await this.deliverableService.삭제한다(deliverable.id, command.deletedBy);
                    result.successCount++;
                }
                catch (error) {
                    this.logger.error(`산출물 삭제 실패 - ID: ${deliverable.id}`, error.stack);
                    result.failedCount++;
                    result.failedIds.push({
                        id: deliverable.id,
                        error: error.message || 'Deletion failed',
                    });
                }
            }
            this.logger.log(`모든 산출물 삭제 완료 - 성공: ${result.successCount}, 실패: ${result.failedCount}`);
        }
        catch (error) {
            this.logger.error('모든 산출물 삭제 중 오류 발생', error.stack);
            throw error;
        }
        return result;
    }
};
exports.DeleteAllDeliverablesHandler = DeleteAllDeliverablesHandler;
exports.DeleteAllDeliverablesHandler = DeleteAllDeliverablesHandler = DeleteAllDeliverablesHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(DeleteAllDeliverablesCommand),
    __param(1, (0, typeorm_1.InjectRepository)(deliverable_entity_1.Deliverable)),
    __metadata("design:paramtypes", [deliverable_service_1.DeliverableService,
        typeorm_2.Repository])
], DeleteAllDeliverablesHandler);
//# sourceMappingURL=delete-all-deliverables.handler.js.map