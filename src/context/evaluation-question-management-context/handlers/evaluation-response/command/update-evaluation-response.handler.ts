import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationResponseService } from '../../../../../domain/sub/evaluation-response/evaluation-response.service';
import type { UpdateEvaluationResponseDto } from '../../../../../domain/sub/evaluation-response/evaluation-response.types';

/**
 * 평가 응답 수정 커맨드
 */
export class UpdateEvaluationResponseCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateEvaluationResponseDto,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 평가 응답 수정 핸들러
 */
@Injectable()
@CommandHandler(UpdateEvaluationResponseCommand)
export class UpdateEvaluationResponseHandler
  implements ICommandHandler<UpdateEvaluationResponseCommand, void>
{
  private readonly logger = new Logger(UpdateEvaluationResponseHandler.name);

  constructor(
    private readonly evaluationResponseService: EvaluationResponseService,
  ) {}

  async execute(command: UpdateEvaluationResponseCommand): Promise<void> {
    this.logger.log('평가 응답 수정 시작', command);

    const { id, data, updatedBy } = command;
    await this.evaluationResponseService.업데이트한다(id, data, updatedBy);

    this.logger.log(`평가 응답 수정 완료 - ID: ${id}`);
  }
}

