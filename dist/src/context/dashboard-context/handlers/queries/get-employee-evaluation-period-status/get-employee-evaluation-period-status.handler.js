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
var GetEmployeeEvaluationPeriodStatusHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEmployeeEvaluationPeriodStatusHandler = exports.GetEmployeeEvaluationPeriodStatusQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_period_employee_mapping_entity_1 = require("../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const evaluation_period_entity_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.entity");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const evaluation_project_assignment_entity_1 = require("../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const evaluation_wbs_assignment_entity_1 = require("../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const wbs_evaluation_criteria_entity_1 = require("../../../../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity");
const evaluation_line_entity_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.entity");
const evaluation_line_mapping_entity_1 = require("../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
const wbs_self_evaluation_entity_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.entity");
const downward_evaluation_entity_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.entity");
const peer_evaluation_entity_1 = require("../../../../../domain/core/peer-evaluation/peer-evaluation.entity");
const final_evaluation_entity_1 = require("../../../../../domain/core/final-evaluation/final-evaluation.entity");
const employee_evaluation_step_approval_1 = require("../../../../../domain/sub/employee-evaluation-step-approval");
const evaluation_revision_request_entity_1 = require("../../../../../domain/sub/evaluation-revision-request/evaluation-revision-request.entity");
const evaluation_revision_request_recipient_entity_1 = require("../../../../../domain/sub/evaluation-revision-request/evaluation-revision-request-recipient.entity");
const step_approval_utils_1 = require("./step-approval.utils");
const evaluation_criteria_utils_1 = require("./evaluation-criteria.utils");
const evaluation_line_utils_1 = require("./evaluation-line.utils");
const performance_input_utils_1 = require("./performance-input.utils");
const self_evaluation_utils_1 = require("./self-evaluation.utils");
const downward_evaluation_utils_1 = require("./downward-evaluation.utils");
const peer_evaluation_utils_1 = require("./peer-evaluation.utils");
const final_evaluation_utils_1 = require("./final-evaluation.utils");
class GetEmployeeEvaluationPeriodStatusQuery {
    evaluationPeriodId;
    employeeId;
    includeUnregistered;
    constructor(evaluationPeriodId, employeeId, includeUnregistered = false) {
        this.evaluationPeriodId = evaluationPeriodId;
        this.employeeId = employeeId;
        this.includeUnregistered = includeUnregistered;
    }
}
exports.GetEmployeeEvaluationPeriodStatusQuery = GetEmployeeEvaluationPeriodStatusQuery;
let GetEmployeeEvaluationPeriodStatusHandler = GetEmployeeEvaluationPeriodStatusHandler_1 = class GetEmployeeEvaluationPeriodStatusHandler {
    mappingRepository;
    periodRepository;
    employeeRepository;
    projectAssignmentRepository;
    wbsAssignmentRepository;
    wbsCriteriaRepository;
    evaluationLineRepository;
    evaluationLineMappingRepository;
    wbsSelfEvaluationRepository;
    downwardEvaluationRepository;
    peerEvaluationRepository;
    finalEvaluationRepository;
    revisionRequestRepository;
    revisionRequestRecipientRepository;
    stepApprovalService;
    logger = new common_1.Logger(GetEmployeeEvaluationPeriodStatusHandler_1.name);
    constructor(mappingRepository, periodRepository, employeeRepository, projectAssignmentRepository, wbsAssignmentRepository, wbsCriteriaRepository, evaluationLineRepository, evaluationLineMappingRepository, wbsSelfEvaluationRepository, downwardEvaluationRepository, peerEvaluationRepository, finalEvaluationRepository, revisionRequestRepository, revisionRequestRecipientRepository, stepApprovalService) {
        this.mappingRepository = mappingRepository;
        this.periodRepository = periodRepository;
        this.employeeRepository = employeeRepository;
        this.projectAssignmentRepository = projectAssignmentRepository;
        this.wbsAssignmentRepository = wbsAssignmentRepository;
        this.wbsCriteriaRepository = wbsCriteriaRepository;
        this.evaluationLineRepository = evaluationLineRepository;
        this.evaluationLineMappingRepository = evaluationLineMappingRepository;
        this.wbsSelfEvaluationRepository = wbsSelfEvaluationRepository;
        this.downwardEvaluationRepository = downwardEvaluationRepository;
        this.peerEvaluationRepository = peerEvaluationRepository;
        this.finalEvaluationRepository = finalEvaluationRepository;
        this.revisionRequestRepository = revisionRequestRepository;
        this.revisionRequestRecipientRepository = revisionRequestRecipientRepository;
        this.stepApprovalService = stepApprovalService;
    }
    async execute(query) {
        const { evaluationPeriodId, employeeId, includeUnregistered } = query;
        this.logger.debug(`직원의 평가기간 현황 조회 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
        try {
            const queryBuilder = this.mappingRepository
                .createQueryBuilder('mapping')
                .leftJoin(evaluation_period_entity_1.EvaluationPeriod, 'period', 'period.id = mapping.evaluationPeriodId AND period.deletedAt IS NULL')
                .leftJoin(employee_entity_1.Employee, 'employee', 'employee.id = mapping.employeeId AND employee.deletedAt IS NULL')
                .select([
                'mapping.id AS mapping_id',
                'mapping.evaluationPeriodId AS mapping_evaluationperiodid',
                'mapping.employeeId AS mapping_employeeid',
                'mapping.isExcluded AS mapping_isexcluded',
                'mapping.excludeReason AS mapping_excludereason',
                'mapping.excludedAt AS mapping_excludedat',
                'mapping.deletedAt AS mapping_deletedat',
                'period.name AS period_name',
                'period.status AS period_status',
                'period.currentPhase AS period_currentphase',
                'period.startDate AS period_startdate',
                'period.endDate AS period_enddate',
                'period.criteriaSettingEnabled AS period_criteriasettingenabled',
                'period.selfEvaluationSettingEnabled AS period_selfevaluationsettingenabled',
                'period.finalEvaluationSettingEnabled AS period_finalevaluationsettingenabled',
                'employee.name AS employee_name',
                'employee.employeeNumber AS employee_employeenumber',
                'employee.email AS employee_email',
                'employee.departmentName AS employee_departmentname',
                'employee.rankName AS employee_rankname',
            ])
                .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
                evaluationPeriodId,
            })
                .andWhere('mapping.employeeId = :employeeId', { employeeId });
            if (includeUnregistered) {
                queryBuilder.withDeleted();
            }
            const result = await queryBuilder.getRawOne();
            if (!result) {
                this.logger.debug(`맵핑 정보를 찾을 수 없습니다 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
                return null;
            }
            const projectCount = await this.projectAssignmentRepository.count({
                where: {
                    periodId: evaluationPeriodId,
                    employeeId: employeeId,
                    deletedAt: (0, typeorm_2.IsNull)(),
                },
            });
            const wbsCount = await this.wbsAssignmentRepository.count({
                where: {
                    periodId: evaluationPeriodId,
                    employeeId: employeeId,
                    deletedAt: (0, typeorm_2.IsNull)(),
                },
            });
            const evaluationCriteriaStatus = (0, evaluation_criteria_utils_1.평가항목_상태를_계산한다)(projectCount, wbsCount);
            const assignedWbsList = await this.wbsAssignmentRepository.find({
                where: {
                    periodId: evaluationPeriodId,
                    employeeId: employeeId,
                    deletedAt: (0, typeorm_2.IsNull)(),
                },
                select: ['wbsItemId'],
            });
            let wbsWithCriteriaCount = 0;
            if (assignedWbsList.length > 0) {
                const wbsItemIds = assignedWbsList.map((wbs) => wbs.wbsItemId);
                const distinctWbsIdsWithCriteria = await this.wbsCriteriaRepository
                    .createQueryBuilder('criteria')
                    .select('DISTINCT criteria.wbsItemId', 'wbsItemId')
                    .where('criteria.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
                    .andWhere('criteria.deletedAt IS NULL')
                    .getRawMany();
                wbsWithCriteriaCount = distinctWbsIdsWithCriteria.length;
            }
            const wbsCriteriaStatus = (0, evaluation_criteria_utils_1.WBS평가기준_상태를_계산한다)(wbsCount, wbsWithCriteriaCount);
            const { hasPrimaryEvaluator, hasSecondaryEvaluator } = await (0, evaluation_line_utils_1.평가라인_지정_여부를_확인한다)(evaluationPeriodId, employeeId, this.evaluationLineRepository, this.evaluationLineMappingRepository);
            const evaluationLineStatus = (0, evaluation_line_utils_1.평가라인_상태를_계산한다)(hasPrimaryEvaluator, hasSecondaryEvaluator);
            const { totalWbsCount: perfTotalWbsCount, inputCompletedCount } = await (0, performance_input_utils_1.성과입력_상태를_조회한다)(evaluationPeriodId, employeeId, this.wbsSelfEvaluationRepository);
            const performanceInputStatus = (0, performance_input_utils_1.성과입력_상태를_계산한다)(perfTotalWbsCount, inputCompletedCount);
            const { totalMappingCount, completedMappingCount, submittedToEvaluatorCount, isSubmittedToEvaluator, totalScore, grade, } = await (0, self_evaluation_utils_1.자기평가_진행_상태를_조회한다)(evaluationPeriodId, employeeId, this.wbsSelfEvaluationRepository, this.wbsAssignmentRepository, this.periodRepository);
            const selfEvaluationStatus = (0, self_evaluation_utils_1.자기평가_상태를_계산한다)(totalMappingCount, completedMappingCount);
            const { primary, secondary } = await (0, downward_evaluation_utils_1.하향평가_상태를_조회한다)(evaluationPeriodId, employeeId, this.evaluationLineRepository, this.evaluationLineMappingRepository, this.downwardEvaluationRepository, this.wbsAssignmentRepository, this.periodRepository, this.employeeRepository);
            const { totalRequestCount, completedRequestCount } = await (0, peer_evaluation_utils_1.동료평가_상태를_조회한다)(evaluationPeriodId, employeeId, this.peerEvaluationRepository);
            const peerEvaluationStatus = (0, peer_evaluation_utils_1.동료평가_상태를_계산한다)(totalRequestCount, completedRequestCount);
            const finalEvaluation = await (0, final_evaluation_utils_1.최종평가를_조회한다)(evaluationPeriodId, employeeId, this.finalEvaluationRepository);
            const finalEvaluationStatus = (0, final_evaluation_utils_1.최종평가_상태를_계산한다)(finalEvaluation);
            const stepApproval = await this.stepApprovalService.맵핑ID로_조회한다(result.mapping_id);
            const validSecondaryEvaluators = secondary.evaluators.filter((e) => e.evaluator && e.evaluator.id);
            const secondaryEvaluatorIds = validSecondaryEvaluators.map((e) => e.evaluator.id);
            const secondaryEvaluationStatuses = await (0, step_approval_utils_1.평가자들별_2차평가_단계승인_상태를_조회한다)(evaluationPeriodId, employeeId, secondaryEvaluatorIds, this.revisionRequestRepository, this.revisionRequestRecipientRepository);
            const secondaryEvaluationStatusesWithEvaluatorInfo = validSecondaryEvaluators
                .map((evaluatorInfo) => {
                if (!evaluatorInfo.evaluator || !evaluatorInfo.evaluator.id) {
                    return null;
                }
                const statusInfo = secondaryEvaluationStatuses.find((s) => s.evaluatorId === evaluatorInfo.evaluator.id);
                let finalStatus;
                let approvedBy = null;
                let approvedAt = null;
                if (statusInfo && statusInfo.revisionRequestId !== null) {
                    if (statusInfo.isCompleted) {
                        finalStatus = 'revision_completed';
                    }
                    else if (statusInfo.status === 'revision_requested') {
                        finalStatus = 'revision_requested';
                    }
                    else {
                        finalStatus = 'revision_requested';
                    }
                }
                else {
                    if (stepApproval?.secondaryEvaluationStatus === 'approved') {
                        finalStatus = 'approved';
                        approvedBy = stepApproval.secondaryEvaluationApprovedBy;
                        approvedAt = stepApproval.secondaryEvaluationApprovedAt;
                    }
                    else {
                        finalStatus = 'pending';
                    }
                }
                return {
                    evaluatorId: evaluatorInfo.evaluator.id,
                    evaluatorName: evaluatorInfo.evaluator.name || '알 수 없음',
                    evaluatorEmployeeNumber: evaluatorInfo.evaluator.employeeNumber || 'N/A',
                    evaluatorEmail: evaluatorInfo.evaluator.email || 'N/A',
                    status: finalStatus,
                    approvedBy,
                    approvedAt,
                    revisionRequestId: statusInfo?.revisionRequestId ?? null,
                    revisionComment: statusInfo?.revisionComment ?? null,
                    isRevisionCompleted: statusInfo?.isCompleted ?? false,
                    revisionCompletedAt: statusInfo?.completedAt ?? null,
                    responseComment: statusInfo?.responseComment ?? null,
                };
            })
                .filter((item) => item !== null);
            const allSecondaryCompleted = secondaryEvaluationStatusesWithEvaluatorInfo.length > 0 &&
                secondaryEvaluationStatusesWithEvaluatorInfo.every((s) => s.status === 'approved' ||
                    s.status === 'revision_completed' ||
                    (s.status === 'revision_requested' && s.isRevisionCompleted));
            const allSecondaryApproved = secondaryEvaluationStatusesWithEvaluatorInfo.length > 0 &&
                secondaryEvaluationStatusesWithEvaluatorInfo.every((s) => s.status === 'approved');
            const finalSecondaryStatus = allSecondaryApproved
                ? 'approved'
                : allSecondaryCompleted
                    ? 'revision_completed'
                    : secondaryEvaluationStatusesWithEvaluatorInfo.some((s) => s.status === 'revision_requested')
                        ? 'revision_requested'
                        : 'pending';
            const isEvaluationTarget = !result.mapping_isexcluded && !result.mapping_deletedat;
            const dto = {
                mappingId: result.mapping_id,
                employeeId: result.mapping_employeeid,
                isEvaluationTarget,
                evaluationPeriod: result.period_name
                    ? {
                        id: result.mapping_evaluationperiodid,
                        name: result.period_name,
                        status: result.period_status,
                        currentPhase: result.period_currentphase,
                        startDate: result.period_startdate,
                        endDate: result.period_enddate,
                        manualSettings: {
                            criteriaSettingEnabled: result.period_criteriasettingenabled || false,
                            selfEvaluationSettingEnabled: result.period_selfevaluationsettingenabled || false,
                            finalEvaluationSettingEnabled: result.period_finalevaluationsettingenabled || false,
                        },
                    }
                    : null,
                employee: result.employee_name
                    ? {
                        id: result.mapping_employeeid,
                        name: result.employee_name,
                        employeeNumber: result.employee_employeenumber,
                        email: result.employee_email,
                        departmentName: result.employee_departmentname,
                        rankName: result.employee_rankname,
                    }
                    : null,
                exclusionInfo: {
                    isExcluded: result.mapping_isexcluded,
                    excludeReason: result.mapping_excludereason,
                    excludedAt: result.mapping_excludedat,
                },
                evaluationCriteria: {
                    status: evaluationCriteriaStatus,
                    assignedProjectCount: projectCount,
                    assignedWbsCount: wbsCount,
                },
                wbsCriteria: {
                    status: wbsCriteriaStatus,
                    wbsWithCriteriaCount,
                },
                evaluationLine: {
                    status: evaluationLineStatus,
                    hasPrimaryEvaluator,
                    hasSecondaryEvaluator,
                },
                criteriaSetup: {
                    status: (0, evaluation_criteria_utils_1.평가기준설정_상태를_계산한다)(evaluationCriteriaStatus, wbsCriteriaStatus, evaluationLineStatus, stepApproval?.criteriaSettingStatus ?? null),
                    evaluationCriteria: {
                        status: evaluationCriteriaStatus,
                        assignedProjectCount: projectCount,
                        assignedWbsCount: wbsCount,
                    },
                    wbsCriteria: {
                        status: wbsCriteriaStatus,
                        wbsWithCriteriaCount,
                    },
                    evaluationLine: {
                        status: evaluationLineStatus,
                        hasPrimaryEvaluator,
                        hasSecondaryEvaluator,
                    },
                },
                performanceInput: {
                    status: performanceInputStatus,
                    totalWbsCount: perfTotalWbsCount,
                    inputCompletedCount,
                },
                selfEvaluation: {
                    status: selfEvaluationStatus,
                    totalMappingCount,
                    completedMappingCount,
                    isSubmittedToEvaluator,
                    totalScore,
                    grade,
                },
                downwardEvaluation: {
                    primary: {
                        evaluator: primary.evaluator,
                        status: (0, downward_evaluation_utils_1.하향평가_통합_상태를_계산한다)(primary.status, stepApproval?.primaryEvaluationStatus ?? 'pending'),
                        assignedWbsCount: primary.assignedWbsCount,
                        completedEvaluationCount: primary.completedEvaluationCount,
                        isSubmitted: primary.isSubmitted,
                        totalScore: primary.totalScore,
                        grade: primary.grade,
                    },
                    secondary: {
                        evaluators: secondary.evaluators.map((evaluatorInfo) => {
                            const approvalInfo = secondaryEvaluationStatusesWithEvaluatorInfo.find((s) => s.evaluatorId === evaluatorInfo.evaluator.id);
                            return {
                                evaluator: evaluatorInfo.evaluator,
                                status: (0, downward_evaluation_utils_1.하향평가_통합_상태를_계산한다)(evaluatorInfo.status, approvalInfo?.status ?? 'pending'),
                                assignedWbsCount: evaluatorInfo.assignedWbsCount,
                                completedEvaluationCount: evaluatorInfo.completedEvaluationCount,
                                isSubmitted: evaluatorInfo.isSubmitted,
                            };
                        }),
                        status: (0, downward_evaluation_utils_1.이차평가_전체_상태를_계산한다)(secondary.evaluators.map((evaluatorInfo) => {
                            const approvalInfo = secondaryEvaluationStatusesWithEvaluatorInfo.find((s) => s.evaluatorId === evaluatorInfo.evaluator.id);
                            return (0, downward_evaluation_utils_1.하향평가_통합_상태를_계산한다)(evaluatorInfo.status, approvalInfo?.status ?? 'pending');
                        })),
                        isSubmitted: secondary.isSubmitted,
                        totalScore: secondary.totalScore,
                        grade: secondary.grade,
                    },
                },
                peerEvaluation: {
                    status: peerEvaluationStatus,
                    totalRequestCount,
                    completedRequestCount,
                },
                finalEvaluation: {
                    status: finalEvaluationStatus,
                    evaluationGrade: finalEvaluation?.evaluationGrade ?? null,
                    jobGrade: finalEvaluation?.jobGrade ?? null,
                    jobDetailedGrade: finalEvaluation?.jobDetailedGrade ?? null,
                    isConfirmed: finalEvaluation?.isConfirmed ?? false,
                    confirmedAt: finalEvaluation?.confirmedAt ?? null,
                },
                stepApproval: {
                    criteriaSettingStatus: stepApproval?.criteriaSettingStatus ?? 'pending',
                    criteriaSettingApprovedBy: stepApproval?.criteriaSettingApprovedBy ?? null,
                    criteriaSettingApprovedAt: stepApproval?.criteriaSettingApprovedAt ?? null,
                    selfEvaluationStatus: stepApproval?.selfEvaluationStatus ?? 'pending',
                    selfEvaluationApprovedBy: stepApproval?.selfEvaluationApprovedBy ?? null,
                    selfEvaluationApprovedAt: stepApproval?.selfEvaluationApprovedAt ?? null,
                    primaryEvaluationStatus: stepApproval?.primaryEvaluationStatus ?? 'pending',
                    primaryEvaluationApprovedBy: stepApproval?.primaryEvaluationApprovedBy ?? null,
                    primaryEvaluationApprovedAt: stepApproval?.primaryEvaluationApprovedAt ?? null,
                    secondaryEvaluationStatuses: secondaryEvaluationStatusesWithEvaluatorInfo,
                    secondaryEvaluationStatus: finalSecondaryStatus,
                    secondaryEvaluationApprovedBy: finalSecondaryStatus === 'approved'
                        ? (stepApproval?.secondaryEvaluationApprovedBy ?? null)
                        : null,
                    secondaryEvaluationApprovedAt: finalSecondaryStatus === 'approved'
                        ? (stepApproval?.secondaryEvaluationApprovedAt ?? null)
                        : null,
                },
            };
            const secondaryLog = secondary.evaluators.length > 0
                ? secondary.evaluators
                    .map((s) => `평가자${s.evaluator.id}: ${s.completedEvaluationCount}/${s.assignedWbsCount} (${s.status})`)
                    .join(', ')
                : '없음';
            const finalEvaluationLog = finalEvaluation
                ? `${finalEvaluation.evaluationGrade}/${finalEvaluation.jobGrade}${finalEvaluation.jobDetailedGrade} (확정: ${finalEvaluation.isConfirmed})`
                : '없음';
            this.logger.debug(`직원의 평가기간 현황 조회 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, ` +
                `프로젝트: ${projectCount}, WBS: ${wbsCount}, 평가항목상태: ${evaluationCriteriaStatus}, ` +
                `평가기준있는WBS: ${wbsWithCriteriaCount}/${wbsCount}, 평가기준상태: ${wbsCriteriaStatus}, ` +
                `PRIMARY평가자: ${hasPrimaryEvaluator}, SECONDARY평가자: ${hasSecondaryEvaluator}, 평가라인상태: ${evaluationLineStatus}, ` +
                `성과입력: ${inputCompletedCount}/${perfTotalWbsCount} (${performanceInputStatus}), ` +
                `자기평가: ${completedMappingCount}/${totalMappingCount} (${selfEvaluationStatus}, 총점: ${totalScore?.toFixed(2) ?? 'N/A'}, 등급: ${grade ?? 'N/A'}), ` +
                `1차하향평가(${primary.evaluator?.id ?? 'N/A'}): ${primary.completedEvaluationCount}/${primary.assignedWbsCount} (${primary.status}, 총점: ${primary.totalScore?.toFixed(2) ?? 'N/A'}, 등급: ${primary.grade ?? 'N/A'}), ` +
                `2차하향평가: [${secondaryLog}] (총점: ${secondary.totalScore?.toFixed(2) ?? 'N/A'}, 등급: ${secondary.grade ?? 'N/A'}), ` +
                `동료평가: ${completedRequestCount}/${totalRequestCount} (${peerEvaluationStatus}), ` +
                `최종평가: ${finalEvaluationLog} (${finalEvaluationStatus})`);
            return dto;
        }
        catch (error) {
            this.logger.error(`직원의 평가기간 현황 조회 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`, error.stack);
            throw error;
        }
    }
};
exports.GetEmployeeEvaluationPeriodStatusHandler = GetEmployeeEvaluationPeriodStatusHandler;
exports.GetEmployeeEvaluationPeriodStatusHandler = GetEmployeeEvaluationPeriodStatusHandler = GetEmployeeEvaluationPeriodStatusHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetEmployeeEvaluationPeriodStatusQuery),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping)),
    __param(1, (0, typeorm_1.InjectRepository)(evaluation_period_entity_1.EvaluationPeriod)),
    __param(2, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(3, (0, typeorm_1.InjectRepository)(evaluation_project_assignment_entity_1.EvaluationProjectAssignment)),
    __param(4, (0, typeorm_1.InjectRepository)(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)),
    __param(5, (0, typeorm_1.InjectRepository)(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria)),
    __param(6, (0, typeorm_1.InjectRepository)(evaluation_line_entity_1.EvaluationLine)),
    __param(7, (0, typeorm_1.InjectRepository)(evaluation_line_mapping_entity_1.EvaluationLineMapping)),
    __param(8, (0, typeorm_1.InjectRepository)(wbs_self_evaluation_entity_1.WbsSelfEvaluation)),
    __param(9, (0, typeorm_1.InjectRepository)(downward_evaluation_entity_1.DownwardEvaluation)),
    __param(10, (0, typeorm_1.InjectRepository)(peer_evaluation_entity_1.PeerEvaluation)),
    __param(11, (0, typeorm_1.InjectRepository)(final_evaluation_entity_1.FinalEvaluation)),
    __param(12, (0, typeorm_1.InjectRepository)(evaluation_revision_request_entity_1.EvaluationRevisionRequest)),
    __param(13, (0, typeorm_1.InjectRepository)(evaluation_revision_request_recipient_entity_1.EvaluationRevisionRequestRecipient)),
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
        employee_evaluation_step_approval_1.EmployeeEvaluationStepApprovalService])
], GetEmployeeEvaluationPeriodStatusHandler);
//# sourceMappingURL=get-employee-evaluation-period-status.handler.js.map