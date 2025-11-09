import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationResponseService } from '../../../../../domain/sub/evaluation-response/evaluation-response.service';
import type { UpdateEvaluationResponseDto } from '../../../../../domain/sub/evaluation-response/evaluation-response.types';
export declare class UpdateEvaluationResponseCommand {
    readonly id: string;
    readonly data: UpdateEvaluationResponseDto;
    readonly updatedBy: string;
    constructor(id: string, data: UpdateEvaluationResponseDto, updatedBy: string);
}
export declare class UpdateEvaluationResponseHandler implements ICommandHandler<UpdateEvaluationResponseCommand, void> {
    private readonly evaluationResponseService;
    private readonly logger;
    constructor(evaluationResponseService: EvaluationResponseService);
    execute(command: UpdateEvaluationResponseCommand): Promise<void>;
}
