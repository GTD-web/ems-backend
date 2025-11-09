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
var UpdateDeliverableHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDeliverableHandler = exports.UpdateDeliverableCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const deliverable_service_1 = require("../../../../../domain/core/deliverable/deliverable.service");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const wbs_item_entity_1 = require("../../../../../domain/common/wbs-item/wbs-item.entity");
const deliverable_exceptions_1 = require("../../../../../domain/core/deliverable/deliverable.exceptions");
class UpdateDeliverableCommand {
    id;
    updatedBy;
    name;
    type;
    description;
    filePath;
    employeeId;
    wbsItemId;
    isActive;
    constructor(id, updatedBy, name, type, description, filePath, employeeId, wbsItemId, isActive) {
        this.id = id;
        this.updatedBy = updatedBy;
        this.name = name;
        this.type = type;
        this.description = description;
        this.filePath = filePath;
        this.employeeId = employeeId;
        this.wbsItemId = wbsItemId;
        this.isActive = isActive;
    }
}
exports.UpdateDeliverableCommand = UpdateDeliverableCommand;
let UpdateDeliverableHandler = UpdateDeliverableHandler_1 = class UpdateDeliverableHandler {
    deliverableService;
    employeeRepository;
    wbsItemRepository;
    logger = new common_1.Logger(UpdateDeliverableHandler_1.name);
    constructor(deliverableService, employeeRepository, wbsItemRepository) {
        this.deliverableService = deliverableService;
        this.employeeRepository = employeeRepository;
        this.wbsItemRepository = wbsItemRepository;
    }
    async execute(command) {
        this.logger.log(`산출물 수정 시작 - ID: ${command.id}`);
        const deliverable = await this.deliverableService.조회한다(command.id);
        if (!deliverable) {
            throw new deliverable_exceptions_1.DeliverableNotFoundException(command.id);
        }
        if (command.employeeId !== undefined) {
            const employee = await this.employeeRepository.findOne({
                where: { id: command.employeeId, deletedAt: (0, typeorm_2.IsNull)() },
            });
            if (!employee) {
                throw new deliverable_exceptions_1.DeliverableValidationException(`직원 ID ${command.employeeId}에 해당하는 직원을 찾을 수 없습니다.`);
            }
        }
        if (command.wbsItemId !== undefined) {
            const wbsItem = await this.wbsItemRepository.findOne({
                where: { id: command.wbsItemId, deletedAt: (0, typeorm_2.IsNull)() },
            });
            if (!wbsItem) {
                throw new deliverable_exceptions_1.DeliverableValidationException(`WBS 항목 ID ${command.wbsItemId}에 해당하는 WBS 항목을 찾을 수 없습니다.`);
            }
        }
        const updatedDeliverable = await this.deliverableService.수정한다(command.id, {
            name: command.name,
            type: command.type,
            description: command.description,
            filePath: command.filePath,
            employeeId: command.employeeId,
            wbsItemId: command.wbsItemId,
            isActive: command.isActive,
        }, command.updatedBy);
        this.logger.log(`산출물 수정 완료 - ID: ${command.id}`);
        return updatedDeliverable;
    }
};
exports.UpdateDeliverableHandler = UpdateDeliverableHandler;
exports.UpdateDeliverableHandler = UpdateDeliverableHandler = UpdateDeliverableHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(UpdateDeliverableCommand),
    __param(1, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(2, (0, typeorm_1.InjectRepository)(wbs_item_entity_1.WbsItem)),
    __metadata("design:paramtypes", [deliverable_service_1.DeliverableService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], UpdateDeliverableHandler);
//# sourceMappingURL=update-deliverable.handler.js.map