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
exports.Department = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
let Department = class Department extends base_entity_1.BaseEntity {
    name;
    code;
    order;
    managerId;
    parentDepartmentId;
    externalId;
    externalCreatedAt;
    externalUpdatedAt;
    lastSyncAt;
    constructor(name, code, externalId, order, managerId, parentDepartmentId, externalCreatedAt, externalUpdatedAt) {
        super();
        if (name)
            this.name = name;
        if (code)
            this.code = code;
        if (externalId)
            this.externalId = externalId;
        if (order !== undefined)
            this.order = order;
        if (managerId)
            this.managerId = managerId;
        if (parentDepartmentId)
            this.parentDepartmentId = parentDepartmentId;
        if (externalCreatedAt)
            this.externalCreatedAt = externalCreatedAt;
        if (externalUpdatedAt)
            this.externalUpdatedAt = externalUpdatedAt;
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            version: this.version,
            name: this.name,
            code: this.code,
            order: this.order,
            managerId: this.managerId,
            parentDepartmentId: this.parentDepartmentId,
            externalId: this.externalId,
            externalCreatedAt: this.externalCreatedAt,
            externalUpdatedAt: this.externalUpdatedAt,
            lastSyncAt: this.lastSyncAt,
            get isDeleted() {
                return this.deletedAt !== null && this.deletedAt !== undefined;
            },
            get isNew() {
                return !this.id || this.version === 1;
            },
            get isRootDepartment() {
                return !this.parentDepartmentId;
            },
            get hasChildren() {
                return false;
            },
            get needsSync() {
                if (!this.lastSyncAt)
                    return true;
                const now = new Date();
                const diffHours = Math.abs(now.getTime() - this.lastSyncAt.getTime()) /
                    (1000 * 60 * 60);
                return diffHours >= 24;
            },
        };
    }
};
exports.Department = Department;
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        comment: '부서명',
    }),
    __metadata("design:type", String)
], Department.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 100,
        comment: '부서 코드',
    }),
    __metadata("design:type", String)
], Department.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'int',
        comment: '정렬 순서',
        default: 0,
    }),
    __metadata("design:type", Number)
], Department.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: '매니저 ID',
    }),
    __metadata("design:type", String)
], Department.prototype, "managerId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: '상위 부서 ID (외부 시스템)',
    }),
    __metadata("design:type", String)
], Department.prototype, "parentDepartmentId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        unique: true,
        comment: '외부 시스템 ID',
    }),
    __metadata("design:type", String)
], Department.prototype, "externalId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        comment: '외부 시스템 생성일',
    }),
    __metadata("design:type", Date)
], Department.prototype, "externalCreatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        comment: '외부 시스템 수정일',
    }),
    __metadata("design:type", Date)
], Department.prototype, "externalUpdatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        nullable: true,
        comment: '마지막 동기화 시간',
    }),
    __metadata("design:type", Date)
], Department.prototype, "lastSyncAt", void 0);
exports.Department = Department = __decorate([
    (0, typeorm_1.Entity)('department'),
    (0, typeorm_1.Index)(['externalId'], { unique: true }),
    __metadata("design:paramtypes", [String, String, String, Number, String, String, Date,
        Date])
], Department);
//# sourceMappingURL=department.entity.js.map