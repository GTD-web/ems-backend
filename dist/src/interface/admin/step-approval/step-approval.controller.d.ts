import { StepApprovalContextService } from '@context/step-approval-context';
import { UpdateStepApprovalDto } from './dto/update-step-approval.dto';
import { UpdateSecondaryStepApprovalDto } from './dto/update-secondary-step-approval.dto';
import { StepApprovalEnumsResponseDto } from './dto/step-approval-enums.dto';
import { StepTypeEnum } from './dto/update-step-approval.dto';
export declare class StepApprovalController {
    private readonly stepApprovalContextService;
    constructor(stepApprovalContextService: StepApprovalContextService);
    getStepApprovalEnums(): Promise<StepApprovalEnumsResponseDto>;
    updateStepApproval(evaluationPeriodId: string, employeeId: string, dto: UpdateStepApprovalDto & {
        step: StepTypeEnum;
    }, updatedBy: string): Promise<void>;
    updateCriteriaStepApproval(evaluationPeriodId: string, employeeId: string, dto: UpdateStepApprovalDto, updatedBy: string): Promise<void>;
    updateSelfStepApproval(evaluationPeriodId: string, employeeId: string, dto: UpdateStepApprovalDto, updatedBy: string): Promise<void>;
    updatePrimaryStepApproval(evaluationPeriodId: string, employeeId: string, dto: UpdateStepApprovalDto, updatedBy: string): Promise<void>;
    updateSecondaryStepApproval(evaluationPeriodId: string, employeeId: string, evaluatorId: string, dto: UpdateSecondaryStepApprovalDto, updatedBy: string): Promise<void>;
}
