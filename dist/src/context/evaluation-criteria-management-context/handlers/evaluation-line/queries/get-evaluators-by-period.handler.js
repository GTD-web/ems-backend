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
var GetEvaluatorsByPeriodHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPrimaryEvaluatorsByPeriodHandler = exports.GetPrimaryEvaluatorsByPeriodQuery = exports.GetEvaluatorsByPeriodHandler = exports.GetEvaluatorsByPeriodQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const common_1 = require("@nestjs/common");
const evaluation_line_mapping_entity_1 = require("../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
const evaluation_line_entity_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.entity");
const evaluation_wbs_assignment_entity_1 = require("../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const department_entity_1 = require("../../../../../domain/common/department/department.entity");
const evaluation_line_types_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.types");
class GetEvaluatorsByPeriodQuery {
    periodId;
    type;
    constructor(periodId, type) {
        this.periodId = periodId;
        this.type = type;
    }
}
exports.GetEvaluatorsByPeriodQuery = GetEvaluatorsByPeriodQuery;
let GetEvaluatorsByPeriodHandler = GetEvaluatorsByPeriodHandler_1 = class GetEvaluatorsByPeriodHandler {
    evaluationLineMappingRepository;
    evaluationLineRepository;
    evaluationWbsAssignmentRepository;
    employeeRepository;
    departmentRepository;
    logger = new common_1.Logger(GetEvaluatorsByPeriodHandler_1.name);
    constructor(evaluationLineMappingRepository, evaluationLineRepository, evaluationWbsAssignmentRepository, employeeRepository, departmentRepository) {
        this.evaluationLineMappingRepository = evaluationLineMappingRepository;
        this.evaluationLineRepository = evaluationLineRepository;
        this.evaluationWbsAssignmentRepository = evaluationWbsAssignmentRepository;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
    }
    async execute(query) {
        this.logger.log(`[GetEvaluatorsByPeriod] 평가자 목록 조회 시작 - periodId: ${query.periodId}, type: ${query.type}`);
        const evaluationLinesQuery = this.evaluationLineRepository.createQueryBuilder('line');
        if (query.type === 'primary') {
            evaluationLinesQuery.where('line.evaluatorType = :type', {
                type: evaluation_line_types_1.EvaluatorType.PRIMARY,
            });
        }
        else if (query.type === 'secondary') {
            evaluationLinesQuery.where('line.evaluatorType = :type', {
                type: evaluation_line_types_1.EvaluatorType.SECONDARY,
            });
        }
        else {
            evaluationLinesQuery.where('line.evaluatorType IN (:...types)', {
                types: [evaluation_line_types_1.EvaluatorType.PRIMARY, evaluation_line_types_1.EvaluatorType.SECONDARY],
            });
        }
        evaluationLinesQuery.andWhere('line.deletedAt IS NULL');
        const evaluationLines = await evaluationLinesQuery.getMany();
        this.logger.log(`[GetEvaluatorsByPeriod] 1단계: 평가라인 조회 완료 - ${evaluationLines.length}개`);
        if (evaluationLines.length === 0) {
            this.logger.warn('[GetEvaluatorsByPeriod] 평가라인이 없어 빈 배열 반환');
            return {
                periodId: query.periodId,
                type: query.type,
                evaluators: [],
            };
        }
        const lineIds = evaluationLines.map((line) => line.id);
        const lineTypeMap = new Map(evaluationLines.map((line) => [
            line.id,
            (line.evaluatorType === evaluation_line_types_1.EvaluatorType.PRIMARY
                ? 'primary'
                : 'secondary'),
        ]));
        const wbsAssignments = await this.evaluationWbsAssignmentRepository
            .createQueryBuilder('assignment')
            .where('assignment.periodId = :periodId', { periodId: query.periodId })
            .andWhere('assignment.deletedAt IS NULL')
            .getMany();
        this.logger.log(`[GetEvaluatorsByPeriod] 2단계: WBS 할당 조회 완료 - ${wbsAssignments.length}개`);
        if (wbsAssignments.length === 0) {
            this.logger.warn('[GetEvaluatorsByPeriod] WBS 할당이 없어 빈 배열 반환');
            return {
                periodId: query.periodId,
                type: query.type,
                evaluators: [],
            };
        }
        const wbsItemIds = wbsAssignments.map((assignment) => assignment.wbsItemId);
        const mappings = await this.evaluationLineMappingRepository
            .createQueryBuilder('mapping')
            .where('mapping.evaluationLineId IN (:...lineIds)', {
            lineIds,
        })
            .andWhere('mapping.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
            .andWhere('mapping.deletedAt IS NULL')
            .getMany();
        this.logger.log(`[GetEvaluatorsByPeriod] 3단계: 평가라인 매핑 조회 완료 - ${mappings.length}개`);
        if (mappings.length === 0) {
            this.logger.warn('[GetEvaluatorsByPeriod] 평가라인 매핑이 없어 빈 배열 반환');
            return {
                periodId: query.periodId,
                type: query.type,
                evaluators: [],
            };
        }
        const evaluatorMap = new Map();
        mappings.forEach((mapping) => {
            const evaluatorId = mapping.evaluatorId;
            const evaluatorType = lineTypeMap.get(mapping.evaluationLineId);
            const key = `${evaluatorId}-${evaluatorType}`;
            if (!evaluatorMap.has(key)) {
                evaluatorMap.set(key, {
                    evaluatorId,
                    evaluatorType,
                    evaluateeCount: 0,
                });
            }
            const evaluator = evaluatorMap.get(key);
            evaluator.evaluateeCount++;
        });
        const evaluatorIds = [
            ...new Set(Array.from(evaluatorMap.values()).map((e) => e.evaluatorId)),
        ];
        const employees = await this.employeeRepository
            .createQueryBuilder('employee')
            .where('employee.id IN (:...ids)', { ids: evaluatorIds })
            .andWhere('employee.deletedAt IS NULL')
            .getMany();
        const departmentIds = [
            ...new Set(employees
                .map((emp) => emp.departmentId)
                .filter((id) => !!id)),
        ];
        let departments = [];
        if (departmentIds.length > 0) {
            departments = await this.departmentRepository
                .createQueryBuilder('department')
                .where('department.externalId IN (:...ids)', { ids: departmentIds })
                .andWhere('department.deletedAt IS NULL')
                .getMany();
        }
        const departmentMap = new Map(departments.map((dept) => [dept.externalId, dept.name]));
        const employeeMap = new Map(employees.map((emp) => [emp.id, emp]));
        const evaluators = Array.from(evaluatorMap.values()).map((evaluatorData) => {
            const employee = employeeMap.get(evaluatorData.evaluatorId);
            return {
                evaluatorId: employee.id,
                evaluatorName: employee.name,
                departmentName: employee.departmentId
                    ? departmentMap.get(employee.departmentId) || '미지정'
                    : '미지정',
                evaluatorType: evaluatorData.evaluatorType,
                evaluateeCount: evaluatorData.evaluateeCount,
            };
        });
        return {
            periodId: query.periodId,
            type: query.type,
            evaluators,
        };
    }
};
exports.GetEvaluatorsByPeriodHandler = GetEvaluatorsByPeriodHandler;
exports.GetEvaluatorsByPeriodHandler = GetEvaluatorsByPeriodHandler = GetEvaluatorsByPeriodHandler_1 = __decorate([
    (0, cqrs_1.QueryHandler)(GetEvaluatorsByPeriodQuery),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_line_mapping_entity_1.EvaluationLineMapping)),
    __param(1, (0, typeorm_1.InjectRepository)(evaluation_line_entity_1.EvaluationLine)),
    __param(2, (0, typeorm_1.InjectRepository)(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)),
    __param(3, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(4, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], GetEvaluatorsByPeriodHandler);
class GetPrimaryEvaluatorsByPeriodQuery extends GetEvaluatorsByPeriodQuery {
    constructor(periodId) {
        super(periodId, 'primary');
    }
}
exports.GetPrimaryEvaluatorsByPeriodQuery = GetPrimaryEvaluatorsByPeriodQuery;
class GetPrimaryEvaluatorsByPeriodHandler extends GetEvaluatorsByPeriodHandler {
}
exports.GetPrimaryEvaluatorsByPeriodHandler = GetPrimaryEvaluatorsByPeriodHandler;
//# sourceMappingURL=get-evaluators-by-period.handler.js.map