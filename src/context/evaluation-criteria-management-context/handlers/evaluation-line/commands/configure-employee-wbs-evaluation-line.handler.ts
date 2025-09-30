import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { EvaluationLineService } from '../../../../../domain/core/evaluation-line/evaluation-line.service';
import { EvaluationLineMappingService } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { EvaluatorType } from '../../../../../domain/core/evaluation-line/evaluation-line.types';

/**
 * 직원-WBS별 평가라인 구성 커맨드
 */
export class ConfigureEmployeeWbsEvaluationLineCommand {
  constructor(
    public readonly employeeId: string,
    public readonly wbsItemId: string,
    public readonly periodId: string,
    public readonly createdBy: string,
  ) {}
}

/**
 * 직원-WBS별 평가라인 구성 결과
 */
export interface ConfigureEmployeeWbsEvaluationLineResult {
  message: string;
  createdLines: number;
  createdMappings: number;
}

/**
 * 직원-WBS별 평가라인 구성 커맨드 핸들러
 */
@CommandHandler(ConfigureEmployeeWbsEvaluationLineCommand)
export class ConfigureEmployeeWbsEvaluationLineHandler
  implements
    ICommandHandler<
      ConfigureEmployeeWbsEvaluationLineCommand,
      ConfigureEmployeeWbsEvaluationLineResult
    >
{
  private readonly logger = new Logger(
    ConfigureEmployeeWbsEvaluationLineHandler.name,
  );

  constructor(
    private readonly evaluationLineService: EvaluationLineService,
    private readonly evaluationLineMappingService: EvaluationLineMappingService,
    private readonly evaluationWbsAssignmentService: EvaluationWbsAssignmentService,
  ) {}

  async execute(
    command: ConfigureEmployeeWbsEvaluationLineCommand,
  ): Promise<ConfigureEmployeeWbsEvaluationLineResult> {
    const { employeeId, wbsItemId, periodId, createdBy } = command;

    this.logger.log(
      `직원-WBS별 평가라인 구성 시작 - 직원: ${employeeId}, WBS: ${wbsItemId}, 평가기간: ${periodId}`,
    );

    try {
      let createdLines = 0;
      let createdMappings = 0;

      // 1. 해당 WBS 항목에 할당된 다른 직원들 조회
      const wbsAssignments =
        await this.evaluationWbsAssignmentService.필터_조회한다({
          periodId,
          wbsItemId,
        });

      // 2. 이 직원-WBS 조합을 위한 평가라인들 생성

      // 동료 평가 라인 생성 (1차 평가자)
      const peerEvaluationLine = await this.evaluationLineService.생성한다({
        evaluatorType: EvaluatorType.PRIMARY,
        order: 1,
        isRequired: true,
        isAutoAssigned: true,
      });
      createdLines++;

      // 상급자 평가 라인 생성 (2차 평가자)
      const supervisorEvaluationLine =
        await this.evaluationLineService.생성한다({
          evaluatorType: EvaluatorType.SECONDARY,
          order: 2,
          isRequired: true,
          isAutoAssigned: false,
        });
      createdLines++;

      // 3. 동료 평가 매핑 생성 (같은 WBS 항목에 할당된 다른 직원들)
      for (const assignment of wbsAssignments) {
        const assignmentDto = assignment.DTO로_변환한다();
        if (assignmentDto.employeeId !== employeeId) {
          // 중복 매핑 방지 체크
          const existingMapping =
            await this.evaluationLineMappingService.평가관계_존재_확인한다(
              employeeId,
              assignmentDto.employeeId,
              wbsItemId,
            );

          if (!existingMapping) {
            await this.evaluationLineMappingService.생성한다({
              employeeId,
              evaluatorId: assignmentDto.employeeId,
              wbsItemId,
              evaluationLineId: peerEvaluationLine.DTO로_변환한다().id,
            });
            createdMappings++;
          }
        }
      }

      // 4. 상급자 평가 매핑 생성 (실제로는 조직도에서 상급자 찾아야 함)
      // MVP에서는 단순화하여 생략하거나 별도 로직 필요

      const result = {
        message: `직원 ${employeeId}의 WBS 항목 ${wbsItemId}에 대한 평가라인 구성이 완료되었습니다.`,
        createdLines,
        createdMappings,
      };

      this.logger.log(
        `직원-WBS별 평가라인 구성 완료 - 직원: ${employeeId}, WBS: ${wbsItemId}, 생성된 라인: ${result.createdLines}, 생성된 매핑: ${result.createdMappings}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `직원-WBS별 평가라인 구성 실패 - 직원: ${employeeId}, WBS: ${wbsItemId}`,
        error.stack,
      );
      throw error;
    }
  }
}
