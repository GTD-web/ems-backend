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
exports.QuestionGroup = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
const question_group_exceptions_1 = require("./question-group.exceptions");
let QuestionGroup = class QuestionGroup extends base_entity_1.BaseEntity {
    name;
    isDefault;
    isDeletable;
    constructor(data) {
        super();
        if (data) {
            if (!data.name || data.name.trim() === '') {
                throw new question_group_exceptions_1.EmptyGroupNameException();
            }
            this.name = data.name;
            this.isDefault = data.isDefault || false;
            this.isDeletable =
                data.isDeletable !== undefined ? data.isDeletable : true;
            this.메타데이터를_업데이트한다(data.createdBy);
        }
    }
    그룹명업데이트한다(name, updatedBy) {
        if (!name || name.trim() === '') {
            throw new question_group_exceptions_1.EmptyGroupNameException();
        }
        this.name = name;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    기본그룹설정한다(isDefault, updatedBy) {
        this.isDefault = isDefault;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    삭제가능여부설정한다(isDeletable, updatedBy) {
        this.isDeletable = isDeletable;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    삭제가능한가() {
        return this.isDeletable && !this.isDefault;
    }
    기본그룹인가() {
        return this.isDefault;
    }
    유효한그룹명인가() {
        return this.name !== undefined && this.name.trim() !== '';
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            name: this.name,
            isDefault: this.isDefault,
            isDeletable: this.isDeletable,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
};
exports.QuestionGroup = QuestionGroup;
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 200,
        comment: '그룹명 (삭제되지 않은 레코드에 한해 중복 불가)',
    }),
    __metadata("design:type", String)
], QuestionGroup.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: false,
        comment: '기본 그룹 여부',
    }),
    __metadata("design:type", Boolean)
], QuestionGroup.prototype, "isDefault", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: true,
        comment: '삭제 가능 여부',
    }),
    __metadata("design:type", Boolean)
], QuestionGroup.prototype, "isDeletable", void 0);
exports.QuestionGroup = QuestionGroup = __decorate([
    (0, typeorm_1.Entity)('question_group'),
    (0, typeorm_1.Index)(['isDefault']),
    __metadata("design:paramtypes", [Object])
], QuestionGroup);
//# sourceMappingURL=question-group.entity.js.map