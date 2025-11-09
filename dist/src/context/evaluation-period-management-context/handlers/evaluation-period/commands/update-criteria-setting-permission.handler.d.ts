import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdateCriteriaSettingPermissionDto } from '../../../interfaces/evaluation-period-creation.interface';
export declare class UpdateCriteriaSettingPermissionCommand {
    readonly periodId: string;
    readonly permissionData: UpdateCriteriaSettingPermissionDto;
    readonly changedBy: string;
    constructor(periodId: string, permissionData: UpdateCriteriaSettingPermissionDto, changedBy: string);
}
export declare class UpdateCriteriaSettingPermissionCommandHandler implements ICommandHandler<UpdateCriteriaSettingPermissionCommand, EvaluationPeriodDto> {
    private readonly evaluationPeriodService;
    constructor(evaluationPeriodService: EvaluationPeriodService);
    execute(command: UpdateCriteriaSettingPermissionCommand): Promise<EvaluationPeriodDto>;
}
