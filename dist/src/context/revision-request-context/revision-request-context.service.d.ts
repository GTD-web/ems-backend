import { Repository } from 'typeorm';
import { EvaluationRevisionRequestService, type RevisionRequestStepType } from '@domain/sub/evaluation-revision-request';
import { EmployeeEvaluationStepApprovalService } from '@domain/sub/employee-evaluation-step-approval';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import type { IRevisionRequestContext, RevisionRequestWithDetailsDto, GetRevisionRequestsFilter } from './interfaces/revision-request-context.interface';
export declare class RevisionRequestContextService implements IRevisionRequestContext {
    private readonly revisionRequestService;
    private readonly stepApprovalService;
    private readonly employeeRepository;
    private readonly evaluationPeriodRepository;
    private readonly mappingRepository;
    private readonly logger;
    constructor(revisionRequestService: EvaluationRevisionRequestService, stepApprovalService: EmployeeEvaluationStepApprovalService, employeeRepository: Repository<Employee>, evaluationPeriodRepository: Repository<EvaluationPeriod>, mappingRepository: Repository<EvaluationPeriodEmployeeMapping>);
    전체_재작성요청목록을_조회한다(filter?: GetRevisionRequestsFilter): Promise<RevisionRequestWithDetailsDto[]>;
    내_재작성요청목록을_조회한다(recipientId: string, filter?: GetRevisionRequestsFilter): Promise<RevisionRequestWithDetailsDto[]>;
    읽지않은_재작성요청수를_조회한다(recipientId: string): Promise<number>;
    재작성요청을_읽음처리한다(requestId: string, recipientId: string): Promise<void>;
    재작성완료_응답을_제출한다(requestId: string, recipientId: string, responseComment: string): Promise<void>;
    평가기간_직원_평가자로_재작성완료_응답을_제출한다(evaluationPeriodId: string, employeeId: string, evaluatorId: string, step: RevisionRequestStepType, responseComment: string): Promise<void>;
    private 모든_수신자가_완료했는가;
    private 모든_2차평가자의_재작성요청이_완료했는가;
    private 단계_승인_상태를_재작성완료로_변경한다;
}
