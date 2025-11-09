import { StepApprovalContextService } from '@context/step-approval-context';
import { WbsSelfEvaluationBusinessService } from '@business/wbs-self-evaluation/wbs-self-evaluation-business.service';
import { DownwardEvaluationBusinessService } from '@business/downward-evaluation/downward-evaluation-business.service';
import { StepApprovalBusinessService } from '@business/step-approval/step-approval-business.service';
import { UpdateStepApprovalDto } from './dto/update-step-approval.dto';
import { UpdateSecondaryStepApprovalDto } from './dto/update-secondary-step-approval.dto';
import { StepApprovalEnumsResponseDto } from './dto/step-approval-enums.dto';
import { StepTypeEnum } from './dto/update-step-approval.dto';
export declare class StepApprovalController {
    private readonly stepApprovalContextService;
    private readonly wbsSelfEvaluationBusinessService;
    private readonly downwardEvaluationBusinessService;
    private readonly stepApprovalBusinessService;
    constructor(stepApprovalContextService: StepApprovalContextService, wbsSelfEvaluationBusinessService: WbsSelfEvaluationBusinessService, downwardEvaluationBusinessService: DownwardEvaluationBusinessService, stepApprovalBusinessService: StepApprovalBusinessService);
    getStepApprovalEnums(): Promise<StepApprovalEnumsResponseDto>;
    updateStepApproval(evaluationPeriodId: string, employeeId: string, dto: UpdateStepApprovalDto & {
        step: StepTypeEnum;
    }, updatedBy: string): Promise<void>;
    updateCriteriaStepApproval(evaluationPeriodId: string, employeeId: string, dto: UpdateStepApprovalDto, updatedBy: string): Promise<void>;
    updateSelfStepApproval(evaluationPeriodId: string, employeeId: string, dto: UpdateStepApprovalDto, updatedBy: string): Promise<void>;
    updatePrimaryStepApproval(evaluationPeriodId: string, employeeId: string, dto: UpdateStepApprovalDto, updatedBy: string): Promise<void>;
    updateSecondaryStepApproval(evaluationPeriodId: string, employeeId: string, evaluatorId: string, dto: UpdateSecondaryStepApprovalDto, updatedBy: string): Promise<void>;
}
