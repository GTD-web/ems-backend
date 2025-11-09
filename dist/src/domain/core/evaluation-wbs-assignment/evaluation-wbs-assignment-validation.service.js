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
var EvaluationWbsAssignmentValidationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationWbsAssignmentValidationService = void 0;
const transaction_manager_service_1 = require("../../../../libs/database/transaction-manager.service");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_wbs_assignment_entity_1 = require("./evaluation-wbs-assignment.entity");
const evaluation_wbs_assignment_exceptions_1 = require("./evaluation-wbs-assignment.exceptions");
let EvaluationWbsAssignmentValidationService = EvaluationWbsAssignmentValidationService_1 = class EvaluationWbsAssignmentValidationService {
    evaluationWbsAssignmentRepository;
    transactionManager;
    logger = new common_1.Logger(EvaluationWbsAssignmentValidationService_1.name);
    constructor(evaluationWbsAssignmentRepository, transactionManager) {
        this.evaluationWbsAssignmentRepository = evaluationWbsAssignmentRepository;
        this.transactionManager = transactionManager;
    }
    async 생성데이터검증한다(createData, manager) {
        this.필수데이터검증한다(createData);
        this.데이터형식검증한다(createData);
        await this.생성비즈니스규칙검증한다(createData, manager);
    }
    async 업데이트데이터검증한다(id, updateData, manager) {
        const repository = this.transactionManager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment, this.evaluationWbsAssignmentRepository, manager);
        const existingAssignment = await repository.findOne({ where: { id } });
        if (!existingAssignment) {
            throw new evaluation_wbs_assignment_exceptions_1.EvaluationWbsAssignmentRequiredDataMissingException('존재하지 않는 평가 WBS 할당입니다.');
        }
        if (updateData.assignedBy !== undefined) {
            this.할당자형식검증한다(updateData.assignedBy);
        }
        await this.업데이트비즈니스규칙검증한다(id, updateData, existingAssignment, manager);
    }
    필수데이터검증한다(createData) {
        if (!createData.periodId?.trim()) {
            throw new evaluation_wbs_assignment_exceptions_1.EvaluationWbsAssignmentRequiredDataMissingException('평가 기간 ID는 필수입니다.');
        }
        if (!createData.employeeId?.trim()) {
            throw new evaluation_wbs_assignment_exceptions_1.EvaluationWbsAssignmentRequiredDataMissingException('직원 ID는 필수입니다.');
        }
        if (!createData.projectId?.trim()) {
            throw new evaluation_wbs_assignment_exceptions_1.EvaluationWbsAssignmentRequiredDataMissingException('프로젝트 ID는 필수입니다.');
        }
        if (!createData.wbsItemId?.trim()) {
            throw new evaluation_wbs_assignment_exceptions_1.EvaluationWbsAssignmentRequiredDataMissingException('WBS 항목 ID는 필수입니다.');
        }
        if (!createData.assignedBy?.trim()) {
            throw new evaluation_wbs_assignment_exceptions_1.EvaluationWbsAssignmentRequiredDataMissingException('할당자 ID는 필수입니다.');
        }
    }
    데이터형식검증한다(data) {
        if ('periodId' in data && data.periodId !== undefined) {
            this.ID형식검증한다(data.periodId, 'periodId');
        }
        if ('employeeId' in data && data.employeeId !== undefined) {
            this.ID형식검증한다(data.employeeId, 'employeeId');
        }
        if ('projectId' in data && data.projectId !== undefined) {
            this.ID형식검증한다(data.projectId, 'projectId');
        }
        if ('wbsItemId' in data && data.wbsItemId !== undefined) {
            this.ID형식검증한다(data.wbsItemId, 'wbsItemId');
        }
        if (data.assignedBy !== undefined) {
            this.할당자형식검증한다(data.assignedBy);
        }
    }
    ID형식검증한다(id, fieldName) {
        if (!id?.trim()) {
            throw new evaluation_wbs_assignment_exceptions_1.InvalidEvaluationWbsAssignmentDataFormatException(fieldName, '공백이 아닌 문자열', id);
        }
        if (id.length > 255) {
            throw new evaluation_wbs_assignment_exceptions_1.InvalidEvaluationWbsAssignmentDataFormatException(fieldName, '255자 이하', id);
        }
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidPattern.test(id)) {
            throw new evaluation_wbs_assignment_exceptions_1.InvalidEvaluationWbsAssignmentDataFormatException(fieldName, 'UUID 형식', id);
        }
    }
    할당자형식검증한다(assignedBy) {
        if (!assignedBy?.trim()) {
            throw new evaluation_wbs_assignment_exceptions_1.InvalidEvaluationWbsAssignmentDataFormatException('assignedBy', '공백이 아닌 문자열', assignedBy);
        }
        if (assignedBy.length > 255) {
            throw new evaluation_wbs_assignment_exceptions_1.InvalidEvaluationWbsAssignmentDataFormatException('assignedBy', '255자 이하', assignedBy);
        }
    }
    async 생성비즈니스규칙검증한다(createData, manager) {
        await this.평가기간유효성검증한다(createData.periodId, manager);
        await this.직원유효성검증한다(createData.employeeId, manager);
        await this.프로젝트유효성검증한다(createData.projectId, manager);
        await this.WBS항목유효성검증한다(createData.wbsItemId, manager);
    }
    async 업데이트비즈니스규칙검증한다(id, updateData, existingAssignment, manager) {
        if (updateData.assignedBy) {
            await this.할당자유효성검증한다(updateData.assignedBy, manager);
        }
    }
    async 할당업데이트비즈니스규칙검증한다(id, updateData, manager) {
        const repository = this.transactionManager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment, this.evaluationWbsAssignmentRepository, manager);
        const existingAssignment = await repository.findOne({ where: { id } });
        if (!existingAssignment) {
            throw new evaluation_wbs_assignment_exceptions_1.EvaluationWbsAssignmentRequiredDataMissingException('존재하지 않는 평가 WBS 할당입니다.');
        }
        await this.업데이트비즈니스규칙검증한다(id, updateData, existingAssignment, manager);
    }
    async 할당삭제비즈니스규칙검증한다(assignment) {
    }
    async 평가기간유효성검증한다(periodId, manager) {
        if (!periodId?.trim()) {
            throw new evaluation_wbs_assignment_exceptions_1.EvaluationWbsAssignmentBusinessRuleViolationException('유효하지 않은 평가기간 ID입니다.');
        }
    }
    async 직원유효성검증한다(employeeId, manager) {
        if (!employeeId?.trim()) {
            throw new evaluation_wbs_assignment_exceptions_1.EvaluationWbsAssignmentBusinessRuleViolationException('유효하지 않은 직원 ID입니다.');
        }
    }
    async 프로젝트유효성검증한다(projectId, manager) {
        if (!projectId?.trim()) {
            throw new evaluation_wbs_assignment_exceptions_1.EvaluationWbsAssignmentBusinessRuleViolationException('유효하지 않은 프로젝트 ID입니다.');
        }
    }
    async WBS항목유효성검증한다(wbsItemId, manager) {
        if (!wbsItemId?.trim()) {
            throw new evaluation_wbs_assignment_exceptions_1.EvaluationWbsAssignmentBusinessRuleViolationException('유효하지 않은 WBS 항목 ID입니다.');
        }
    }
    async 할당자유효성검증한다(assignedBy, manager) {
        if (!assignedBy?.trim()) {
            throw new evaluation_wbs_assignment_exceptions_1.EvaluationWbsAssignmentBusinessRuleViolationException('유효하지 않은 할당자 ID입니다.');
        }
    }
};
exports.EvaluationWbsAssignmentValidationService = EvaluationWbsAssignmentValidationService;
exports.EvaluationWbsAssignmentValidationService = EvaluationWbsAssignmentValidationService = EvaluationWbsAssignmentValidationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        transaction_manager_service_1.TransactionManagerService])
], EvaluationWbsAssignmentValidationService);
//# sourceMappingURL=evaluation-wbs-assignment-validation.service.js.map