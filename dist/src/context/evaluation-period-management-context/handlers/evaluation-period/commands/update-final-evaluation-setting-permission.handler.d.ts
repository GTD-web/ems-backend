import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdateFinalEvaluationSettingPermissionDto } from '../../../interfaces/evaluation-period-creation.interface';
export declare class UpdateFinalEvaluationSettingPermissionCommand {
    readonly periodId: string;
    readonly permissionData: UpdateFinalEvaluationSettingPermissionDto;
    readonly changedBy: string;
    constructor(periodId: string, permissionData: UpdateFinalEvaluationSettingPermissionDto, changedBy: string);
}
export declare class UpdateFinalEvaluationSettingPermissionCommandHandler implements ICommandHandler<UpdateFinalEvaluationSettingPermissionCommand, EvaluationPeriodDto> {
    private readonly evaluationPeriodService;
    constructor(evaluationPeriodService: EvaluationPeriodService);
    execute(command: UpdateFinalEvaluationSettingPermissionCommand): Promise<EvaluationPeriodDto>;
}
