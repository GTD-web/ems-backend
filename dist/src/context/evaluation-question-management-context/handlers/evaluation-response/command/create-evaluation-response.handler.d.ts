import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationResponseService } from '../../../../../domain/sub/evaluation-response/evaluation-response.service';
import type { CreateEvaluationResponseDto } from '../../../../../domain/sub/evaluation-response/evaluation-response.types';
export declare class CreateEvaluationResponseCommand {
    readonly data: CreateEvaluationResponseDto;
    readonly createdBy: string;
    constructor(data: CreateEvaluationResponseDto, createdBy: string);
}
export declare class CreateEvaluationResponseHandler implements ICommandHandler<CreateEvaluationResponseCommand, string> {
    private readonly evaluationResponseService;
    private readonly logger;
    constructor(evaluationResponseService: EvaluationResponseService);
    execute(command: CreateEvaluationResponseCommand): Promise<string>;
}
