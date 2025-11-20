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
exports.GetAuditLogListHandler = exports.audit로그목록을조회한다 = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_log_entity_1 = require("../../../../domain/common/audit-log/audit-log.entity");
class audit로그목록을조회한다 {
    filter;
    page;
    limit;
    constructor(filter, page = 1, limit = 10) {
        this.filter = filter;
        this.page = page;
        this.limit = limit;
    }
}
exports.audit로그목록을조회한다 = audit로그목록을조회한다;
let GetAuditLogListHandler = class GetAuditLogListHandler {
    auditLogRepository;
    constructor(auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }
    async execute(query) {
        const queryBuilder = this.auditLogRepository.createQueryBuilder('auditLog');
        if (query.filter.userId) {
            queryBuilder.andWhere('auditLog.userId = :userId', {
                userId: query.filter.userId,
            });
        }
        if (query.filter.userEmail) {
            queryBuilder.andWhere('auditLog.userEmail = :userEmail', {
                userEmail: query.filter.userEmail,
            });
        }
        if (query.filter.employeeNumber) {
            queryBuilder.andWhere('auditLog.employeeNumber = :employeeNumber', {
                employeeNumber: query.filter.employeeNumber,
            });
        }
        if (query.filter.requestMethod && query.filter.requestMethod.length > 0) {
            queryBuilder.andWhere('auditLog.requestMethod IN (:...requestMethods)', {
                requestMethods: query.filter.requestMethod,
            });
        }
        if (query.filter.requestUrl && query.filter.requestUrl.length > 0) {
            const urlConditions = query.filter.requestUrl
                .map((url, index) => `auditLog.requestUrl LIKE :requestUrl${index}`)
                .join(' OR ');
            queryBuilder.andWhere(`(${urlConditions})`, {
                ...query.filter.requestUrl.reduce((acc, url, index) => {
                    acc[`requestUrl${index}`] = `%${url}%`;
                    return acc;
                }, {}),
            });
        }
        if (query.filter.responseStatusCode &&
            query.filter.responseStatusCode.length > 0) {
            queryBuilder.andWhere('auditLog.responseStatusCode IN (:...responseStatusCodes)', {
                responseStatusCodes: query.filter.responseStatusCode,
            });
        }
        if (query.filter.startDate) {
            queryBuilder.andWhere('auditLog.requestStartTime >= :startDate', {
                startDate: query.filter.startDate,
            });
        }
        if (query.filter.endDate) {
            queryBuilder.andWhere('auditLog.requestStartTime <= :endDate', {
                endDate: query.filter.endDate,
            });
        }
        queryBuilder.orderBy('auditLog.requestStartTime', 'DESC');
        const skip = (query.page - 1) * query.limit;
        queryBuilder.skip(skip).take(query.limit);
        const [items, total] = await queryBuilder.getManyAndCount();
        return {
            items: items.map((item) => item.DTO로_변환한다()),
            total,
            page: query.page,
            limit: query.limit,
        };
    }
};
exports.GetAuditLogListHandler = GetAuditLogListHandler;
exports.GetAuditLogListHandler = GetAuditLogListHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(audit로그목록을조회한다),
    __param(0, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GetAuditLogListHandler);
//# sourceMappingURL=get-audit-log-list.handler.js.map