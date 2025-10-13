import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { EvaluationLineService } from '../../../../../domain/core/evaluation-line/evaluation-line.service';
import { EvaluationLineMappingService } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
import { EvaluatorType } from '../../../../../domain/core/evaluation-line/evaluation-line.types';

/**
 * 2차 평가자 구성 커맨드
 */
export class ConfigureSecondaryEvaluatorCommand {
  constructor(
    public readonly employeeId: string,
    public readonly wbsItemId: string,
    public readonly periodId: string,
    public readonly evaluatorId: string,
    public readonly createdBy: string,
  ) {}
}

/**
 * 2차 평가자 구성 결과
 */
export interface ConfigureSecondaryEvaluatorResult {
  message: string;
  createdLines: number;
  createdMappings: number;
  mapping: {
    id: string;
    employeeId: string;
    evaluatorId: string;
    wbsItemId: string;
    evaluationLineId: string;
  };
}

/**
 * 2차 평가자 구성 커맨드 핸들러
 *
 * 직원, WBS, 평가기간에 따라 2차 평가자를 지정하여 평가라인을 구성한다
 */
@CommandHandler(ConfigureSecondaryEvaluatorCommand)
export class ConfigureSecondaryEvaluatorHandler
  implements
    ICommandHandler<
      ConfigureSecondaryEvaluatorCommand,
      ConfigureSecondaryEvaluatorResult
    >
{
  private readonly logger = new Logger(ConfigureSecondaryEvaluatorHandler.name);

  constructor(
    private readonly evaluationLineService: EvaluationLineService,
    private readonly evaluationLineMappingService: EvaluationLineMappingService,
  ) {}

  async execute(
    command: ConfigureSecondaryEvaluatorCommand,
  ): Promise<ConfigureSecondaryEvaluatorResult> {
    const { employeeId, wbsItemId, periodId, evaluatorId, createdBy } = command;

    this.logger.log(
      `2차 평가자 구성 시작 - 직원: ${employeeId}, WBS: ${wbsItemId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}`,
    );

    try {
      let createdLines = 0;
      let createdMappings = 0;

      // 2차 평가 라인 생성
      const secondaryEvaluationLine = await this.evaluationLineService.생성한다(
        {
          evaluatorType: EvaluatorType.SECONDARY,
          order: 2,
          isRequired: true,
          isAutoAssigned: false,
        },
      );
      createdLines++;

      // 중복 매핑 방지 체크
      const existingMapping =
        await this.evaluationLineMappingService.평가관계_존재_확인한다(
          employeeId,
          evaluatorId,
          wbsItemId,
        );

      if (existingMapping) {
        throw new Error(
          `이미 존재하는 평가관계입니다. 피평가자: ${employeeId}, 평가자: ${evaluatorId}, WBS: ${wbsItemId}`,
        );
      }

      const mappingEntity = await this.evaluationLineMappingService.생성한다({
        employeeId,
        evaluatorId,
        wbsItemId,
        evaluationLineId: secondaryEvaluationLine.DTO로_변환한다().id,
        createdBy,
      });
      createdMappings++;

      const mappingDto = mappingEntity.DTO로_변환한다();
      const mapping = {
        id: mappingDto.id,
        employeeId: mappingDto.employeeId,
        evaluatorId: mappingDto.evaluatorId,
        wbsItemId: mappingDto.wbsItemId || '',
        evaluationLineId: mappingDto.evaluationLineId,
      };

      this.logger.log(
        `2차 평가자 구성 완료 - 피평가자: ${employeeId}, 평가자: ${evaluatorId}`,
      );

      const result = {
        message: `직원 ${employeeId}의 WBS 항목 ${wbsItemId}에 대한 2차 평가자 구성이 완료되었습니다.`,
        createdLines,
        createdMappings,
        mapping,
      };

      return result;
    } catch (error) {
      this.logger.error(
        `2차 평가자 구성 실패 - 직원: ${employeeId}, WBS: ${wbsItemId}, 평가자: ${evaluatorId}`,
        error.stack,
      );
      throw error;
    }
  }
}
