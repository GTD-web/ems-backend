import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationResponseService } from '../../../../../domain/sub/evaluation-response/evaluation-response.service';
export declare class DeleteEvaluationResponseCommand {
    readonly id: string;
    readonly deletedBy: string;
    constructor(id: string, deletedBy: string);
}
export declare class DeleteEvaluationResponseHandler implements ICommandHandler<DeleteEvaluationResponseCommand, void> {
    private readonly evaluationResponseService;
    private readonly logger;
    constructor(evaluationResponseService: EvaluationResponseService);
    execute(command: DeleteEvaluationResponseCommand): Promise<void>;
}
