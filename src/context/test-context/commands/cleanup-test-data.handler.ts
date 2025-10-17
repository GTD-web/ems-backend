import { ICommand, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentTestService } from '../../../domain/common/department/department-test.service';
import { EmployeeTestService } from '../../../domain/common/employee/employee-test.service';
import { ProjectTestService } from '../../../domain/common/project/project-test.service';
import { WbsItemTestService } from '../../../domain/common/wbs-item/wbs-item-test.service';
import { EvaluationPeriod } from '../../../domain/core/evaluation-period/evaluation-period.entity';

/**
 * 테스트 데이터 정리 결과
 */
export interface CleanupTestDataResult {
  departments: number;
  employees: number;
  projects: number;
  wbsItems: number;
  periods: number;
}

/**
 * 테스트 데이터 정리 커맨드
 */
export class CleanupTestDataCommand implements ICommand {}

/**
 * 테스트 데이터 정리 핸들러
 */
@CommandHandler(CleanupTestDataCommand)
@Injectable()
export class CleanupTestDataHandler
  implements ICommandHandler<CleanupTestDataCommand, CleanupTestDataResult>
{
  constructor(
    private readonly departmentTestService: DepartmentTestService,
    private readonly employeeTestService: EmployeeTestService,
    private readonly projectTestService: ProjectTestService,
    private readonly wbsItemTestService: WbsItemTestService,
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
  ) {}

  async execute(
    command: CleanupTestDataCommand,
  ): Promise<CleanupTestDataResult> {
    const [
      departmentCount,
      employeeCount,
      projectCount,
      wbsItemCount,
      periodCount,
    ] = await Promise.all([
      this.departmentTestService.테스트_데이터를_정리한다(),
      this.employeeTestService.테스트_데이터를_정리한다(),
      this.projectTestService.테스트_데이터를_정리한다(),
      this.wbsItemTestService.테스트_데이터를_정리한다(),
      this.cleanupEvaluationPeriods(),
    ]);

    console.log(
      `테스트 데이터 정리 완료 - 부서: ${departmentCount}, 직원: ${employeeCount}, 프로젝트: ${projectCount}, WBS: ${wbsItemCount}, 평가기간: ${periodCount}`,
    );

    return {
      departments: departmentCount,
      employees: employeeCount,
      projects: projectCount,
      wbsItems: wbsItemCount,
      periods: periodCount,
    };
  }

  /**
   * 평가기간 데이터 정리
   */
  private async cleanupEvaluationPeriods(): Promise<number> {
    const periods = await this.evaluationPeriodRepository.find();
    if (periods.length > 0) {
      await this.evaluationPeriodRepository.remove(periods);
    }
    return periods.length;
  }
}
