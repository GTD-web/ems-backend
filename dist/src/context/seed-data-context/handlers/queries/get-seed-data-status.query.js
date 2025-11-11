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
var GetSeedDataStatusHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSeedDataStatusHandler = exports.GetSeedDataStatusQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const department_entity_1 = require("../../../../domain/common/department/department.entity");
const employee_entity_1 = require("../../../../domain/common/employee/employee.entity");
const project_entity_1 = require("../../../../domain/common/project/project.entity");
const wbs_item_entity_1 = require("../../../../domain/common/wbs-item/wbs-item.entity");
const evaluation_period_entity_1 = require("../../../../domain/core/evaluation-period/evaluation-period.entity");
const evaluation_period_employee_mapping_entity_1 = require("../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const evaluation_project_assignment_entity_1 = require("../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const evaluation_wbs_assignment_entity_1 = require("../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const wbs_evaluation_criteria_entity_1 = require("../../../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity");
const evaluation_line_entity_1 = require("../../../../domain/core/evaluation-line/evaluation-line.entity");
const evaluation_line_mapping_entity_1 = require("../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
const deliverable_entity_1 = require("../../../../domain/core/deliverable/deliverable.entity");
const question_group_entity_1 = require("../../../../domain/sub/question-group/question-group.entity");
const evaluation_question_entity_1 = require("../../../../domain/sub/evaluation-question/evaluation-question.entity");
const question_group_mapping_entity_1 = require("../../../../domain/sub/question-group-mapping/question-group-mapping.entity");
const wbs_self_evaluation_entity_1 = require("../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.entity");
const downward_evaluation_entity_1 = require("../../../../domain/core/downward-evaluation/downward-evaluation.entity");
const peer_evaluation_entity_1 = require("../../../../domain/core/peer-evaluation/peer-evaluation.entity");
const final_evaluation_entity_1 = require("../../../../domain/core/final-evaluation/final-evaluation.entity");
const evaluation_response_entity_1 = require("../../../../domain/sub/evaluation-response/evaluation-response.entity");
class GetSeedDataStatusQuery {
}
exports.GetSeedDataStatusQuery = GetSeedDataStatusQuery;
let GetSeedDataStatusHandler = GetSeedDataStatusHandler_1 = class GetSeedDataStatusHandler {
    departmentRepository;
    employeeRepository;
    projectRepository;
    wbsItemRepository;
    periodRepository;
    mappingRepository;
    projectAssignmentRepository;
    wbsAssignmentRepository;
    wbsCriteriaRepository;
    evaluationLineRepository;
    evaluationLineMappingRepository;
    deliverableRepository;
    questionGroupRepository;
    evaluationQuestionRepository;
    questionGroupMappingRepository;
    wbsSelfEvaluationRepository;
    downwardEvaluationRepository;
    peerEvaluationRepository;
    finalEvaluationRepository;
    evaluationResponseRepository;
    logger = new common_1.Logger(GetSeedDataStatusHandler_1.name);
    constructor(departmentRepository, employeeRepository, projectRepository, wbsItemRepository, periodRepository, mappingRepository, projectAssignmentRepository, wbsAssignmentRepository, wbsCriteriaRepository, evaluationLineRepository, evaluationLineMappingRepository, deliverableRepository, questionGroupRepository, evaluationQuestionRepository, questionGroupMappingRepository, wbsSelfEvaluationRepository, downwardEvaluationRepository, peerEvaluationRepository, finalEvaluationRepository, evaluationResponseRepository) {
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
        this.projectRepository = projectRepository;
        this.wbsItemRepository = wbsItemRepository;
        this.periodRepository = periodRepository;
        this.mappingRepository = mappingRepository;
        this.projectAssignmentRepository = projectAssignmentRepository;
        this.wbsAssignmentRepository = wbsAssignmentRepository;
        this.wbsCriteriaRepository = wbsCriteriaRepository;
        this.evaluationLineRepository = evaluationLineRepository;
        this.evaluationLineMappingRepository = evaluationLineMappingRepository;
        this.deliverableRepository = deliverableRepository;
        this.questionGroupRepository = questionGroupRepository;
        this.evaluationQuestionRepository = evaluationQuestionRepository;
        this.questionGroupMappingRepository = questionGroupMappingRepository;
        this.wbsSelfEvaluationRepository = wbsSelfEvaluationRepository;
        this.downwardEvaluationRepository = downwardEvaluationRepository;
        this.peerEvaluationRepository = peerEvaluationRepository;
        this.finalEvaluationRepository = finalEvaluationRepository;
        this.evaluationResponseRepository = evaluationResponseRepository;
    }
    async execute(query) {
        this.logger.log('시드 데이터 상태 조회');
        const counts = await Promise.all([
            this.departmentRepository.count(),
            this.employeeRepository.count(),
            this.projectRepository.count(),
            this.wbsItemRepository.count(),
            this.periodRepository.count(),
            this.mappingRepository.count(),
            this.projectAssignmentRepository.count(),
            this.wbsAssignmentRepository.count(),
            this.wbsCriteriaRepository.count(),
            this.evaluationLineRepository.count(),
            this.evaluationLineMappingRepository.count(),
            this.deliverableRepository.count(),
            this.questionGroupRepository.count(),
            this.evaluationQuestionRepository.count(),
            this.questionGroupMappingRepository.count(),
            this.wbsSelfEvaluationRepository.count(),
            this.downwardEvaluationRepository.count(),
            this.peerEvaluationRepository.count(),
            this.finalEvaluationRepository.count(),
            this.evaluationResponseRepository.count(),
        ]);
        const entityCounts = {
            Department: counts[0],
            Employee: counts[1],
            Project: counts[2],
            WbsItem: counts[3],
            EvaluationPeriod: counts[4],
            EvaluationPeriodEmployeeMapping: counts[5],
            EvaluationProjectAssignment: counts[6],
            EvaluationWbsAssignment: counts[7],
            WbsEvaluationCriteria: counts[8],
            EvaluationLine: counts[9],
            EvaluationLineMapping: counts[10],
            Deliverable: counts[11],
            QuestionGroup: counts[12],
            EvaluationQuestion: counts[13],
            QuestionGroupMapping: counts[14],
            WbsSelfEvaluation: counts[15],
            DownwardEvaluation: counts[16],
            PeerEvaluation: counts[17],
            FinalEvaluation: counts[18],
            EvaluationResponse: counts[19],
        };
        const hasData = Object.values(entityCounts).some((count) => count > 0);
        return {
            hasData,
            entityCounts,
        };
    }
};
exports.GetSeedDataStatusHandler = GetSeedDataStatusHandler;
exports.GetSeedDataStatusHandler = GetSeedDataStatusHandler = GetSeedDataStatusHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetSeedDataStatusQuery),
    __param(0, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __param(1, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(2, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(3, (0, typeorm_1.InjectRepository)(wbs_item_entity_1.WbsItem)),
    __param(4, (0, typeorm_1.InjectRepository)(evaluation_period_entity_1.EvaluationPeriod)),
    __param(5, (0, typeorm_1.InjectRepository)(evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping)),
    __param(6, (0, typeorm_1.InjectRepository)(evaluation_project_assignment_entity_1.EvaluationProjectAssignment)),
    __param(7, (0, typeorm_1.InjectRepository)(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)),
    __param(8, (0, typeorm_1.InjectRepository)(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria)),
    __param(9, (0, typeorm_1.InjectRepository)(evaluation_line_entity_1.EvaluationLine)),
    __param(10, (0, typeorm_1.InjectRepository)(evaluation_line_mapping_entity_1.EvaluationLineMapping)),
    __param(11, (0, typeorm_1.InjectRepository)(deliverable_entity_1.Deliverable)),
    __param(12, (0, typeorm_1.InjectRepository)(question_group_entity_1.QuestionGroup)),
    __param(13, (0, typeorm_1.InjectRepository)(evaluation_question_entity_1.EvaluationQuestion)),
    __param(14, (0, typeorm_1.InjectRepository)(question_group_mapping_entity_1.QuestionGroupMapping)),
    __param(15, (0, typeorm_1.InjectRepository)(wbs_self_evaluation_entity_1.WbsSelfEvaluation)),
    __param(16, (0, typeorm_1.InjectRepository)(downward_evaluation_entity_1.DownwardEvaluation)),
    __param(17, (0, typeorm_1.InjectRepository)(peer_evaluation_entity_1.PeerEvaluation)),
    __param(18, (0, typeorm_1.InjectRepository)(final_evaluation_entity_1.FinalEvaluation)),
    __param(19, (0, typeorm_1.InjectRepository)(evaluation_response_entity_1.EvaluationResponse)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], GetSeedDataStatusHandler);
//# sourceMappingURL=get-seed-data-status.query.js.map