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
var ProjectAssignmentBusinessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectAssignmentBusinessService = void 0;
const common_1 = require("@nestjs/common");
const evaluation_criteria_management_service_1 = require("../../context/evaluation-criteria-management-context/evaluation-criteria-management.service");
const evaluation_activity_log_context_service_1 = require("../../context/evaluation-activity-log-context/evaluation-activity-log-context.service");
let ProjectAssignmentBusinessService = ProjectAssignmentBusinessService_1 = class ProjectAssignmentBusinessService {
    evaluationCriteriaManagementService;
    activityLogContextService;
    logger = new common_1.Logger(ProjectAssignmentBusinessService_1.name);
    constructor(evaluationCriteriaManagementService, activityLogContextService) {
        this.evaluationCriteriaManagementService = evaluationCriteriaManagementService;
        this.activityLogContextService = activityLogContextService;
    }
    async 프로젝트를_할당한다(data, assignedBy) {
        this.logger.log('프로젝트 할당 시작', {
            employeeId: data.employeeId,
            projectId: data.projectId,
            periodId: data.periodId,
        });
        const assignment = await this.evaluationCriteriaManagementService.프로젝트를_할당한다(data, assignedBy);
        try {
            await this.activityLogContextService.활동내역을_기록한다({
                periodId: data.periodId,
                employeeId: data.employeeId,
                activityType: 'project_assignment',
                activityAction: 'created',
                activityTitle: '프로젝트 할당',
                relatedEntityType: 'project_assignment',
                relatedEntityId: assignment.id,
                performedBy: assignedBy,
                activityMetadata: {
                    projectId: data.projectId,
                },
            });
        }
        catch (error) {
            this.logger.warn('프로젝트 할당 생성 활동 내역 기록 실패', {
                assignmentId: assignment.id,
                error: error.message,
            });
        }
        this.logger.log('프로젝트 할당 완료', { assignmentId: assignment.id });
        return assignment;
    }
    async 프로젝트를_대량으로_할당한다(assignments, assignedBy) {
        this.logger.log('프로젝트 대량 할당 시작', {
            count: assignments.length,
        });
        const results = await this.evaluationCriteriaManagementService.프로젝트를_대량으로_할당한다(assignments, assignedBy);
        for (const assignment of results) {
            try {
                const assignmentData = assignments.find((a) => a.employeeId === assignment.employeeId &&
                    a.projectId === assignment.projectId &&
                    a.periodId === assignment.periodId);
                if (assignmentData) {
                    await this.activityLogContextService.활동내역을_기록한다({
                        periodId: assignmentData.periodId,
                        employeeId: assignmentData.employeeId,
                        activityType: 'project_assignment',
                        activityAction: 'created',
                        activityTitle: '프로젝트 할당',
                        relatedEntityType: 'project_assignment',
                        relatedEntityId: assignment.id,
                        performedBy: assignedBy,
                        activityMetadata: {
                            projectId: assignmentData.projectId,
                        },
                    });
                }
            }
            catch (error) {
                this.logger.warn('프로젝트 할당 생성 활동 내역 기록 실패', {
                    assignmentId: assignment.id,
                    error: error.message,
                });
            }
        }
        this.logger.log('프로젝트 대량 할당 완료', {
            count: results.length,
        });
        return results;
    }
    async 프로젝트_할당을_취소한다(id, cancelledBy) {
        this.logger.log('프로젝트 할당 취소 시작', { assignmentId: id });
        const assignment = await this.evaluationCriteriaManagementService.프로젝트_할당_상세를_조회한다(id);
        if (!assignment) {
            throw new Error(`프로젝트 할당 ID ${id}에 해당하는 할당을 찾을 수 없습니다.`);
        }
        await this.evaluationCriteriaManagementService.프로젝트_할당을_취소한다(id, cancelledBy);
        try {
            await this.activityLogContextService.활동내역을_기록한다({
                periodId: assignment.periodId,
                employeeId: assignment.employeeId,
                activityType: 'project_assignment',
                activityAction: 'cancelled',
                activityTitle: '프로젝트 할당 취소',
                relatedEntityType: 'project_assignment',
                relatedEntityId: id,
                performedBy: cancelledBy,
                activityMetadata: {
                    projectId: assignment.projectId,
                },
            });
        }
        catch (error) {
            this.logger.warn('프로젝트 할당 취소 활동 내역 기록 실패', {
                assignmentId: id,
                error: error.message,
            });
        }
        this.logger.log('프로젝트 할당 취소 완료', { assignmentId: id });
    }
    async 프로젝트_할당을_프로젝트_ID로_취소한다(employeeId, projectId, periodId, cancelledBy) {
        this.logger.log('프로젝트 할당 취소 시작 (프로젝트 ID 기반)', {
            employeeId,
            projectId,
            periodId,
        });
        const assignmentList = await this.evaluationCriteriaManagementService.프로젝트_할당_목록을_조회한다({
            employeeId,
            projectId,
            periodId,
            page: 1,
            limit: 1,
        });
        const assignmentId = assignmentList.assignments && assignmentList.assignments.length > 0
            ? assignmentList.assignments[0].id
            : null;
        await this.evaluationCriteriaManagementService.프로젝트_할당을_프로젝트_ID로_취소한다(employeeId, projectId, periodId, cancelledBy);
        if (assignmentId) {
            try {
                await this.activityLogContextService.활동내역을_기록한다({
                    periodId,
                    employeeId,
                    activityType: 'project_assignment',
                    activityAction: 'cancelled',
                    activityTitle: '프로젝트 할당 취소',
                    relatedEntityType: 'project_assignment',
                    relatedEntityId: assignmentId,
                    performedBy: cancelledBy,
                    activityMetadata: {
                        projectId,
                    },
                });
            }
            catch (error) {
                this.logger.warn('프로젝트 할당 취소 활동 내역 기록 실패', {
                    assignmentId,
                    error: error.message,
                });
            }
        }
        this.logger.log('프로젝트 할당 취소 완료 (프로젝트 ID 기반)', {
            employeeId,
            projectId,
            periodId,
        });
    }
};
exports.ProjectAssignmentBusinessService = ProjectAssignmentBusinessService;
exports.ProjectAssignmentBusinessService = ProjectAssignmentBusinessService = ProjectAssignmentBusinessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [evaluation_criteria_management_service_1.EvaluationCriteriaManagementService,
        evaluation_activity_log_context_service_1.EvaluationActivityLogContextService])
], ProjectAssignmentBusinessService);
//# sourceMappingURL=project-assignment-business.service.js.map