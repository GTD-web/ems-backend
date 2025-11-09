import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdateGradeRangesDto } from '../../../interfaces/evaluation-period-creation.interface';
export declare class UpdateEvaluationPeriodGradeRangesCommand {
    readonly periodId: string;
    readonly gradeData: UpdateGradeRangesDto;
    readonly updatedBy: string;
    constructor(periodId: string, gradeData: UpdateGradeRangesDto, updatedBy: string);
}
export declare class UpdateEvaluationPeriodGradeRangesCommandHandler implements ICommandHandler<UpdateEvaluationPeriodGradeRangesCommand, EvaluationPeriodDto> {
    private readonly evaluationPeriodService;
    constructor(evaluationPeriodService: EvaluationPeriodService);
    execute(command: UpdateEvaluationPeriodGradeRangesCommand): Promise<EvaluationPeriodDto>;
}
