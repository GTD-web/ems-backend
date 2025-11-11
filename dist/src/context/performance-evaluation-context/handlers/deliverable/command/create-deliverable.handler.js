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
var CreateDeliverableHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDeliverableHandler = exports.CreateDeliverableCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const deliverable_service_1 = require("../../../../../domain/core/deliverable/deliverable.service");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const wbs_item_entity_1 = require("../../../../../domain/common/wbs-item/wbs-item.entity");
const deliverable_exceptions_1 = require("../../../../../domain/core/deliverable/deliverable.exceptions");
class CreateDeliverableCommand {
    name;
    type;
    employeeId;
    wbsItemId;
    description;
    filePath;
    createdBy;
    constructor(name, type, employeeId, wbsItemId, description, filePath, createdBy) {
        this.name = name;
        this.type = type;
        this.employeeId = employeeId;
        this.wbsItemId = wbsItemId;
        this.description = description;
        this.filePath = filePath;
        this.createdBy = createdBy;
    }
}
exports.CreateDeliverableCommand = CreateDeliverableCommand;
let CreateDeliverableHandler = CreateDeliverableHandler_1 = class CreateDeliverableHandler {
    deliverableService;
    employeeRepository;
    wbsItemRepository;
    logger = new common_1.Logger(CreateDeliverableHandler_1.name);
    constructor(deliverableService, employeeRepository, wbsItemRepository) {
        this.deliverableService = deliverableService;
        this.employeeRepository = employeeRepository;
        this.wbsItemRepository = wbsItemRepository;
    }
    async execute(command) {
        this.logger.log(`산출물 생성 시작 - 이름: ${command.name}, 직원: ${command.employeeId}`);
        const employee = await this.employeeRepository.findOne({
            where: { id: command.employeeId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!employee) {
            throw new deliverable_exceptions_1.DeliverableValidationException(`직원 ID ${command.employeeId}에 해당하는 직원을 찾을 수 없습니다.`);
        }
        const wbsItem = await this.wbsItemRepository.findOne({
            where: { id: command.wbsItemId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!wbsItem) {
            throw new deliverable_exceptions_1.DeliverableValidationException(`WBS 항목 ID ${command.wbsItemId}에 해당하는 WBS 항목을 찾을 수 없습니다.`);
        }
        const deliverable = await this.deliverableService.생성한다({
            name: command.name,
            type: command.type,
            description: command.description,
            filePath: command.filePath,
            employeeId: command.employeeId,
            wbsItemId: command.wbsItemId,
            createdBy: command.createdBy || command.employeeId,
        });
        this.logger.log(`산출물 생성 완료 - ID: ${deliverable.id}`);
        return deliverable;
    }
};
exports.CreateDeliverableHandler = CreateDeliverableHandler;
exports.CreateDeliverableHandler = CreateDeliverableHandler = CreateDeliverableHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(CreateDeliverableCommand),
    __param(1, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(2, (0, typeorm_1.InjectRepository)(wbs_item_entity_1.WbsItem)),
    __metadata("design:paramtypes", [deliverable_service_1.DeliverableService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CreateDeliverableHandler);
//# sourceMappingURL=create-deliverable.handler.js.map