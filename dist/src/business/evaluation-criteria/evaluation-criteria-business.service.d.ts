import { CommandBus } from '@nestjs/cqrs';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { RevisionRequestContextService } from '@context/revision-request-context/revision-request-context.service';
import type { EvaluationPeriodEmployeeMappingDto } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';
export declare class EvaluationCriteriaBusinessService {
    private readonly evaluationCriteriaManagementService;
    private readonly revisionRequestContextService;
    private readonly commandBus;
    private readonly logger;
    constructor(evaluationCriteriaManagementService: EvaluationCriteriaManagementService, revisionRequestContextService: RevisionRequestContextService, commandBus: CommandBus);
    평가기준을_제출하고_재작성요청을_완료한다(evaluationPeriodId: string, employeeId: string, submittedBy: string): Promise<EvaluationPeriodEmployeeMappingDto>;
}
