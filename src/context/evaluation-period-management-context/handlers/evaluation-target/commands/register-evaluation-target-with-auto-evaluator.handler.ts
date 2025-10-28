import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EvaluationPeriodEmployeeMappingDto } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';
import { RegisterEvaluationTargetCommand } from './register-evaluation-target.handler';
import { ConfigurePrimaryEvaluatorCommand } from '../../../../evaluation-criteria-management-context/handlers/evaluation-line/commands/configure-primary-evaluator.handler';
import { FindDepartmentManagerQuery } from '../../../../organization-management-context/queries/find-department-manager.handler';

/**
 * 평가 대상자 등록 + 1차 평가자 자동 할당 커맨드
 */
export class RegisterEvaluationTargetWithAutoEvaluatorCommand {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly employeeId: string,
    public readonly createdBy: string,
  ) {}
}

/**
 * 평가 대상자 등록 + 1차 평가자 자동 할당 결과
 */
export interface RegisterWithAutoEvaluatorResult {
  mapping: EvaluationPeriodEmployeeMappingDto;
  primaryEvaluatorAssigned: boolean;
  primaryEvaluatorId: string | null;
  warning: string | null;
}

/**
 * 평가 대상자 등록 + 1차 평가자 자동 할당 커맨드 핸들러
 * 
 * 평가 대상자를 등록하고 1차 평가자를 자동 할당한다
 * 1. RegisterEvaluationTargetCommand 실행
 * 2. FindDepartmentManagerQuery 실행
 * 3. 부서장이 있고 기존 1차 평가자 매핑이 없으면 ConfigurePrimaryEvaluatorCommand 실행
 */
@CommandHandler(RegisterEvaluationTargetWithAutoEvaluatorCommand)
export class RegisterEvaluationTargetWithAutoEvaluatorHandler
  implements ICommandHandler<RegisterEvaluationTargetWithAutoEvaluatorCommand, RegisterWithAutoEvaluatorResult>
{
  private readonly logger = new Logger(RegisterEvaluationTargetWithAutoEvaluatorHandler.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(
    command: RegisterEvaluationTargetWithAutoEvaluatorCommand,
  ): Promise<RegisterWithAutoEvaluatorResult> {
    const { evaluationPeriodId, employeeId, createdBy } = command;

    this.logger.log(
      `평가 대상자 등록 + 1차 평가자 자동 할당 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
    );

    try {
      // 1. 평가 대상자 등록
      const mapping = await this.commandBus.execute(
        new RegisterEvaluationTargetCommand(evaluationPeriodId, employeeId, createdBy),
      );

      this.logger.log(`평가 대상자 등록 완료 - 직원: ${employeeId}`);

      // 2. 부서장 조회
      this.logger.log(`부서장 조회 시작 - 직원: ${employeeId}`);
      const departmentManagerId = await this.queryBus.execute(
        new FindDepartmentManagerQuery(employeeId),
      );
      this.logger.log(`부서장 조회 결과 - 직원: ${employeeId}, 부서장: ${departmentManagerId}`);

      let primaryEvaluatorAssigned = false;
      let primaryEvaluatorId: string | null = null;
      let warning: string | null = null;

      if (departmentManagerId) {
        try {
          // 3. 1차 평가자 할당
          await this.commandBus.execute(
            new ConfigurePrimaryEvaluatorCommand(
              employeeId,
              evaluationPeriodId,
              departmentManagerId,
              createdBy,
            ),
          );

          primaryEvaluatorAssigned = true;
          primaryEvaluatorId = departmentManagerId;

          this.logger.log(
            `1차 평가자 자동 할당 성공 - 직원: ${employeeId}, 평가자: ${departmentManagerId}`,
          );
        } catch (error) {
          // 기존 1차 평가자 매핑이 있는 경우 등으로 실패할 수 있음
          this.logger.warn(
            `1차 평가자 자동 할당 실패 - 직원: ${employeeId}, 평가자: ${departmentManagerId}`,
            error.message,
          );
          warning = `1차 평가자 자동 할당 실패: ${error.message}`;
        }
      } else {
        warning = `부서장을 찾을 수 없어 1차 평가자를 할당할 수 없습니다`;
        this.logger.warn(`부서장을 찾을 수 없음 - 직원: ${employeeId}`);
      }

      const result: RegisterWithAutoEvaluatorResult = {
        mapping,
        primaryEvaluatorAssigned,
        primaryEvaluatorId,
        warning,
      };

      this.logger.log(
        `평가 대상자 등록 + 1차 평가자 자동 할당 완료 - 직원: ${employeeId}, 평가자 할당: ${primaryEvaluatorAssigned}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `평가 대상자 등록 + 1차 평가자 자동 할당 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }
}
