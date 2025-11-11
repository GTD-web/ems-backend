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
var BulkCreateDeliverablesHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkCreateDeliverablesHandler = exports.BulkCreateDeliverablesCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const deliverable_service_1 = require("../../../../../domain/core/deliverable/deliverable.service");
const deliverable_types_1 = require("../../../../../domain/core/deliverable/deliverable.types");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const wbs_item_entity_1 = require("../../../../../domain/common/wbs-item/wbs-item.entity");
const deliverable_exceptions_1 = require("../../../../../domain/core/deliverable/deliverable.exceptions");
class BulkCreateDeliverablesCommand {
    deliverables;
    createdBy;
    constructor(deliverables, createdBy) {
        this.deliverables = deliverables;
        this.createdBy = createdBy;
    }
}
exports.BulkCreateDeliverablesCommand = BulkCreateDeliverablesCommand;
let BulkCreateDeliverablesHandler = BulkCreateDeliverablesHandler_1 = class BulkCreateDeliverablesHandler {
    deliverableService;
    employeeRepository;
    wbsItemRepository;
    logger = new common_1.Logger(BulkCreateDeliverablesHandler_1.name);
    constructor(deliverableService, employeeRepository, wbsItemRepository) {
        this.deliverableService = deliverableService;
        this.employeeRepository = employeeRepository;
        this.wbsItemRepository = wbsItemRepository;
    }
    async execute(command) {
        this.logger.log(`산출물 벌크 생성 시작 - 개수: ${command.deliverables.length}`);
        const result = {
            successCount: 0,
            failedCount: 0,
            createdIds: [],
            failedItems: [],
        };
        for (const data of command.deliverables) {
            try {
                if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
                    throw new deliverable_exceptions_1.DeliverableValidationException('산출물명은 필수입니다.');
                }
                if (!data.type || typeof data.type !== 'string') {
                    throw new deliverable_exceptions_1.DeliverableValidationException('산출물 유형은 필수입니다.');
                }
                if (!Object.values(deliverable_types_1.DeliverableType).includes(data.type)) {
                    throw new deliverable_exceptions_1.DeliverableValidationException(`산출물 유형이 올바르지 않습니다: ${data.type}. 허용되는 값: ${Object.values(deliverable_types_1.DeliverableType).join(', ')}`);
                }
                if (!data.employeeId || typeof data.employeeId !== 'string') {
                    throw new deliverable_exceptions_1.DeliverableValidationException('직원 ID는 필수입니다.');
                }
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (!uuidRegex.test(data.employeeId)) {
                    throw new deliverable_exceptions_1.DeliverableValidationException(`직원 ID는 올바른 UUID 형식이어야 합니다: ${data.employeeId}`);
                }
                if (!data.wbsItemId || typeof data.wbsItemId !== 'string') {
                    throw new deliverable_exceptions_1.DeliverableValidationException('WBS 항목 ID는 필수입니다.');
                }
                if (!uuidRegex.test(data.wbsItemId)) {
                    throw new deliverable_exceptions_1.DeliverableValidationException(`WBS 항목 ID는 올바른 UUID 형식이어야 합니다: ${data.wbsItemId}`);
                }
                const employee = await this.employeeRepository.findOne({
                    where: { id: data.employeeId, deletedAt: (0, typeorm_2.IsNull)() },
                });
                if (!employee) {
                    throw new deliverable_exceptions_1.DeliverableValidationException(`직원 ID ${data.employeeId}에 해당하는 직원을 찾을 수 없습니다.`);
                }
                const wbsItem = await this.wbsItemRepository.findOne({
                    where: { id: data.wbsItemId, deletedAt: (0, typeorm_2.IsNull)() },
                });
                if (!wbsItem) {
                    throw new deliverable_exceptions_1.DeliverableValidationException(`WBS 항목 ID ${data.wbsItemId}에 해당하는 WBS 항목을 찾을 수 없습니다.`);
                }
                const deliverable = await this.deliverableService.생성한다({
                    name: data.name,
                    type: data.type,
                    description: data.description,
                    filePath: data.filePath,
                    employeeId: data.employeeId,
                    wbsItemId: data.wbsItemId,
                    createdBy: command.createdBy,
                });
                result.createdIds.push(deliverable.id);
                result.successCount++;
            }
            catch (error) {
                this.logger.error(`산출물 생성 실패 - 이름: ${data.name}`, error.stack);
                result.failedCount++;
                result.failedItems.push({
                    data: {
                        name: data.name,
                        type: data.type,
                        employeeId: data.employeeId,
                        wbsItemId: data.wbsItemId,
                        description: data.description,
                        filePath: data.filePath,
                    },
                    error: error.message || 'Unknown error',
                });
            }
        }
        this.logger.log(`산출물 벌크 생성 완료 - 성공: ${result.successCount}, 실패: ${result.failedCount}`);
        return result;
    }
};
exports.BulkCreateDeliverablesHandler = BulkCreateDeliverablesHandler;
exports.BulkCreateDeliverablesHandler = BulkCreateDeliverablesHandler = BulkCreateDeliverablesHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(BulkCreateDeliverablesCommand),
    __param(1, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(2, (0, typeorm_1.InjectRepository)(wbs_item_entity_1.WbsItem)),
    __metadata("design:paramtypes", [deliverable_service_1.DeliverableService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], BulkCreateDeliverablesHandler);
//# sourceMappingURL=bulk-create-deliverables.handler.js.map