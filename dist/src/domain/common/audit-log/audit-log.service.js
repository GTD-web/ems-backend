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
exports.AuditLogService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_log_entity_1 = require("./audit-log.entity");
let AuditLogService = class AuditLogService {
    auditLogRepository;
    constructor(auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }
    async 생성한다(data) {
        const auditLog = this.auditLogRepository.create({
            requestMethod: data.requestMethod,
            requestUrl: data.requestUrl,
            requestPath: data.requestPath,
            requestHeaders: data.requestHeaders,
            requestBody: data.requestBody,
            requestQuery: data.requestQuery,
            requestIp: data.requestIp,
            responseStatusCode: data.responseStatusCode,
            responseBody: data.responseBody,
            userId: data.userId,
            userEmail: data.userEmail,
            userName: data.userName,
            employeeNumber: data.employeeNumber,
            requestStartTime: data.requestStartTime,
            requestEndTime: data.requestEndTime,
            duration: data.duration,
            requestId: data.requestId,
        });
        const saved = await this.auditLogRepository.save(auditLog);
        return saved.DTO로_변환한다();
    }
};
exports.AuditLogService = AuditLogService;
exports.AuditLogService = AuditLogService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuditLogService);
//# sourceMappingURL=audit-log.service.js.map