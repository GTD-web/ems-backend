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
var EvaluationProjectAssignmentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationProjectAssignmentService = void 0;
const transaction_manager_service_1 = require("../../../../libs/database/transaction-manager.service");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_project_assignment_validation_service_1 = require("./evaluation-project-assignment-validation.service");
const evaluation_project_assignment_entity_1 = require("./evaluation-project-assignment.entity");
const evaluation_project_assignment_exceptions_1 = require("./evaluation-project-assignment.exceptions");
let EvaluationProjectAssignmentService = EvaluationProjectAssignmentService_1 = class EvaluationProjectAssignmentService {
    evaluationProjectAssignmentRepository;
    dataSource;
    transactionManager;
    validationService;
    logger = new common_1.Logger(EvaluationProjectAssignmentService_1.name);
    constructor(evaluationProjectAssignmentRepository, dataSource, transactionManager, validationService) {
        this.evaluationProjectAssignmentRepository = evaluationProjectAssignmentRepository;
        this.dataSource = dataSource;
        this.transactionManager = transactionManager;
        this.validationService = validationService;
    }
    async executeSafeDomainOperation(operation, context) {
        return this.transactionManager.executeSafeOperation(operation, context);
    }
    async ID로_조회한다(id, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, this.evaluationProjectAssignmentRepository, manager);
            const assignment = await repository.findOne({ where: { id } });
            return assignment || null;
        }, 'ID로_조회한다');
    }
    async 생성한다(createData, manager) {
        return this.executeSafeDomainOperation(async () => {
            const entityManager = manager || this.dataSource.manager;
            await this.validationService.할당생성비즈니스규칙검증한다(createData, entityManager);
            if (createData.displayOrder === undefined) {
                const maxOrder = await this.최대_순서를_조회한다(createData.periodId, createData.employeeId, entityManager);
                createData.displayOrder = maxOrder + 1;
            }
            const assignment = new evaluation_project_assignment_entity_1.EvaluationProjectAssignment(createData);
            const repository = this.transactionManager.getRepository(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, this.evaluationProjectAssignmentRepository, entityManager);
            const savedAssignment = await repository.save(assignment);
            this.logger.log(`평가 프로젝트 할당 생성 완료 - ID: ${savedAssignment.id}`);
            return savedAssignment;
        }, '생성한다');
    }
    async 업데이트한다(id, updateData, updatedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const entityManager = manager || this.dataSource.manager;
            const repository = this.transactionManager.getRepository(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, this.evaluationProjectAssignmentRepository, entityManager);
            const assignment = await repository.findOne({ where: { id } });
            if (!assignment) {
                throw new evaluation_project_assignment_exceptions_1.EvaluationProjectAssignmentNotFoundException(id);
            }
            await this.validationService.할당업데이트비즈니스규칙검증한다(id, updateData, entityManager);
            const filteredUpdateData = Object.fromEntries(Object.entries(updateData).filter(([_, value]) => value !== undefined));
            Object.assign(assignment, filteredUpdateData, {
                updatedBy,
                updatedAt: new Date(),
            });
            const savedAssignment = await repository.save(assignment);
            this.logger.log(`평가 프로젝트 할당 업데이트 완료 - ID: ${id}, 업데이트자: ${updatedBy}`);
            return savedAssignment;
        }, '업데이트한다');
    }
    async 삭제한다(id, deletedBy, manager, options) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, this.evaluationProjectAssignmentRepository, manager);
            const assignment = await repository.findOne({ where: { id } });
            if (!assignment) {
                throw new evaluation_project_assignment_exceptions_1.EvaluationProjectAssignmentNotFoundException(id);
            }
            if (!options?.skipValidation) {
                await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
            }
            assignment.메타데이터를_업데이트한다(deletedBy);
            await repository.softDelete(id);
            this.logger.log(`평가 프로젝트 할당 삭제 완료 - ID: ${id}, 삭제자: ${deletedBy}`);
        }, '삭제한다');
    }
    async 할당_존재_확인한다(periodId, employeeId, projectId, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, this.evaluationProjectAssignmentRepository, manager);
            const count = await repository.count({
                where: { periodId, employeeId, projectId },
            });
            return count > 0;
        }, '할당_존재_확인한다');
    }
    async 평가기간_할당_전체삭제한다(periodId, deletedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, this.evaluationProjectAssignmentRepository, manager);
            const assignments = await repository.find({ where: { periodId } });
            for (const assignment of assignments) {
                await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
            }
            await repository.delete({ periodId });
            this.logger.log(`평가기간 할당 전체 삭제 완료 - 평가기간 ID: ${periodId}, 삭제자: ${deletedBy}`);
        }, '평가기간_할당_전체삭제한다');
    }
    async 직원_할당_전체삭제한다(employeeId, deletedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, this.evaluationProjectAssignmentRepository, manager);
            const assignments = await repository.find({ where: { employeeId } });
            for (const assignment of assignments) {
                await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
            }
            await repository.delete({ employeeId });
            this.logger.log(`직원 할당 전체 삭제 완료 - 직원 ID: ${employeeId}, 삭제자: ${deletedBy}`);
        }, '직원_할당_전체삭제한다');
    }
    async 프로젝트_할당_전체삭제한다(projectId, deletedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, this.evaluationProjectAssignmentRepository, manager);
            const assignments = await repository.find({ where: { projectId } });
            for (const assignment of assignments) {
                await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
            }
            await repository.delete({ projectId });
            this.logger.log(`프로젝트 할당 전체 삭제 완료 - 프로젝트 ID: ${projectId}, 삭제자: ${deletedBy}`);
        }, '프로젝트_할당_전체삭제한다');
    }
    async 최대_순서를_조회한다(periodId, employeeId, manager) {
        const repository = this.transactionManager.getRepository(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, this.evaluationProjectAssignmentRepository, manager);
        const result = await repository
            .createQueryBuilder('assignment')
            .select('MAX(assignment.displayOrder)', 'maxOrder')
            .where('assignment.periodId = :periodId', { periodId })
            .andWhere('assignment.employeeId = :employeeId', { employeeId })
            .getRawOne();
        return result?.maxOrder ?? -1;
    }
    async 순서를_변경한다(assignmentId, direction, updatedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const entityManager = manager || this.dataSource.manager;
            const repository = this.transactionManager.getRepository(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, this.evaluationProjectAssignmentRepository, entityManager);
            const currentAssignment = await repository.findOne({
                where: { id: assignmentId },
            });
            if (!currentAssignment) {
                throw new evaluation_project_assignment_exceptions_1.EvaluationProjectAssignmentNotFoundException(assignmentId);
            }
            const currentOrder = currentAssignment.displayOrder;
            const allAssignments = await repository.find({
                where: {
                    periodId: currentAssignment.periodId,
                    employeeId: currentAssignment.employeeId,
                    deletedAt: (0, typeorm_2.IsNull)(),
                },
                order: { displayOrder: 'ASC' },
            });
            const currentIndex = allAssignments.findIndex((a) => a.id === assignmentId);
            if (direction === 'up' && currentIndex === 0) {
                this.logger.warn(`이미 첫 번째 항목입니다 - ID: ${assignmentId}`);
                return currentAssignment;
            }
            if (direction === 'down' && currentIndex === allAssignments.length - 1) {
                this.logger.warn(`이미 마지막 항목입니다 - ID: ${assignmentId}`);
                return currentAssignment;
            }
            const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            const targetAssignment = allAssignments[targetIndex];
            const tempOrder = currentAssignment.displayOrder;
            currentAssignment.순서를_변경한다(targetAssignment.displayOrder);
            targetAssignment.순서를_변경한다(tempOrder);
            currentAssignment.메타데이터를_업데이트한다(updatedBy);
            targetAssignment.메타데이터를_업데이트한다(updatedBy);
            await repository.save([currentAssignment, targetAssignment]);
            this.logger.log(`프로젝트 할당 순서 변경 완료 - ID: ${assignmentId}, 방향: ${direction}`);
            return currentAssignment;
        }, '순서를_변경한다');
    }
    async 순서를_재정렬한다(periodId, employeeId, updatedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, this.evaluationProjectAssignmentRepository, manager);
            const assignments = await repository.find({
                where: { periodId, employeeId, deletedAt: (0, typeorm_2.IsNull)() },
                order: { displayOrder: 'ASC', assignedDate: 'DESC' },
            });
            assignments.forEach((assignment, index) => {
                assignment.순서를_변경한다(index);
                assignment.메타데이터를_업데이트한다(updatedBy);
            });
            await repository.save(assignments);
            this.logger.log(`프로젝트 할당 순서 재정렬 완료 - 평가기간 ID: ${periodId}, 직원 ID: ${employeeId}, 항목 수: ${assignments.length}`);
        }, '순서를_재정렬한다');
    }
};
exports.EvaluationProjectAssignmentService = EvaluationProjectAssignmentService;
exports.EvaluationProjectAssignmentService = EvaluationProjectAssignmentService = EvaluationProjectAssignmentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_project_assignment_entity_1.EvaluationProjectAssignment)),
    __param(1, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource,
        transaction_manager_service_1.TransactionManagerService,
        evaluation_project_assignment_validation_service_1.EvaluationProjectAssignmentValidationService])
], EvaluationProjectAssignmentService);
//# sourceMappingURL=evaluation-project-assignment.service.js.map