import { IQuery, IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import { EmployeeEvaluationPeriodStatusDto } from '../../../interfaces/dashboard-context.interface';
import { EmployeeEvaluationStepApprovalService } from '@domain/sub/employee-evaluation-step-approval';
import { SecondaryEvaluationStepApproval } from '@domain/sub/secondary-evaluation-step-approval/secondary-evaluation-step-approval.entity';
import { EvaluationRevisionRequest } from '@domain/sub/evaluation-revision-request/evaluation-revision-request.entity';
import { EvaluationRevisionRequestRecipient } from '@domain/sub/evaluation-revision-request/evaluation-revision-request-recipient.entity';
export declare class GetEmployeeEvaluationPeriodStatusQuery implements IQuery {
    readonly evaluationPeriodId: string;
    readonly employeeId: string;
    readonly includeUnregistered: boolean;
    constructor(evaluationPeriodId: string, employeeId: string, includeUnregistered?: boolean);
}
export declare class GetEmployeeEvaluationPeriodStatusHandler implements IQueryHandler<GetEmployeeEvaluationPeriodStatusQuery> {
    private readonly mappingRepository;
    private readonly periodRepository;
    private readonly employeeRepository;
    private readonly projectAssignmentRepository;
    private readonly wbsAssignmentRepository;
    private readonly wbsCriteriaRepository;
    private readonly evaluationLineRepository;
    private readonly evaluationLineMappingRepository;
    private readonly wbsSelfEvaluationRepository;
    private readonly downwardEvaluationRepository;
    private readonly peerEvaluationRepository;
    private readonly finalEvaluationRepository;
    private readonly revisionRequestRepository;
    private readonly revisionRequestRecipientRepository;
    private readonly secondaryStepApprovalRepository;
    private readonly stepApprovalService;
    private readonly logger;
    constructor(mappingRepository: Repository<EvaluationPeriodEmployeeMapping>, periodRepository: Repository<EvaluationPeriod>, employeeRepository: Repository<Employee>, projectAssignmentRepository: Repository<EvaluationProjectAssignment>, wbsAssignmentRepository: Repository<EvaluationWbsAssignment>, wbsCriteriaRepository: Repository<WbsEvaluationCriteria>, evaluationLineRepository: Repository<EvaluationLine>, evaluationLineMappingRepository: Repository<EvaluationLineMapping>, wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>, downwardEvaluationRepository: Repository<DownwardEvaluation>, peerEvaluationRepository: Repository<PeerEvaluation>, finalEvaluationRepository: Repository<FinalEvaluation>, revisionRequestRepository: Repository<EvaluationRevisionRequest>, revisionRequestRecipientRepository: Repository<EvaluationRevisionRequestRecipient>, secondaryStepApprovalRepository: Repository<SecondaryEvaluationStepApproval>, stepApprovalService: EmployeeEvaluationStepApprovalService);
    execute(query: GetEmployeeEvaluationPeriodStatusQuery): Promise<EmployeeEvaluationPeriodStatusDto | null>;
}
