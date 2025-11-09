import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdateSelfEvaluationSettingPermissionDto } from '../../../interfaces/evaluation-period-creation.interface';
export declare class UpdateSelfEvaluationSettingPermissionCommand {
    readonly periodId: string;
    readonly permissionData: UpdateSelfEvaluationSettingPermissionDto;
    readonly changedBy: string;
    constructor(periodId: string, permissionData: UpdateSelfEvaluationSettingPermissionDto, changedBy: string);
}
export declare class UpdateSelfEvaluationSettingPermissionCommandHandler implements ICommandHandler<UpdateSelfEvaluationSettingPermissionCommand, EvaluationPeriodDto> {
    private readonly evaluationPeriodService;
    constructor(evaluationPeriodService: EvaluationPeriodService);
    execute(command: UpdateSelfEvaluationSettingPermissionCommand): Promise<EvaluationPeriodDto>;
}
