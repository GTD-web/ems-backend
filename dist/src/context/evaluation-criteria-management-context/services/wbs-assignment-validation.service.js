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
exports.WbsAssignmentValidationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_project_assignment_entity_1 = require("../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const employee_entity_1 = require("../../../domain/common/employee/employee.entity");
const evaluation_period_service_1 = require("../../../domain/core/evaluation-period/evaluation-period.service");
const evaluation_wbs_assignment_entity_1 = require("../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const transaction_manager_service_1 = require("../../../../libs/database/transaction-manager.service");
const wbs_item_service_1 = require("../../../domain/common/wbs-item/wbs-item.service");
let WbsAssignmentValidationService = class WbsAssignmentValidationService {
    projectAssignmentRepository;
    employeeRepository;
    wbsAssignmentRepository;
    transactionManager;
    evaluationPeriodService;
    wbsItemService;
    constructor(projectAssignmentRepository, employeeRepository, wbsAssignmentRepository, transactionManager, evaluationPeriodService, wbsItemService) {
        this.projectAssignmentRepository = projectAssignmentRepository;
        this.employeeRepository = employeeRepository;
        this.wbsAssignmentRepository = wbsAssignmentRepository;
        this.transactionManager = transactionManager;
        this.evaluationPeriodService = evaluationPeriodService;
        this.wbsItemService = wbsItemService;
    }
    async 할당생성비즈니스규칙검증한다(data, manager) {
        const employeeRepository = this.transactionManager.getRepository(employee_entity_1.Employee, this.employeeRepository, manager);
        const employee = await employeeRepository.findOne({
            where: { id: data.employeeId },
        });
        if (!employee) {
            throw new common_1.NotFoundException(`직원 ID ${data.employeeId}에 해당하는 직원을 찾을 수 없습니다.`);
        }
        const wbsItem = await this.wbsItemService.ID로_조회한다(data.wbsItemId, manager);
        if (!wbsItem) {
            throw new common_1.NotFoundException(`WBS 항목 ID ${data.wbsItemId}에 해당하는 WBS 항목을 찾을 수 없습니다.`);
        }
        const projectAssignmentRepository = this.transactionManager.getRepository(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, this.projectAssignmentRepository, manager);
        const projectAssignment = await projectAssignmentRepository.findOne({
            where: {
                periodId: data.periodId,
                employeeId: data.employeeId,
                projectId: data.projectId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
        if (!projectAssignment) {
            throw new common_1.UnprocessableEntityException(`프로젝트 할당이 먼저 필요합니다. 평가기간: ${data.periodId}, 직원: ${data.employeeId}, 프로젝트: ${data.projectId}`);
        }
        if (!data.periodId?.trim()) {
            throw new common_1.UnprocessableEntityException('평가기간 상태를 확인할 수 없습니다.');
        }
        const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(data.periodId, manager);
        if (!evaluationPeriod) {
            throw new common_1.NotFoundException(`평가기간 ID ${data.periodId}에 해당하는 평가기간을 찾을 수 없습니다.`);
        }
        if (evaluationPeriod.완료된_상태인가()) {
            throw new common_1.UnprocessableEntityException(`완료된 평가기간에는 WBS 할당을 생성할 수 없습니다. 평가기간: ${data.periodId}`);
        }
        const wbsAssignmentRepository = this.transactionManager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment, this.wbsAssignmentRepository, manager);
        const duplicateCount = await wbsAssignmentRepository
            .createQueryBuilder('assignment')
            .where('assignment.periodId = :periodId', { periodId: data.periodId })
            .andWhere('assignment.employeeId = :employeeId', {
            employeeId: data.employeeId,
        })
            .andWhere('assignment.projectId = :projectId', {
            projectId: data.projectId,
        })
            .andWhere('assignment.wbsItemId = :wbsItemId', {
            wbsItemId: data.wbsItemId,
        })
            .andWhere('assignment.deletedAt IS NULL')
            .getCount();
        if (duplicateCount > 0) {
            throw new common_1.ConflictException(`이미 할당된 WBS입니다. 평가기간: ${data.periodId}, 직원: ${data.employeeId}, 프로젝트: ${data.projectId}, WBS 항목: ${data.wbsItemId}`);
        }
    }
};
exports.WbsAssignmentValidationService = WbsAssignmentValidationService;
exports.WbsAssignmentValidationService = WbsAssignmentValidationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_project_assignment_entity_1.EvaluationProjectAssignment)),
    __param(1, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(2, (0, typeorm_1.InjectRepository)(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        transaction_manager_service_1.TransactionManagerService,
        evaluation_period_service_1.EvaluationPeriodService,
        wbs_item_service_1.WbsItemService])
], WbsAssignmentValidationService);
//# sourceMappingURL=wbs-assignment-validation.service.js.map