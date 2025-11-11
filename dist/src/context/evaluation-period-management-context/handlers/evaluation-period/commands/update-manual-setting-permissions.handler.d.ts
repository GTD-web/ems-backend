import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdateManualSettingPermissionsDto } from '../../../interfaces/evaluation-period-creation.interface';
export declare class UpdateManualSettingPermissionsCommand {
    readonly periodId: string;
    readonly permissionData: UpdateManualSettingPermissionsDto;
    readonly changedBy: string;
    constructor(periodId: string, permissionData: UpdateManualSettingPermissionsDto, changedBy: string);
}
export declare class UpdateManualSettingPermissionsCommandHandler implements ICommandHandler<UpdateManualSettingPermissionsCommand, EvaluationPeriodDto> {
    private readonly evaluationPeriodService;
    constructor(evaluationPeriodService: EvaluationPeriodService);
    execute(command: UpdateManualSettingPermissionsCommand): Promise<EvaluationPeriodDto>;
}
