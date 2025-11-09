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
var DeleteDeliverableHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteDeliverableHandler = exports.DeleteDeliverableCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const deliverable_service_1 = require("../../../../../domain/core/deliverable/deliverable.service");
class DeleteDeliverableCommand {
    id;
    deletedBy;
    constructor(id, deletedBy) {
        this.id = id;
        this.deletedBy = deletedBy;
    }
}
exports.DeleteDeliverableCommand = DeleteDeliverableCommand;
let DeleteDeliverableHandler = DeleteDeliverableHandler_1 = class DeleteDeliverableHandler {
    deliverableService;
    logger = new common_1.Logger(DeleteDeliverableHandler_1.name);
    constructor(deliverableService) {
        this.deliverableService = deliverableService;
    }
    async execute(command) {
        this.logger.log(`산출물 삭제 시작 - ID: ${command.id}`);
        await this.deliverableService.삭제한다(command.id, command.deletedBy);
        this.logger.log(`산출물 삭제 완료 - ID: ${command.id}`);
    }
};
exports.DeleteDeliverableHandler = DeleteDeliverableHandler;
exports.DeleteDeliverableHandler = DeleteDeliverableHandler = DeleteDeliverableHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(DeleteDeliverableCommand),
    __metadata("design:paramtypes", [deliverable_service_1.DeliverableService])
], DeleteDeliverableHandler);
//# sourceMappingURL=delete-deliverable.handler.js.map