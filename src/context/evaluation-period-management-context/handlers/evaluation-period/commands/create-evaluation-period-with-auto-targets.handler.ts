import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { CreateEvaluationPeriodMinimalDto } from '../../../interfaces/evaluation-period-creation.interface';
import { CreateEvaluationPeriodCommand } from './create-evaluation-period.handler';
import { RegisterEvaluationTargetWithAutoEvaluatorCommand } from '../../evaluation-target/commands/register-evaluation-target-with-auto-evaluator.handler';
import { GetActiveEmployeesQuery } from '../../../../organization-management-context/queries/get-active-employees.handler';

/**
 * 평가기간 생성 + 평가 대상자 자동 등록 커맨드
 */
export class CreateEvaluationPeriodWithAutoTargetsCommand {
  constructor(
    public readonly createData: CreateEvaluationPeriodMinimalDto,
    public readonly createdBy: string,
  ) {}
}

/**
 * 평가기간 생성 + 평가 대상자 자동 등록 결과
 */
export interface CreateEvaluationPeriodWithTargetsResult {
  evaluationPeriod: EvaluationPeriodDto;
  registeredTargetsCount: number;
  autoAssignedEvaluatorsCount: number;
  warnings: string[];
}

/**
 * 평가기간 생성 + 평가 대상자 자동 등록 커맨드 핸들러
 * 
 * 평가기간을 생성하고 모든 활성 직원을 평가 대상자로 자동 등록한다
 * 1. CreateEvaluationPeriodCommand 실행 (평가기간 생성)
 * 2. GetActiveEmployeesQuery 실행 (활성 직원 조회)
 * 3. 각 직원에 대해 RegisterEvaluationTargetWithAutoEvaluatorCommand 실행
 * 4. 결과 반환 (평가기간 정보 + 등록된 대상자 수)
 */
@CommandHandler(CreateEvaluationPeriodWithAutoTargetsCommand)
export class CreateEvaluationPeriodWithAutoTargetsHandler
  implements ICommandHandler<CreateEvaluationPeriodWithAutoTargetsCommand, CreateEvaluationPeriodWithTargetsResult>
{
  private readonly logger = new Logger(CreateEvaluationPeriodWithAutoTargetsHandler.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(
    command: CreateEvaluationPeriodWithAutoTargetsCommand,
  ): Promise<CreateEvaluationPeriodWithTargetsResult> {
    const { createData, createdBy } = command;

    this.logger.log(
      `평가기간 생성 + 평가 대상자 자동 등록 시작 - 평가기간: ${createData.name}`,
    );

    try {
      // 1. 평가기간 생성
      const evaluationPeriod = await this.commandBus.execute(
        new CreateEvaluationPeriodCommand(createData, createdBy),
      );

      this.logger.log(
        `평가기간 생성 완료 - ID: ${evaluationPeriod.id}, 이름: ${evaluationPeriod.name}`,
      );

      // 2. 활성 직원 조회
      const activeEmployees = await this.queryBus.execute(new GetActiveEmployeesQuery());

      this.logger.log(`활성 직원 수: ${activeEmployees.length}명`);

      // 3. 각 직원에 대해 평가 대상자 등록 + 1차 평가자 자동 할당
      let registeredTargetsCount = 0;
      let autoAssignedEvaluatorsCount = 0;
      const warnings: string[] = [];

      for (const employee of activeEmployees) {
        try {
          this.logger.log(`직원 평가 대상자 등록 시작 - 직원: ${employee.id} (${employee.name})`);
          const result = await this.commandBus.execute(
            new RegisterEvaluationTargetWithAutoEvaluatorCommand(
              evaluationPeriod.id,
              employee.id,
              createdBy,
            ),
          );
          this.logger.log(`직원 평가 대상자 등록 완료 - 직원: ${employee.id}, 결과: ${JSON.stringify(result)}`);

          registeredTargetsCount++;

          if (result.primaryEvaluatorAssigned) {
            autoAssignedEvaluatorsCount++;
          }

          if (result.warning) {
            warnings.push(`직원 ${employee.name}(${employee.employeeNumber}): ${result.warning}`);
          }

          this.logger.debug(
            `직원 등록 완료 - ${employee.name}(${employee.employeeNumber}), 평가자 할당: ${result.primaryEvaluatorAssigned}`,
          );
        } catch (error) {
          const warning = `직원 ${employee.name}(${employee.employeeNumber}) 등록 실패: ${error.message}`;
          warnings.push(warning);
          this.logger.warn(warning, error.stack);
        }
      }

      const result: CreateEvaluationPeriodWithTargetsResult = {
        evaluationPeriod,
        registeredTargetsCount,
        autoAssignedEvaluatorsCount,
        warnings,
      };

      this.logger.log(
        `평가기간 생성 + 평가 대상자 자동 등록 완료 - 평가기간: ${evaluationPeriod.name}, ` +
        `등록된 대상자: ${registeredTargetsCount}명, 자동 할당된 평가자: ${autoAssignedEvaluatorsCount}명, ` +
        `경고: ${warnings.length}개`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `평가기간 생성 + 평가 대상자 자동 등록 실패 - 평가기간: ${createData.name}`,
        error.stack,
      );
      throw error;
    }
  }
}
