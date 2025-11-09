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
var ConfigureEmployeeWbsEvaluationLineHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigureEmployeeWbsEvaluationLineHandler = exports.ConfigureEmployeeWbsEvaluationLineCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const evaluation_line_service_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.service");
const evaluation_line_mapping_service_1 = require("../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.service");
const evaluation_wbs_assignment_service_1 = require("../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service");
const evaluation_line_types_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.types");
class ConfigureEmployeeWbsEvaluationLineCommand {
    employeeId;
    wbsItemId;
    periodId;
    createdBy;
    constructor(employeeId, wbsItemId, periodId, createdBy) {
        this.employeeId = employeeId;
        this.wbsItemId = wbsItemId;
        this.periodId = periodId;
        this.createdBy = createdBy;
    }
}
exports.ConfigureEmployeeWbsEvaluationLineCommand = ConfigureEmployeeWbsEvaluationLineCommand;
let ConfigureEmployeeWbsEvaluationLineHandler = ConfigureEmployeeWbsEvaluationLineHandler_1 = class ConfigureEmployeeWbsEvaluationLineHandler {
    evaluationLineService;
    evaluationLineMappingService;
    evaluationWbsAssignmentService;
    logger = new common_1.Logger(ConfigureEmployeeWbsEvaluationLineHandler_1.name);
    constructor(evaluationLineService, evaluationLineMappingService, evaluationWbsAssignmentService) {
        this.evaluationLineService = evaluationLineService;
        this.evaluationLineMappingService = evaluationLineMappingService;
        this.evaluationWbsAssignmentService = evaluationWbsAssignmentService;
    }
    async execute(command) {
        const { employeeId, wbsItemId, periodId, createdBy } = command;
        this.logger.log(`직원-WBS별 평가라인 구성 시작 - 직원: ${employeeId}, WBS: ${wbsItemId}, 평가기간: ${periodId}`);
        try {
            let createdLines = 0;
            let createdMappings = 0;
            const wbsAssignments = await this.evaluationWbsAssignmentService.필터_조회한다({
                periodId,
                wbsItemId,
            });
            const existingPeerLines = await this.evaluationLineService.필터_조회한다({
                evaluatorType: evaluation_line_types_1.EvaluatorType.PRIMARY,
                orderFrom: 1,
                orderTo: 1,
            });
            let peerEvaluationLine;
            if (existingPeerLines.length > 0) {
                peerEvaluationLine = existingPeerLines[0];
            }
            else {
                peerEvaluationLine = await this.evaluationLineService.생성한다({
                    evaluatorType: evaluation_line_types_1.EvaluatorType.PRIMARY,
                    order: 1,
                    isRequired: true,
                    isAutoAssigned: true,
                });
                createdLines++;
            }
            const existingSupervisorLines = await this.evaluationLineService.필터_조회한다({
                evaluatorType: evaluation_line_types_1.EvaluatorType.SECONDARY,
                orderFrom: 2,
                orderTo: 2,
            });
            let supervisorEvaluationLine;
            if (existingSupervisorLines.length > 0) {
                supervisorEvaluationLine = existingSupervisorLines[0];
            }
            else {
                supervisorEvaluationLine = await this.evaluationLineService.생성한다({
                    evaluatorType: evaluation_line_types_1.EvaluatorType.SECONDARY,
                    order: 2,
                    isRequired: true,
                    isAutoAssigned: false,
                });
                createdLines++;
            }
            for (const assignment of wbsAssignments) {
                const assignmentDto = assignment.DTO로_변환한다();
                if (assignmentDto.employeeId !== employeeId) {
                    const existingMapping = await this.evaluationLineMappingService.평가관계_존재_확인한다(periodId, employeeId, assignmentDto.employeeId, wbsItemId);
                    if (!existingMapping) {
                        await this.evaluationLineMappingService.생성한다({
                            evaluationPeriodId: command.periodId,
                            employeeId,
                            evaluatorId: assignmentDto.employeeId,
                            wbsItemId,
                            evaluationLineId: peerEvaluationLine.DTO로_변환한다().id,
                            createdBy,
                        });
                        createdMappings++;
                    }
                }
            }
            const result = {
                message: `직원 ${employeeId}의 WBS 항목 ${wbsItemId}에 대한 평가라인 구성이 완료되었습니다.`,
                createdLines,
                createdMappings,
            };
            this.logger.log(`직원-WBS별 평가라인 구성 완료 - 직원: ${employeeId}, WBS: ${wbsItemId}, 생성된 라인: ${result.createdLines}, 생성된 매핑: ${result.createdMappings}`);
            return result;
        }
        catch (error) {
            this.logger.error(`직원-WBS별 평가라인 구성 실패 - 직원: ${employeeId}, WBS: ${wbsItemId}`, error.stack);
            throw error;
        }
    }
};
exports.ConfigureEmployeeWbsEvaluationLineHandler = ConfigureEmployeeWbsEvaluationLineHandler;
exports.ConfigureEmployeeWbsEvaluationLineHandler = ConfigureEmployeeWbsEvaluationLineHandler = ConfigureEmployeeWbsEvaluationLineHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(ConfigureEmployeeWbsEvaluationLineCommand),
    __metadata("design:paramtypes", [evaluation_line_service_1.EvaluationLineService,
        evaluation_line_mapping_service_1.EvaluationLineMappingService,
        evaluation_wbs_assignment_service_1.EvaluationWbsAssignmentService])
], ConfigureEmployeeWbsEvaluationLineHandler);
//# sourceMappingURL=configure-employee-wbs-evaluation-line.handler.js.map