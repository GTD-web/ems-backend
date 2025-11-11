import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriod } from '../../../../../domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { CreateEvaluationPeriodMinimalDto } from '../../../interfaces/evaluation-period-creation.interface';
export declare class CreateEvaluationPeriodCommand {
    readonly createData: CreateEvaluationPeriodMinimalDto;
    readonly createdBy: string;
    constructor(createData: CreateEvaluationPeriodMinimalDto, createdBy: string);
}
export declare class CreateEvaluationPeriodCommandHandler implements ICommandHandler<CreateEvaluationPeriodCommand, EvaluationPeriodDto> {
    private readonly evaluationPeriodService;
    private readonly evaluationPeriodRepository;
    constructor(evaluationPeriodService: EvaluationPeriodService, evaluationPeriodRepository: Repository<EvaluationPeriod>);
    execute(command: CreateEvaluationPeriodCommand): Promise<EvaluationPeriodDto>;
    private 이름중복검증한다;
    private 기간겹침검증한다;
}
