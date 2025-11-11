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
exports.UnreadCountResponseDto = exports.RevisionRequestResponseDto = exports.EvaluationPeriodInfoDto = exports.EmployeeInfoDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class EmployeeInfoDto {
    id;
    name;
    employeeNumber;
    email;
    departmentName;
    rankName;
}
exports.EmployeeInfoDto = EmployeeInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '직원 ID' }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '직원명' }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '사번' }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "employeeNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '이메일' }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '부서명' }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "departmentName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '직책명' }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "rankName", void 0);
class EvaluationPeriodInfoDto {
    id;
    name;
}
exports.EvaluationPeriodInfoDto = EvaluationPeriodInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '평가기간 ID' }),
    __metadata("design:type", String)
], EvaluationPeriodInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '평가기간명' }),
    __metadata("design:type", String)
], EvaluationPeriodInfoDto.prototype, "name", void 0);
class RevisionRequestResponseDto {
    requestId;
    evaluationPeriodId;
    evaluationPeriod;
    employeeId;
    employee;
    step;
    comment;
    requestedBy;
    requestedAt;
    recipientId;
    recipientType;
    isRead;
    readAt;
    isCompleted;
    completedAt;
    responseComment;
    createdAt;
    updatedAt;
}
exports.RevisionRequestResponseDto = RevisionRequestResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '재작성 요청 ID' }),
    __metadata("design:type", String)
], RevisionRequestResponseDto.prototype, "requestId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '평가기간 ID' }),
    __metadata("design:type", String)
], RevisionRequestResponseDto.prototype, "evaluationPeriodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '평가기간 정보', type: EvaluationPeriodInfoDto }),
    __metadata("design:type", EvaluationPeriodInfoDto)
], RevisionRequestResponseDto.prototype, "evaluationPeriod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '피평가자 ID' }),
    __metadata("design:type", String)
], RevisionRequestResponseDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '피평가자 정보', type: EmployeeInfoDto }),
    __metadata("design:type", EmployeeInfoDto)
], RevisionRequestResponseDto.prototype, "employee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '재작성 요청 단계',
        enum: ['criteria', 'self', 'primary', 'secondary'],
        example: 'criteria',
    }),
    __metadata("design:type", String)
], RevisionRequestResponseDto.prototype, "step", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '재작성 요청 코멘트',
        example: '평가기준이 명확하지 않습니다. 다시 작성해 주세요.',
    }),
    __metadata("design:type", String)
], RevisionRequestResponseDto.prototype, "comment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '요청자 ID' }),
    __metadata("design:type", String)
], RevisionRequestResponseDto.prototype, "requestedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '요청 일시' }),
    __metadata("design:type", Date)
], RevisionRequestResponseDto.prototype, "requestedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '수신자 ID' }),
    __metadata("design:type", String)
], RevisionRequestResponseDto.prototype, "recipientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수신자 타입',
        enum: ['evaluatee', 'primary_evaluator', 'secondary_evaluator'],
        example: 'evaluatee',
    }),
    __metadata("design:type", String)
], RevisionRequestResponseDto.prototype, "recipientType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '읽음 여부' }),
    __metadata("design:type", Boolean)
], RevisionRequestResponseDto.prototype, "isRead", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '읽은 일시', nullable: true }),
    __metadata("design:type", Object)
], RevisionRequestResponseDto.prototype, "readAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '재작성 완료 여부' }),
    __metadata("design:type", Boolean)
], RevisionRequestResponseDto.prototype, "isCompleted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '재작성 완료 일시', nullable: true }),
    __metadata("design:type", Object)
], RevisionRequestResponseDto.prototype, "completedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '재작성 완료 응답 코멘트',
        nullable: true,
    }),
    __metadata("design:type", Object)
], RevisionRequestResponseDto.prototype, "responseComment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '생성 일시' }),
    __metadata("design:type", Date)
], RevisionRequestResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '수정 일시' }),
    __metadata("design:type", Date)
], RevisionRequestResponseDto.prototype, "updatedAt", void 0);
class UnreadCountResponseDto {
    unreadCount;
}
exports.UnreadCountResponseDto = UnreadCountResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '읽지 않은 재작성 요청 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], UnreadCountResponseDto.prototype, "unreadCount", void 0);
//# sourceMappingURL=revision-request-response.dto.js.map