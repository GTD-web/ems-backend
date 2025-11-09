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
var ClearSeedDataHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClearSeedDataHandler = exports.ClearSeedDataCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const types_1 = require("../../types");
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
class ClearSeedDataCommand {
    scenario;
    constructor(scenario) {
        this.scenario = scenario;
    }
}
exports.ClearSeedDataCommand = ClearSeedDataCommand;
let ClearSeedDataHandler = ClearSeedDataHandler_1 = class ClearSeedDataHandler {
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
    logger = new common_1.Logger(ClearSeedDataHandler_1.name);
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
    async execute(command) {
        const scenario = command.scenario || types_1.SeedScenario.FULL;
        this.logger.log(`시드 데이터 삭제 시작 - 시나리오: ${scenario}`);
        try {
            switch (scenario) {
                case types_1.SeedScenario.MINIMAL:
                    await this.clearPhase1();
                    break;
                case types_1.SeedScenario.WITH_PERIOD:
                    await this.clearPhase2();
                    await this.clearPhase1();
                    break;
                case types_1.SeedScenario.WITH_ASSIGNMENTS:
                    await this.clearPhase3();
                    await this.clearPhase2();
                    await this.clearPhase1();
                    break;
                case types_1.SeedScenario.WITH_SETUP:
                    await this.clearPhase6();
                    await this.clearPhase5();
                    await this.clearPhase4();
                    await this.clearPhase3();
                    await this.clearPhase2();
                    await this.clearPhase1();
                    break;
                case types_1.SeedScenario.FULL:
                    await this.clearPhase8();
                    await this.clearPhase7();
                    await this.clearPhase6();
                    await this.clearPhase5();
                    await this.clearPhase4();
                    await this.clearPhase3();
                    await this.clearPhase2();
                    await this.clearPhase1();
                    break;
            }
            this.logger.log('시드 데이터 삭제 완료');
        }
        catch (error) {
            this.logger.error('시드 데이터 삭제 실패', error.stack);
            throw error;
        }
    }
    async clearPhase1() {
        this.logger.log('Phase 1 데이터 삭제 중...');
        await this.wbsItemRepository.createQueryBuilder().delete().execute();
        this.logger.log('WbsItem 삭제 완료');
        await this.projectRepository.createQueryBuilder().delete().execute();
        this.logger.log('Project 삭제 완료');
        await this.employeeRepository.createQueryBuilder().delete().execute();
        this.logger.log('Employee 삭제 완료');
        await this.departmentRepository.createQueryBuilder().delete().execute();
        this.logger.log('Department 삭제 완료');
    }
    async clearPhase2() {
        this.logger.log('Phase 2 데이터 삭제 중...');
        await this.mappingRepository.createQueryBuilder().delete().execute();
        this.logger.log('EvaluationPeriodEmployeeMapping 삭제 완료');
        await this.periodRepository.createQueryBuilder().delete().execute();
        this.logger.log('EvaluationPeriod 삭제 완료');
    }
    async clearPhase3() {
        this.logger.log('Phase 3 데이터 삭제 중...');
        await this.wbsAssignmentRepository.createQueryBuilder().delete().execute();
        this.logger.log('EvaluationWbsAssignment 삭제 완료');
        await this.projectAssignmentRepository
            .createQueryBuilder()
            .delete()
            .execute();
        this.logger.log('EvaluationProjectAssignment 삭제 완료');
    }
    async clearPhase4() {
        this.logger.log('Phase 4 데이터 삭제 중...');
        await this.evaluationLineMappingRepository
            .createQueryBuilder()
            .delete()
            .execute();
        this.logger.log('EvaluationLineMapping 삭제 완료');
        await this.evaluationLineRepository.createQueryBuilder().delete().execute();
        this.logger.log('EvaluationLine 삭제 완료');
        await this.wbsCriteriaRepository.createQueryBuilder().delete().execute();
        this.logger.log('WbsEvaluationCriteria 삭제 완료');
    }
    async clearPhase5() {
        this.logger.log('Phase 5 데이터 삭제 중...');
        await this.deliverableRepository.createQueryBuilder().delete().execute();
        this.logger.log('Deliverable 삭제 완료');
    }
    async clearPhase6() {
        this.logger.log('Phase 6 데이터 삭제 중...');
        await this.questionGroupMappingRepository
            .createQueryBuilder()
            .delete()
            .execute();
        this.logger.log('QuestionGroupMapping 삭제 완료');
        await this.evaluationQuestionRepository
            .createQueryBuilder()
            .delete()
            .execute();
        this.logger.log('EvaluationQuestion 삭제 완료');
        await this.questionGroupRepository.createQueryBuilder().delete().execute();
        this.logger.log('QuestionGroup 삭제 완료');
    }
    async clearPhase7() {
        this.logger.log('Phase 7 데이터 삭제 중...');
        await this.finalEvaluationRepository
            .createQueryBuilder()
            .delete()
            .execute();
        this.logger.log('FinalEvaluation 삭제 완료');
        await this.peerEvaluationRepository.createQueryBuilder().delete().execute();
        this.logger.log('PeerEvaluation 삭제 완료');
        await this.downwardEvaluationRepository
            .createQueryBuilder()
            .delete()
            .execute();
        this.logger.log('DownwardEvaluation 삭제 완료');
        await this.wbsSelfEvaluationRepository
            .createQueryBuilder()
            .delete()
            .execute();
        this.logger.log('WbsSelfEvaluation 삭제 완료');
    }
    async clearPhase8() {
        this.logger.log('Phase 8 데이터 삭제 중...');
        await this.evaluationResponseRepository
            .createQueryBuilder()
            .delete()
            .execute();
        this.logger.log('EvaluationResponse 삭제 완료');
    }
};
exports.ClearSeedDataHandler = ClearSeedDataHandler;
exports.ClearSeedDataHandler = ClearSeedDataHandler = ClearSeedDataHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(ClearSeedDataCommand),
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
], ClearSeedDataHandler);
//# sourceMappingURL=clear-seed-data.command.js.map