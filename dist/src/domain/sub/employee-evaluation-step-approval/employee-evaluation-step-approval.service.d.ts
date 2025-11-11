import { Repository } from 'typeorm';
import { EmployeeEvaluationStepApproval } from './employee-evaluation-step-approval.entity';
import type { CreateEmployeeEvaluationStepApprovalData, StepType, StepApprovalStatus } from './employee-evaluation-step-approval.types';
import type { IEmployeeEvaluationStepApprovalService } from './interfaces/employee-evaluation-step-approval.service.interface';
export declare class EmployeeEvaluationStepApprovalService implements IEmployeeEvaluationStepApprovalService {
    private readonly stepApprovalRepository;
    private readonly logger;
    constructor(stepApprovalRepository: Repository<EmployeeEvaluationStepApproval>);
    ID로_조회한다(id: string): Promise<EmployeeEvaluationStepApproval | null>;
    맵핑ID로_조회한다(mappingId: string): Promise<EmployeeEvaluationStepApproval | null>;
    생성한다(data: CreateEmployeeEvaluationStepApprovalData): Promise<EmployeeEvaluationStepApproval>;
    저장한다(stepApproval: EmployeeEvaluationStepApproval): Promise<EmployeeEvaluationStepApproval>;
    단계_상태를_변경한다(stepApproval: EmployeeEvaluationStepApproval, step: StepType, status: StepApprovalStatus, updatedBy: string): void;
    삭제한다(id: string, deletedBy: string): Promise<void>;
    private _평가기준설정_상태변경;
    private _자기평가_상태변경;
    private _일차평가_상태변경;
    private _이차평가_상태변경;
}
