import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationResponseService } from '../../../../../domain/sub/evaluation-response/evaluation-response.service';

/**
 * 평가 응답 삭제 커맨드
 */
export class DeleteEvaluationResponseCommand {
  constructor(
    public readonly id: string,
    public readonly deletedBy: string,
  ) {}
}

/**
 * 평가 응답 삭제 핸들러
 */
@Injectable()
@CommandHandler(DeleteEvaluationResponseCommand)
export class DeleteEvaluationResponseHandler
  implements ICommandHandler<DeleteEvaluationResponseCommand, void>
{
  private readonly logger = new Logger(DeleteEvaluationResponseHandler.name);

  constructor(
    private readonly evaluationResponseService: EvaluationResponseService,
  ) {}

  async execute(command: DeleteEvaluationResponseCommand): Promise<void> {
    this.logger.log('평가 응답 삭제 시작', command);

    const { id, deletedBy } = command;
    await this.evaluationResponseService.삭제한다(id, deletedBy);

    this.logger.log(`평가 응답 삭제 완료 - ID: ${id}`);
  }
}

