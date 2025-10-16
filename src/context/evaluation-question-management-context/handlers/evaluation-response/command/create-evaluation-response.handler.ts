import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationResponseService } from '../../../../../domain/sub/evaluation-response/evaluation-response.service';
import type { CreateEvaluationResponseDto } from '../../../../../domain/sub/evaluation-response/evaluation-response.types';

/**
 * 평가 응답 생성 커맨드
 */
export class CreateEvaluationResponseCommand {
  constructor(
    public readonly data: CreateEvaluationResponseDto,
    public readonly createdBy: string,
  ) {}
}

/**
 * 평가 응답 생성 핸들러
 */
@Injectable()
@CommandHandler(CreateEvaluationResponseCommand)
export class CreateEvaluationResponseHandler
  implements ICommandHandler<CreateEvaluationResponseCommand, string>
{
  private readonly logger = new Logger(CreateEvaluationResponseHandler.name);

  constructor(
    private readonly evaluationResponseService: EvaluationResponseService,
  ) {}

  async execute(command: CreateEvaluationResponseCommand): Promise<string> {
    this.logger.log('평가 응답 생성 시작', command);

    const { data, createdBy } = command;
    const evaluationResponse = await this.evaluationResponseService.생성한다(
      data,
      createdBy,
    );

    this.logger.log(
      `평가 응답 생성 완료 - ID: ${evaluationResponse.id}, 평가: ${data.evaluationId}, 질문: ${data.questionId}`,
    );
    return evaluationResponse.id;
  }
}

