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
exports.BaseEntityWithNumericId = exports.BaseEntity = void 0;
const typeorm_1 = require("typeorm");
class BaseEntity {
    id;
    createdAt;
    updatedAt;
    deletedAt;
    createdBy;
    updatedBy;
    version;
    validateUuidFormat(value, fieldName) {
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidPattern.test(value)) {
            throw new Error(`${fieldName}은(는) 유효한 UUID 형식이어야 합니다: ${value}`);
        }
    }
    validateUuidFields(fields) {
        fields.forEach((field) => {
            if (field.value) {
                this.validateUuidFormat(field.value, field.name);
            }
        });
    }
    삭제되었는가() {
        return this.deletedAt !== null && this.deletedAt !== undefined;
    }
    새로_생성되었는가() {
        return !this.id || this.version === 1;
    }
    생성자를_설정한다(userId) {
        this.createdBy = userId;
    }
    수정자를_설정한다(userId) {
        this.updatedBy = userId;
    }
    메타데이터를_업데이트한다(userId) {
        const now = new Date();
        if (this.새로_생성되었는가()) {
            this.createdAt = now;
            if (userId) {
                this.createdBy = userId;
            }
        }
        this.updatedAt = now;
        if (userId) {
            this.updatedBy = userId;
        }
    }
    get isDeleted() {
        return this.삭제되었는가();
    }
    get isNew() {
        return this.새로_생성되었는가();
    }
    setCreatedBy(userId) {
        this.생성자를_설정한다(userId);
    }
    setUpdatedBy(userId) {
        this.수정자를_설정한다(userId);
    }
    updateMetadata(userId) {
        this.메타데이터를_업데이트한다(userId);
    }
}
exports.BaseEntity = BaseEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BaseEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        type: 'timestamp with time zone',
        comment: '생성 일시',
    }),
    __metadata("design:type", Date)
], BaseEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({
        type: 'timestamp with time zone',
        comment: '수정 일시',
    }),
    __metadata("design:type", Date)
], BaseEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({
        type: 'timestamp with time zone',
        nullable: true,
        comment: '삭제 일시 (소프트 삭제)',
    }),
    __metadata("design:type", Date)
], BaseEntity.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: '생성자 ID',
    }),
    __metadata("design:type", String)
], BaseEntity.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: '수정자 ID',
    }),
    __metadata("design:type", String)
], BaseEntity.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.VersionColumn)({
        comment: '버전 (낙관적 잠금용)',
    }),
    __metadata("design:type", Number)
], BaseEntity.prototype, "version", void 0);
class BaseEntityWithNumericId {
    id;
    createdAt;
    updatedAt;
    deletedAt;
    createdBy;
    updatedBy;
    version;
    삭제되었는가() {
        return this.deletedAt !== null && this.deletedAt !== undefined;
    }
    새로_생성되었는가() {
        return !this.id || this.version === 1;
    }
    생성자를_설정한다(userId) {
        this.createdBy = userId;
    }
    수정자를_설정한다(userId) {
        this.updatedBy = userId;
    }
    메타데이터를_업데이트한다(userId) {
        const now = new Date();
        if (this.새로_생성되었는가()) {
            this.createdAt = now;
            if (userId) {
                this.createdBy = userId;
            }
        }
        this.updatedAt = now;
        if (userId) {
            this.updatedBy = userId;
        }
    }
    get isDeleted() {
        return this.삭제되었는가();
    }
    get isNew() {
        return this.새로_생성되었는가();
    }
    setCreatedBy(userId) {
        this.생성자를_설정한다(userId);
    }
    setUpdatedBy(userId) {
        this.수정자를_설정한다(userId);
    }
    updateMetadata(userId) {
        this.메타데이터를_업데이트한다(userId);
    }
}
exports.BaseEntityWithNumericId = BaseEntityWithNumericId;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({
        comment: '기본키 (자동 증가)',
    }),
    __metadata("design:type", Number)
], BaseEntityWithNumericId.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        type: 'timestamp with time zone',
        comment: '생성 일시',
    }),
    __metadata("design:type", Date)
], BaseEntityWithNumericId.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({
        type: 'timestamp with time zone',
        comment: '수정 일시',
    }),
    __metadata("design:type", Date)
], BaseEntityWithNumericId.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({
        type: 'timestamp with time zone',
        nullable: true,
        comment: '삭제 일시 (소프트 삭제)',
    }),
    __metadata("design:type", Date)
], BaseEntityWithNumericId.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: '생성자 ID',
    }),
    __metadata("design:type", String)
], BaseEntityWithNumericId.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: '수정자 ID',
    }),
    __metadata("design:type", String)
], BaseEntityWithNumericId.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.VersionColumn)({
        comment: '버전 (낙관적 잠금용)',
    }),
    __metadata("design:type", Number)
], BaseEntityWithNumericId.prototype, "version", void 0);
//# sourceMappingURL=base.entity.js.map