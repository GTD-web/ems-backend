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
exports.Deliverable = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
const deliverable_types_1 = require("./deliverable.types");
let Deliverable = class Deliverable extends base_entity_1.BaseEntity {
    name;
    description;
    type;
    filePath;
    employeeId;
    wbsItemId;
    mappedDate;
    mappedBy;
    isActive;
    constructor(data) {
        super();
        if (data) {
            this.name = data.name;
            this.description = data.description;
            this.type = data.type;
            this.filePath = data.filePath;
            this.employeeId = data.employeeId;
            this.wbsItemId = data.wbsItemId;
            this.mappedBy = data.mappedBy;
            this.mappedDate =
                data.mappedDate || (data.employeeId ? new Date() : undefined);
            this.isActive = data.isActive !== undefined ? data.isActive : true;
            this.메타데이터를_업데이트한다(data.createdBy);
        }
    }
    산출물을_수정한다(name, description, type, filePath, employeeId, wbsItemId, updatedBy) {
        if (name !== undefined)
            this.name = name;
        if (description !== undefined)
            this.description = description;
        if (type !== undefined)
            this.type = type;
        if (filePath !== undefined)
            this.filePath = filePath;
        if (employeeId !== undefined)
            this.employeeId = employeeId;
        if (wbsItemId !== undefined)
            this.wbsItemId = wbsItemId;
        if (updatedBy) {
            this.메타데이터를_업데이트한다(updatedBy);
        }
    }
    직원에게_할당되었는가(employeeId) {
        return this.employeeId === employeeId;
    }
    WBS항목에_연결되었는가(wbsItemId) {
        return this.wbsItemId === wbsItemId;
    }
    활성화한다(activatedBy) {
        this.isActive = true;
        if (activatedBy) {
            this.메타데이터를_업데이트한다(activatedBy);
        }
    }
    비활성화한다(deactivatedBy) {
        this.isActive = false;
        if (deactivatedBy) {
            this.메타데이터를_업데이트한다(deactivatedBy);
        }
    }
    매핑한다(employeeId, wbsItemId, mappedBy) {
        this.employeeId = employeeId;
        this.wbsItemId = wbsItemId;
        this.mappedBy = mappedBy;
        this.mappedDate = new Date();
        this.isActive = true;
        this.메타데이터를_업데이트한다(mappedBy);
    }
    매핑을_해제한다(unmappedBy) {
        this.isActive = false;
        if (unmappedBy) {
            this.메타데이터를_업데이트한다(unmappedBy);
        }
    }
    삭제한다() {
        this.deletedAt = new Date();
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            type: this.type,
            filePath: this.filePath,
            employeeId: this.employeeId,
            wbsItemId: this.wbsItemId,
            mappedDate: this.mappedDate,
            mappedBy: this.mappedBy,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            deletedAt: this.deletedAt,
            version: this.version,
        };
    }
};
exports.Deliverable = Deliverable;
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        comment: '산출물명',
    }),
    __metadata("design:type", String)
], Deliverable.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
        comment: '산출물 설명',
    }),
    __metadata("design:type", String)
], Deliverable.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['document', 'code', 'design', 'report', 'presentation', 'other'],
        comment: '산출물 유형',
    }),
    __metadata("design:type", String)
], Deliverable.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 500,
        nullable: true,
        comment: '파일 경로',
    }),
    __metadata("design:type", String)
], Deliverable.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        nullable: true,
        comment: '직원 ID',
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Deliverable.prototype, "employeeId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        nullable: true,
        comment: 'WBS 항목 ID',
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Deliverable.prototype, "wbsItemId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        nullable: true,
        comment: '매핑일',
    }),
    __metadata("design:type", Date)
], Deliverable.prototype, "mappedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        nullable: true,
        comment: '매핑자 ID',
    }),
    __metadata("design:type", String)
], Deliverable.prototype, "mappedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: true,
        comment: '활성 상태',
    }),
    __metadata("design:type", Boolean)
], Deliverable.prototype, "isActive", void 0);
exports.Deliverable = Deliverable = __decorate([
    (0, typeorm_1.Entity)('deliverable'),
    (0, typeorm_1.Index)(['type']),
    __metadata("design:paramtypes", [Object])
], Deliverable);
//# sourceMappingURL=deliverable.entity.js.map