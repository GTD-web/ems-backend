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
var DeleteAllProjectAssignmentsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteAllProjectAssignmentsHandler = exports.DeleteAllProjectAssignmentsCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_project_assignment_entity_1 = require("../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const evaluation_project_assignment_service_1 = require("../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.service");
const evaluation_wbs_assignment_service_1 = require("../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service");
const wbs_self_evaluation_service_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.service");
const downward_evaluation_service_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.service");
const peer_evaluation_service_1 = require("../../../../../domain/core/peer-evaluation/peer-evaluation.service");
const evaluation_line_mapping_service_1 = require("../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.service");
const deliverable_service_1 = require("../../../../../domain/core/deliverable/deliverable.service");
const peer_evaluation_question_mapping_service_1 = require("../../../../../domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service");
class DeleteAllProjectAssignmentsCommand {
    deletedBy;
    constructor(deletedBy) {
        this.deletedBy = deletedBy;
    }
}
exports.DeleteAllProjectAssignmentsCommand = DeleteAllProjectAssignmentsCommand;
let DeleteAllProjectAssignmentsHandler = DeleteAllProjectAssignmentsHandler_1 = class DeleteAllProjectAssignmentsHandler {
    dataSource;
    projectAssignmentRepository;
    projectAssignmentService;
    wbsAssignmentService;
    selfEvaluationService;
    downwardEvaluationService;
    peerEvaluationService;
    evaluationLineMappingService;
    deliverableService;
    peerEvaluationQuestionMappingService;
    logger = new common_1.Logger(DeleteAllProjectAssignmentsHandler_1.name);
    constructor(dataSource, projectAssignmentRepository, projectAssignmentService, wbsAssignmentService, selfEvaluationService, downwardEvaluationService, peerEvaluationService, evaluationLineMappingService, deliverableService, peerEvaluationQuestionMappingService) {
        this.dataSource = dataSource;
        this.projectAssignmentRepository = projectAssignmentRepository;
        this.projectAssignmentService = projectAssignmentService;
        this.wbsAssignmentService = wbsAssignmentService;
        this.selfEvaluationService = selfEvaluationService;
        this.downwardEvaluationService = downwardEvaluationService;
        this.peerEvaluationService = peerEvaluationService;
        this.evaluationLineMappingService = evaluationLineMappingService;
        this.deliverableService = deliverableService;
        this.peerEvaluationQuestionMappingService = peerEvaluationQuestionMappingService;
    }
    async execute(command) {
        const { deletedBy } = command;
        this.logger.log('모든 프로젝트 할당 삭제 시작');
        return await this.dataSource.transaction(async (manager) => {
            const deletedCounts = {
                peerEvaluationQuestionMappings: 0,
                peerEvaluations: 0,
                downwardEvaluations: 0,
                selfEvaluations: 0,
                wbsAssignments: 0,
                projectAssignments: 0,
                evaluationLineMappings: 0,
                deliverableMappings: 0,
            };
            this.logger.log('1단계: 동료평가 질문 매핑 삭제 시작');
            const peerEvaluations = await this.peerEvaluationService.필터_조회한다({});
            for (const peerEval of peerEvaluations) {
                const mappings = await this.peerEvaluationQuestionMappingService.동료평가의_질문목록을_조회한다(peerEval.id);
                if (mappings.length > 0) {
                    await this.peerEvaluationQuestionMappingService.동료평가의_질문매핑을_전체삭제한다(peerEval.id, deletedBy);
                    deletedCounts.peerEvaluationQuestionMappings += mappings.length;
                }
            }
            this.logger.log('2단계: 동료평가 삭제 시작');
            for (const peerEval of peerEvaluations) {
                await this.peerEvaluationService.삭제한다(peerEval.id, deletedBy);
                deletedCounts.peerEvaluations++;
            }
            this.logger.log('3단계: 하향평가 삭제 시작');
            const downwardEvaluations = await this.downwardEvaluationService.필터_조회한다({});
            for (const downwardEval of downwardEvaluations) {
                await this.downwardEvaluationService.삭제한다(downwardEval.id, deletedBy);
                deletedCounts.downwardEvaluations++;
            }
            this.logger.log('4단계: 자기평가 삭제 시작');
            const selfEvaluations = await this.selfEvaluationService.필터_조회한다({});
            for (const selfEval of selfEvaluations) {
                await this.selfEvaluationService.삭제한다(selfEval.id, deletedBy);
                deletedCounts.selfEvaluations++;
            }
            this.logger.log('5단계: 산출물 매핑 해제 시작');
            const wbsAssignments = await this.wbsAssignmentService.필터_조회한다({}, manager);
            for (const wbsAssignment of wbsAssignments) {
                const deliverables = await this.deliverableService.필터_조회한다({
                    employeeId: wbsAssignment.employeeId,
                    wbsItemId: wbsAssignment.wbsItemId,
                });
                for (const deliverable of deliverables) {
                    if (deliverable.employeeId || deliverable.wbsItemId) {
                        await this.deliverableService.매핑을_해제한다(deliverable.id, deletedBy);
                        deletedCounts.deliverableMappings++;
                    }
                }
            }
            this.logger.log('6단계: WBS 할당 삭제 시작');
            for (const wbsAssignment of wbsAssignments) {
                await this.wbsAssignmentService.삭제한다(wbsAssignment.id, deletedBy, manager);
                deletedCounts.wbsAssignments++;
            }
            this.logger.log('7단계: 평가라인 매핑 삭제 시작');
            const evaluationLineMappings = await this.evaluationLineMappingService.필터_조회한다({}, manager);
            for (const mapping of evaluationLineMappings) {
                await this.evaluationLineMappingService.삭제한다(mapping.DTO로_변환한다().id, deletedBy, manager);
                deletedCounts.evaluationLineMappings++;
            }
            this.logger.log('8단계: 프로젝트 할당 삭제 시작');
            const projectAssignments = await this.projectAssignmentRepository.find();
            for (const projectAssignment of projectAssignments) {
                await this.projectAssignmentService.삭제한다(projectAssignment.id, deletedBy, manager, { skipValidation: true });
                deletedCounts.projectAssignments++;
            }
            this.logger.log('모든 프로젝트 할당 삭제 완료', {
                deletedCounts,
            });
            return {
                deletedCounts,
                message: '모든 프로젝트 할당 데이터가 성공적으로 삭제되었습니다.',
            };
        });
    }
};
exports.DeleteAllProjectAssignmentsHandler = DeleteAllProjectAssignmentsHandler;
exports.DeleteAllProjectAssignmentsHandler = DeleteAllProjectAssignmentsHandler = DeleteAllProjectAssignmentsHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(DeleteAllProjectAssignmentsCommand),
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __param(1, (0, typeorm_1.InjectRepository)(evaluation_project_assignment_entity_1.EvaluationProjectAssignment)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        typeorm_2.Repository,
        evaluation_project_assignment_service_1.EvaluationProjectAssignmentService,
        evaluation_wbs_assignment_service_1.EvaluationWbsAssignmentService,
        wbs_self_evaluation_service_1.WbsSelfEvaluationService,
        downward_evaluation_service_1.DownwardEvaluationService,
        peer_evaluation_service_1.PeerEvaluationService,
        evaluation_line_mapping_service_1.EvaluationLineMappingService,
        deliverable_service_1.DeliverableService,
        peer_evaluation_question_mapping_service_1.PeerEvaluationQuestionMappingService])
], DeleteAllProjectAssignmentsHandler);
//# sourceMappingURL=delete-all-project-assignments.handler.js.map