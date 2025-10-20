import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeedScenario } from '../../types';
import { Department } from '@domain/common/department/department.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';

export class ClearSeedDataCommand {
  constructor(public readonly scenario?: SeedScenario) {}
}

@Injectable()
@CommandHandler(ClearSeedDataCommand)
export class ClearSeedDataHandler
  implements ICommandHandler<ClearSeedDataCommand, void>
{
  private readonly logger = new Logger(ClearSeedDataHandler.name);

  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(WbsItem)
    private readonly wbsItemRepository: Repository<WbsItem>,
    @InjectRepository(EvaluationPeriod)
    private readonly periodRepository: Repository<EvaluationPeriod>,
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly mappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    // TODO: Phase 4-8 repositories 추가
  ) {}

  async execute(command: ClearSeedDataCommand): Promise<void> {
    const scenario = command.scenario || SeedScenario.FULL;
    this.logger.log(`시드 데이터 삭제 시작 - 시나리오: ${scenario}`);

    try {
      switch (scenario) {
        case SeedScenario.MINIMAL:
          await this.clearPhase1();
          break;

        case SeedScenario.WITH_PERIOD:
          await this.clearPhase2();
          await this.clearPhase1();
          break;

        case SeedScenario.WITH_ASSIGNMENTS:
          await this.clearPhase3();
          await this.clearPhase2();
          await this.clearPhase1();
          break;

        case SeedScenario.WITH_SETUP:
          // await this.clearPhase6();
          // await this.clearPhase5();
          // await this.clearPhase4();
          await this.clearPhase3();
          await this.clearPhase2();
          await this.clearPhase1();
          break;

        case SeedScenario.FULL:
          // await this.clearPhase8();
          // await this.clearPhase7();
          // await this.clearPhase6();
          // await this.clearPhase5();
          // await this.clearPhase4();
          await this.clearPhase3();
          await this.clearPhase2();
          await this.clearPhase1();
          break;
      }

      this.logger.log('시드 데이터 삭제 완료');
    } catch (error) {
      this.logger.error('시드 데이터 삭제 실패', error.stack);
      throw error;
    }
  }

  private async clearPhase1(): Promise<void> {
    this.logger.log('Phase 1 데이터 삭제 중...');

    // 역순 삭제: WbsItem → Project → Employee → Department
    await this.wbsItemRepository.clear();
    this.logger.log('WbsItem 삭제 완료');

    await this.projectRepository.clear();
    this.logger.log('Project 삭제 완료');

    await this.employeeRepository.clear();
    this.logger.log('Employee 삭제 완료');

    await this.departmentRepository.clear();
    this.logger.log('Department 삭제 완료');
  }

  private async clearPhase2(): Promise<void> {
    this.logger.log('Phase 2 데이터 삭제 중...');

    await this.mappingRepository.clear();
    this.logger.log('EvaluationPeriodEmployeeMapping 삭제 완료');

    await this.periodRepository.clear();
    this.logger.log('EvaluationPeriod 삭제 완료');
  }

  private async clearPhase3(): Promise<void> {
    this.logger.log('Phase 3 데이터 삭제 중...');

    await this.wbsAssignmentRepository.clear();
    this.logger.log('EvaluationWbsAssignment 삭제 완료');

    await this.projectAssignmentRepository.clear();
    this.logger.log('EvaluationProjectAssignment 삭제 완료');
  }

  // TODO: clearPhase4 ~ clearPhase8 구현
}
