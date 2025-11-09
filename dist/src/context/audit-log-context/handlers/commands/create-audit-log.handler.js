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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAuditLogHandler = exports.CreateAuditLogCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const audit_log_service_1 = require("../../../../domain/common/audit-log/audit-log.service");
class CreateAuditLogCommand {
    data;
    constructor(data) {
        this.data = data;
    }
}
exports.CreateAuditLogCommand = CreateAuditLogCommand;
let CreateAuditLogHandler = class CreateAuditLogHandler {
    auditLogService;
    constructor(auditLogService) {
        this.auditLogService = auditLogService;
    }
    async execute(command) {
        const auditLog = await this.auditLogService.생성한다(command.data);
        return {
            id: auditLog.id,
            createdAt: auditLog.createdAt,
        };
    }
};
exports.CreateAuditLogHandler = CreateAuditLogHandler;
exports.CreateAuditLogHandler = CreateAuditLogHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(CreateAuditLogCommand),
    __metadata("design:paramtypes", [audit_log_service_1.AuditLogService])
], CreateAuditLogHandler);
//# sourceMappingURL=create-audit-log.handler.js.map