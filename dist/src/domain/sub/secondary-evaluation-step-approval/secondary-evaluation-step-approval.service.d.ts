import { Repository } from 'typeorm';
import { SecondaryEvaluationStepApproval } from './secondary-evaluation-step-approval.entity';
import type { CreateSecondaryEvaluationStepApprovalData, StepApprovalStatus } from './secondary-evaluation-step-approval.types';
import type { ISecondaryEvaluationStepApprovalService } from './interfaces/secondary-evaluation-step-approval.service.interface';
export declare class SecondaryEvaluationStepApprovalService implements ISecondaryEvaluationStepApprovalService {
    private readonly secondaryStepApprovalRepository;
    private readonly logger;
    constructor(secondaryStepApprovalRepository: Repository<SecondaryEvaluationStepApproval>);
    ID로_조회한다(id: string): Promise<SecondaryEvaluationStepApproval | null>;
    맵핑ID와_평가자ID로_조회한다(mappingId: string, evaluatorId: string): Promise<SecondaryEvaluationStepApproval | null>;
    맵핑ID로_모두_조회한다(mappingId: string): Promise<SecondaryEvaluationStepApproval[]>;
    평가자ID로_조회한다(evaluatorId: string): Promise<SecondaryEvaluationStepApproval[]>;
    생성한다(data: CreateSecondaryEvaluationStepApprovalData): Promise<SecondaryEvaluationStepApproval>;
    저장한다(approval: SecondaryEvaluationStepApproval): Promise<SecondaryEvaluationStepApproval>;
    상태를_변경한다(approval: SecondaryEvaluationStepApproval, status: StepApprovalStatus, updatedBy: string, revisionRequestId?: string | null): void;
    삭제한다(id: string, deletedBy: string): Promise<void>;
}
