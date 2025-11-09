import { Repository } from 'typeorm';
import { EmployeeEvaluationStepApprovalService } from '@domain/sub/employee-evaluation-step-approval';
import { EvaluationRevisionRequestService } from '@domain/sub/evaluation-revision-request';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import type { IStepApprovalContext, UpdateStepApprovalRequest, UpdateStepApprovalByStepRequest, UpdateSecondaryStepApprovalRequest } from './interfaces/step-approval-context.interface';
export declare class StepApprovalContextService implements IStepApprovalContext {
    private readonly stepApprovalService;
    private readonly revisionRequestService;
    private readonly mappingRepository;
    private readonly evaluationLineMappingRepository;
    private readonly logger;
    constructor(stepApprovalService: EmployeeEvaluationStepApprovalService, revisionRequestService: EvaluationRevisionRequestService, mappingRepository: Repository<EvaluationPeriodEmployeeMapping>, evaluationLineMappingRepository: Repository<EvaluationLineMapping>);
    단계별_확인상태를_변경한다(request: UpdateStepApprovalRequest): Promise<void>;
    private 재작성요청을_생성한다;
    private 재작성요청_수신자를_조회한다;
    일차평가자를_조회한다(evaluationPeriodId: string, employeeId: string): Promise<string | null>;
    private 이차평가자들을_조회한다;
    평가기준설정_확인상태를_변경한다(request: UpdateStepApprovalByStepRequest): Promise<void>;
    자기평가_확인상태를_변경한다(request: UpdateStepApprovalByStepRequest): Promise<void>;
    일차하향평가_확인상태를_변경한다(request: UpdateStepApprovalByStepRequest): Promise<void>;
    이차하향평가_확인상태를_변경한다(request: UpdateSecondaryStepApprovalRequest): Promise<void>;
    private 평가자가_2차평가자인지_확인한다;
    private 재작성요청을_평가자별로_생성한다;
}
