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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAuditLogDetailHandler = exports.GetAuditLogDetailQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_log_entity_1 = require("../../../../domain/common/audit-log/audit-log.entity");
class GetAuditLogDetailQuery {
    id;
    constructor(id) {
        this.id = id;
    }
}
exports.GetAuditLogDetailQuery = GetAuditLogDetailQuery;
let GetAuditLogDetailHandler = class GetAuditLogDetailHandler {
    auditLogRepository;
    constructor(auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }
    async execute(query) {
        const auditLog = await this.auditLogRepository.findOne({
            where: { id: query.id },
        });
        return auditLog ? auditLog.DTO로_변환한다() : null;
    }
};
exports.GetAuditLogDetailHandler = GetAuditLogDetailHandler;
exports.GetAuditLogDetailHandler = GetAuditLogDetailHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetAuditLogDetailQuery),
    __param(0, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GetAuditLogDetailHandler);
//# sourceMappingURL=get-audit-log-detail.handler.js.map