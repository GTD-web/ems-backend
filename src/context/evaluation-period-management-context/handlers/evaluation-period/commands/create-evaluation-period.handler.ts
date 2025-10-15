import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { CreateEvaluationPeriodMinimalDto } from '../../../interfaces/evaluation-period-creation.interface';

/**
 * 평가 기간 생성 커맨드
 */
export class CreateEvaluationPeriodCommand {
  constructor(
    public readonly createData: CreateEvaluationPeriodMinimalDto,
    public readonly createdBy: string,
  ) {}
}

/**
 * 평가 기간 생성 커맨드 핸들러
 */
@Injectable()
@CommandHandler(CreateEvaluationPeriodCommand)
export class CreateEvaluationPeriodCommandHandler
  implements ICommandHandler<CreateEvaluationPeriodCommand, EvaluationPeriodDto>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    command: CreateEvaluationPeriodCommand,
  ): Promise<EvaluationPeriodDto> {
    const { createData, createdBy } = command;

    // CreateEvaluationPeriodDto 형태로 변환
    const createDto = {
      name: createData.name,
      startDate: createData.startDate,
      description: createData.description,
      peerEvaluationDeadline: createData.peerEvaluationDeadline,
      maxSelfEvaluationRate: createData.maxSelfEvaluationRate,
      gradeRanges: createData.gradeRanges,
    };

    // 도메인 서비스를 통해 평가 기간 생성
    const createdPeriod = await this.evaluationPeriodService.생성한다(
      createDto,
      createdBy,
    );

    return createdPeriod as EvaluationPeriodDto;
  }
}

