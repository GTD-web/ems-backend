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
var GetEmployeeEvaluationSettingsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEmployeeEvaluationSettingsHandler = exports.GetEmployeeEvaluationSettingsQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_project_assignment_entity_1 = require("../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const evaluation_wbs_assignment_entity_1 = require("../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const evaluation_line_mapping_entity_1 = require("../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
class GetEmployeeEvaluationSettingsQuery {
    employeeId;
    periodId;
    constructor(employeeId, periodId) {
        this.employeeId = employeeId;
        this.periodId = periodId;
    }
}
exports.GetEmployeeEvaluationSettingsQuery = GetEmployeeEvaluationSettingsQuery;
let GetEmployeeEvaluationSettingsHandler = GetEmployeeEvaluationSettingsHandler_1 = class GetEmployeeEvaluationSettingsHandler {
    evaluationProjectAssignmentRepository;
    evaluationWbsAssignmentRepository;
    evaluationLineMappingRepository;
    logger = new common_1.Logger(GetEmployeeEvaluationSettingsHandler_1.name);
    constructor(evaluationProjectAssignmentRepository, evaluationWbsAssignmentRepository, evaluationLineMappingRepository) {
        this.evaluationProjectAssignmentRepository = evaluationProjectAssignmentRepository;
        this.evaluationWbsAssignmentRepository = evaluationWbsAssignmentRepository;
        this.evaluationLineMappingRepository = evaluationLineMappingRepository;
    }
    async execute(query) {
        const { employeeId, periodId } = query;
        this.logger.debug(`직원의 평가설정 조회 시작 - 직원 ID: ${employeeId}, 평가기간: ${periodId}`);
        try {
            const [projectAssignments, wbsAssignments] = await Promise.all([
                this.evaluationProjectAssignmentRepository.find({
                    where: { employeeId, periodId },
                    order: { createdAt: 'DESC' },
                }),
                this.evaluationWbsAssignmentRepository.find({
                    where: { employeeId, periodId },
                    order: { createdAt: 'DESC' },
                }),
            ]);
            let evaluationLineMappings = [];
            if (wbsAssignments.length > 0) {
                const wbsItemIds = wbsAssignments.map((assignment) => assignment.wbsItemId);
                const wbsMappings = await this.evaluationLineMappingRepository
                    .createQueryBuilder('mapping')
                    .where('mapping.employeeId = :employeeId', { employeeId })
                    .andWhere('mapping.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
                    .andWhere('mapping.deletedAt IS NULL')
                    .orderBy('mapping.createdAt', 'DESC')
                    .getMany();
                evaluationLineMappings.push(...wbsMappings);
            }
            const primaryMappings = await this.evaluationLineMappingRepository
                .createQueryBuilder('mapping')
                .where('mapping.employeeId = :employeeId', { employeeId })
                .andWhere('mapping.wbsItemId IS NULL')
                .andWhere('mapping.deletedAt IS NULL')
                .orderBy('mapping.createdAt', 'DESC')
                .getMany();
            evaluationLineMappings.push(...primaryMappings);
            const result = {
                projectAssignments: projectAssignments.map((assignment) => assignment.DTO로_변환한다()),
                wbsAssignments: wbsAssignments.map((assignment) => assignment.DTO로_변환한다()),
                evaluationLineMappings: evaluationLineMappings.map((mapping) => mapping.DTO로_변환한다()),
            };
            this.logger.debug(`직원의 평가설정 조회 완료 - 직원 ID: ${employeeId}, 프로젝트 할당: ${result.projectAssignments.length}, WBS 할당: ${result.wbsAssignments.length}, 평가라인 매핑: ${result.evaluationLineMappings.length}`);
            return result;
        }
        catch (error) {
            this.logger.error(`직원의 평가설정 조회 실패 - 직원 ID: ${employeeId}, 평가기간: ${periodId}`, error.stack);
            throw error;
        }
    }
};
exports.GetEmployeeEvaluationSettingsHandler = GetEmployeeEvaluationSettingsHandler;
exports.GetEmployeeEvaluationSettingsHandler = GetEmployeeEvaluationSettingsHandler = GetEmployeeEvaluationSettingsHandler_1 = __decorate([
    (0, cqrs_1.QueryHandler)(GetEmployeeEvaluationSettingsQuery),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_project_assignment_entity_1.EvaluationProjectAssignment)),
    __param(1, (0, typeorm_1.InjectRepository)(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)),
    __param(2, (0, typeorm_1.InjectRepository)(evaluation_line_mapping_entity_1.EvaluationLineMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], GetEmployeeEvaluationSettingsHandler);
//# sourceMappingURL=get-employee-evaluation-settings.handler.js.map