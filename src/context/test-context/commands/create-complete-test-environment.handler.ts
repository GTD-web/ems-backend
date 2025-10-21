import { ICommand, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentTestService } from '../../../domain/common/department/department-test.service';
import { EmployeeTestService } from '../../../domain/common/employee/employee-test.service';
import { ProjectTestService } from '../../../domain/common/project/project-test.service';
import { WbsItemTestService } from '../../../domain/common/wbs-item/wbs-item-test.service';
import { EvaluationPeriod } from '../../../domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationWbsAssignment } from '../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { DepartmentDto } from '../../../domain/common/department/department.types';
import { EmployeeDto } from '../../../domain/common/employee/employee.types';
import { ProjectDto } from '../../../domain/common/project/project.types';
import { WbsItemDto } from '../../../domain/common/wbs-item/wbs-item.types';
import {
  EvaluationPeriodDto,
  EvaluationPeriodStatus,
} from '../../../domain/core/evaluation-period/evaluation-period.types';
import { EvaluationWbsAssignmentDto } from '../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

/**
 * 완전한 테스트 환경 생성 커맨드 결과
 */
export interface CompleteTestEnvironmentResult {
  departments: DepartmentDto[];
  employees: EmployeeDto[];
  projects: ProjectDto[];
  wbsItems: WbsItemDto[];
  periods: EvaluationPeriodDto[];
  wbsAssignments: EvaluationWbsAssignmentDto[];
}

/**
 * 완전한 테스트 환경을 생성하는 커맨드
 */
export class CreateCompleteTestEnvironmentCommand implements ICommand {}

/**
 * 완전한 테스트 환경 생성 핸들러
 */
@CommandHandler(CreateCompleteTestEnvironmentCommand)
@Injectable()
export class CreateCompleteTestEnvironmentHandler
  implements
    ICommandHandler<
      CreateCompleteTestEnvironmentCommand,
      CompleteTestEnvironmentResult
    >
{
  constructor(
    private readonly departmentTestService: DepartmentTestService,
    private readonly employeeTestService: EmployeeTestService,
    private readonly projectTestService: ProjectTestService,
    private readonly wbsItemTestService: WbsItemTestService,
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly evaluationWbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  ) {}

  async execute(
    command: CreateCompleteTestEnvironmentCommand,
  ): Promise<CompleteTestEnvironmentResult> {
    // 1. 부서 데이터 생성
    const departments =
      await this.departmentTestService.테스트용_목데이터를_생성한다();

    // 2. 직원 데이터 생성 (자동 확인 및 생성)
    const employees =
      await this.employeeTestService.직원_데이터를_확인하고_생성한다(5);

    // 3. 프로젝트 데이터 생성
    const projects =
      await this.projectTestService.테스트용_목데이터를_생성한다();

    // 4. WBS 항목 데이터 생성 (첫 번째 프로젝트에 대해)
    const firstProject = projects[0];
    const wbsItems = firstProject
      ? await this.wbsItemTestService.테스트용_목데이터를_생성한다(
          firstProject.id,
        )
      : [];

    // 5. 평가기간 데이터 생성
    const periods = await this.createEvaluationPeriods();

    // 6. WBS 할당 데이터 생성 (기본적으로 생성하지 않음 - 테스트에서 명시적으로 할당)
    // const wbsAssignments = await this.createWbsAssignments(
    //   employees,
    //   projects,
    //   wbsItems,
    //   periods,
    // );
    const wbsAssignments: EvaluationWbsAssignmentDto[] = [];

    console.log(
      `완전한 테스트 환경 생성 완료: 부서 ${departments.length}, 직원 ${employees.length}, 프로젝트 ${projects.length}, WBS ${wbsItems.length}, 평가기간 ${periods.length}, WBS할당 ${wbsAssignments.length}`,
    );

    return {
      departments,
      employees,
      projects,
      wbsItems,
      periods,
      wbsAssignments,
    };
  }

  /**
   * 평가기간 생성
   */
  private async createEvaluationPeriods(): Promise<EvaluationPeriodDto[]> {
    const timestamp = Date.now();
    const periods: EvaluationPeriod[] = [];

    // 진행 중인 평가기간
    const inProgressPeriod = this.evaluationPeriodRepository.create({
      name: `테스트 평가기간 (진행중) ${timestamp}`,
      startDate: new Date('2024-01-01'),
      peerEvaluationDeadline: new Date('2024-12-31'),
      description: '테스트용 진행 중인 평가기간',
      maxSelfEvaluationRate: 120,
      status: EvaluationPeriodStatus.IN_PROGRESS,
    });
    periods.push(inProgressPeriod);

    // 대기 중인 평가기간
    const waitingPeriod = this.evaluationPeriodRepository.create({
      name: `테스트 평가기간 (대기) ${timestamp + 1}`,
      startDate: new Date('2025-01-01'),
      peerEvaluationDeadline: new Date('2025-12-31'),
      description: '테스트용 대기 중인 평가기간',
      maxSelfEvaluationRate: 120,
      status: EvaluationPeriodStatus.WAITING,
    });
    periods.push(waitingPeriod);

    // 완료된 평가기간
    const completedPeriod = this.evaluationPeriodRepository.create({
      name: `테스트 평가기간 (완료) ${timestamp + 2}`,
      startDate: new Date('2023-01-01'),
      peerEvaluationDeadline: new Date('2023-12-31'),
      description: '테스트용 완료된 평가기간',
      maxSelfEvaluationRate: 120,
      status: EvaluationPeriodStatus.COMPLETED,
    });
    periods.push(completedPeriod);

    const savedPeriods = await this.evaluationPeriodRepository.save(periods);

    return savedPeriods.map((p) => p as any);
  }

  /**
   * WBS 할당 생성
   */
  private async createWbsAssignments(
    employees: EmployeeDto[],
    projects: ProjectDto[],
    wbsItems: WbsItemDto[],
    periods: EvaluationPeriodDto[],
  ): Promise<EvaluationWbsAssignmentDto[]> {
    if (
      employees.length === 0 ||
      projects.length === 0 ||
      wbsItems.length === 0 ||
      periods.length === 0
    ) {
      return [];
    }

    const inProgressPeriod = periods.find(
      (p) => p.status === EvaluationPeriodStatus.IN_PROGRESS,
    );
    if (!inProgressPeriod) {
      return [];
    }

    const firstProject = projects[0];
    const assignedBy = employees[0].id;
    const assignments: EvaluationWbsAssignment[] = [];

    for (const employee of employees) {
      for (let i = 0; i < wbsItems.length; i++) {
        const wbsItem = wbsItems[i];
        const assignment = this.evaluationWbsAssignmentRepository.create({
          periodId: inProgressPeriod.id,
          employeeId: employee.id,
          projectId: firstProject.id,
          wbsItemId: wbsItem.id,
          assignedBy: assignedBy,
          assignedDate: new Date(),
          displayOrder: i,
        });
        assignments.push(assignment);
      }
    }

    const savedAssignments =
      await this.evaluationWbsAssignmentRepository.save(assignments);

    return savedAssignments.map((a) => a.DTO로_변환한다());
  }
}
