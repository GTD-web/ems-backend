import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentTestService } from '../../domain/common/department/department-test.service';
import { EmployeeTestService } from '../../domain/common/employee/employee-test.service';
import { ProjectTestService } from '../../domain/common/project/project-test.service';
import { WbsItemTestService } from '../../domain/common/wbs-item/wbs-item-test.service';
import { DepartmentDto } from '../../domain/common/department/department.types';
import { EmployeeDto } from '../../domain/common/employee/employee.types';
import { ProjectDto } from '../../domain/common/project/project.types';
import { WbsItemDto } from '../../domain/common/wbs-item/wbs-item.types';
import { EvaluationPeriod } from '../../domain/core/evaluation-period/evaluation-period.entity';
import {
  EvaluationPeriodDto,
  EvaluationPeriodStatus,
} from '../../domain/core/evaluation-period/evaluation-period.types';
import { EvaluationWbsAssignment } from '../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationWbsAssignmentDto } from '../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

/**
 * 테스트용 컨텍스트 서비스
 *
 * 테스트 시 사용할 통합 목데이터를 생성하고 관리하는 서비스입니다.
 * 부서, 직원, 프로젝트, WBS 항목을 연관지어 생성합니다.
 * 실제 운영 환경에서는 사용하지 않습니다.
 */
@Injectable()
export class TestContextService {
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

  /**
   * 완전한 테스트 환경을 생성한다
   * @returns 생성된 모든 데이터
   */
  async 완전한_테스트환경을_생성한다(): Promise<{
    departments: DepartmentDto[];
    employees: EmployeeDto[];
    projects: ProjectDto[];
    wbsItems: WbsItemDto[];
    periods: EvaluationPeriodDto[];
    wbsAssignments: EvaluationWbsAssignmentDto[];
  }> {
    // 1. 기존 테스트 데이터 정리
    await this.테스트_데이터를_정리한다();

    // 2. 부서 데이터 생성
    const departments =
      await this.departmentTestService.테스트용_목데이터를_생성한다();

    // 3. 직원 데이터 생성 (자동 확인 및 생성)
    const employees =
      await this.employeeTestService.직원_데이터를_확인하고_생성한다(5);

    // 4. 프로젝트 데이터 생성
    const projects =
      await this.projectTestService.테스트용_목데이터를_생성한다();

    // 5. WBS 항목 데이터 생성 (첫 번째 프로젝트에 대해)
    const firstProject = projects[0];
    const wbsItems = firstProject
      ? await this.wbsItemTestService.테스트용_목데이터를_생성한다(
          firstProject.id,
        )
      : [];

    // 6. 평가기간 데이터 생성
    const periods = await this.테스트용_평가기간을_생성한다();

    // 7. WBS 할당 데이터 생성 (진행 중인 평가기간에 대해)
    const wbsAssignments = await this.테스트용_WBS할당을_생성한다(
      employees,
      projects,
      wbsItems,
      periods,
    );

    console.log(
      `부서 ${departments.length}, 직원 ${employees.length}, 프로젝트 ${projects.length}, WBS 항목 ${wbsItems.length}, 평가기간 ${periods.length}, WBS 할당 ${wbsAssignments.length} 생성 완료`,
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
   * 테스트용 평가기간을 생성한다
   * @returns 생성된 평가기간 목록
   */
  async 테스트용_평가기간을_생성한다(): Promise<EvaluationPeriodDto[]> {
    const timestamp = Date.now();
    const periods: EvaluationPeriodDto[] = [];

    // 진행 중인 평가기간 생성
    const inProgressPeriod = this.evaluationPeriodRepository.create({
      name: `테스트 평가기간 (진행중) ${timestamp}`,
      startDate: new Date('2024-01-01'),
      peerEvaluationDeadline: new Date('2024-12-31'),
      description: '테스트용 진행 중인 평가기간',
      maxSelfEvaluationRate: 120,
      status: EvaluationPeriodStatus.IN_PROGRESS,
    });
    const savedInProgress =
      await this.evaluationPeriodRepository.save(inProgressPeriod);
    periods.push(savedInProgress as any);

    // 대기 중인 평가기간 생성
    const waitingPeriod = this.evaluationPeriodRepository.create({
      name: `테스트 평가기간 (대기) ${timestamp + 1}`,
      startDate: new Date('2025-01-01'),
      peerEvaluationDeadline: new Date('2025-12-31'),
      description: '테스트용 대기 중인 평가기간',
      maxSelfEvaluationRate: 120,
      status: EvaluationPeriodStatus.WAITING,
    });
    const savedWaiting =
      await this.evaluationPeriodRepository.save(waitingPeriod);
    periods.push(savedWaiting as any);

    // 완료된 평가기간 생성
    const completedPeriod = this.evaluationPeriodRepository.create({
      name: `테스트 평가기간 (완료) ${timestamp + 2}`,
      startDate: new Date('2023-01-01'),
      peerEvaluationDeadline: new Date('2023-12-31'),
      description: '테스트용 완료된 평가기간',
      maxSelfEvaluationRate: 120,
      status: EvaluationPeriodStatus.COMPLETED,
    });
    const savedCompleted =
      await this.evaluationPeriodRepository.save(completedPeriod);
    periods.push(savedCompleted as any);

    console.log(`평가기간 ${periods.length}개 생성 완료`);
    return periods;
  }

  /**
   * 부서와 직원을 생성한다
   * @returns 생성된 부서와 직원 데이터
   */
  async 부서와_직원을_생성한다(): Promise<{
    departments: DepartmentDto[];
    employees: EmployeeDto[];
  }> {
    // 부서 데이터만 생성 (직원은 이미 생성되었다고 가정)
    const departments =
      await this.departmentTestService.테스트용_목데이터를_생성한다();

    // 기존 직원 데이터 조회 (재생성하지 않음)
    const employees =
      await this.employeeTestService.현재_직원_목록을_조회한다();

    console.log(
      `부서 ${departments.length}, 기존 직원 ${employees.length} 조회 완료`,
    );
    return {
      departments,
      employees,
    };
  }

  /**
   * 프로젝트와 WBS 항목을 생성한다
   * @param projectCount 생성할 프로젝트 수
   * @returns 생성된 프로젝트와 WBS 항목 데이터
   */
  async 프로젝트와_WBS를_생성한다(projectCount: number = 3): Promise<{
    projects: ProjectDto[];
    wbsItems: WbsItemDto[];
  }> {
    // 기존 테스트 데이터 정리
    await this.테스트_데이터를_정리한다();

    // 프로젝트 데이터 생성
    const projects =
      await this.projectTestService.랜덤_테스트데이터를_생성한다(projectCount);

    // 각 프로젝트에 대해 WBS 항목 생성
    const allWbsItems: WbsItemDto[] = [];
    for (const project of projects) {
      const wbsItems =
        await this.wbsItemTestService.테스트용_목데이터를_생성한다(project.id);
      allWbsItems.push(...wbsItems);
    }

    console.log(
      `프로젝트 ${projects.length}, WBS 항목 ${allWbsItems.length} 생성 완료`,
    );
    return {
      projects,
      wbsItems: allWbsItems,
    };
  }

  /**
   * 특정 부서에 직원을 추가한다
   * @param departmentId 부서 ID
   * @param employeeCount 생성할 직원 수
   * @returns 생성된 직원 데이터
   */
  async 특정_부서에_직원을_추가한다(
    departmentId: string,
    employeeCount: number = 5,
  ): Promise<EmployeeDto[]> {
    const employees =
      await this.employeeTestService.부서별_직원_테스트데이터를_생성한다(
        departmentId,
        employeeCount,
      );
    console.log(`부서 ${departmentId}에 추가된 직원 수: ${employees.length}`);

    return employees;
  }

  /**
   * 특정 프로젝트에 WBS 항목을 추가한다
   * @param projectId 프로젝트 ID
   * @param wbsCount 생성할 WBS 항목 수
   * @returns 생성된 WBS 항목 데이터
   */
  async 특정_프로젝트에_WBS를_추가한다(
    projectId: string,
    wbsCount: number = 10,
  ): Promise<WbsItemDto[]> {
    const wbsItems = await this.wbsItemTestService.랜덤_테스트데이터를_생성한다(
      projectId,
      wbsCount,
    );
    console.log(
      `프로젝트 ${projectId}에 추가된 WBS 항목 수: ${wbsItems.length}`,
    );

    return wbsItems;
  }

  /**
   * 매니저-하위직원 관계를 생성한다
   * @param managerCount 매니저 수
   * @param employeesPerManager 매니저당 하위 직원 수
   * @returns 생성된 직원 데이터
   */
  async 매니저_하위직원_관계를_생성한다(
    managerCount: number = 3,
    employeesPerManager: number = 3,
  ): Promise<EmployeeDto[]> {
    const employees =
      await this.employeeTestService.매니저_하위직원_테스트데이터를_생성한다(
        managerCount,
        employeesPerManager,
      );
    console.log(`생성된 매니저-하위직원 관계: ${employees.length}`);

    return employees;
  }

  /**
   * 계층구조 WBS를 생성한다
   * @param projectId 프로젝트 ID
   * @param maxLevel 최대 레벨
   * @param itemsPerLevel 레벨당 항목 수
   * @returns 생성된 WBS 항목 데이터
   */
  async 계층구조_WBS를_생성한다(
    projectId: string,
    maxLevel: number = 3,
    itemsPerLevel: number = 2,
  ): Promise<WbsItemDto[]> {
    const wbsItems =
      await this.wbsItemTestService.계층구조_WBS_테스트데이터를_생성한다(
        projectId,
        maxLevel,
        itemsPerLevel,
      );
    console.log(`생성된 계층구조 WBS 항목 수: ${wbsItems.length}`);

    return wbsItems;
  }

  /**
   * 평가 시스템용 완전한 테스트 데이터를 생성한다
   * @returns 생성된 모든 데이터
   */
  async 평가시스템용_완전한_테스트데이터를_생성한다(): Promise<{
    departments: DepartmentDto[];
    employees: EmployeeDto[];
    projects: ProjectDto[];
    wbsItems: WbsItemDto[];
    periods: EvaluationPeriodDto[];
  }> {
    // 1. 기존 테스트 데이터 정리
    await this.테스트_데이터를_정리한다();

    // 2. 부서 구조 생성
    const departments =
      await this.departmentTestService.테스트용_목데이터를_생성한다();

    // 3. 직원 생성 (자동 확인 및 생성)
    const employees =
      await this.employeeTestService.직원_데이터를_확인하고_생성한다(10);

    // 4. 프로젝트 생성
    const projects =
      await this.projectTestService.테스트용_목데이터를_생성한다();

    // 5. 각 프로젝트에 대해 WBS 항목 생성
    const allWbsItems: WbsItemDto[] = [];
    for (const project of projects) {
      if (project.status === 'ACTIVE') {
        const wbsItems =
          await this.wbsItemTestService.테스트용_목데이터를_생성한다(
            project.id,
          );
        allWbsItems.push(...wbsItems);
      }
    }

    // 6. 평가기간 데이터 생성
    const periods = await this.테스트용_평가기간을_생성한다();

    console.log(
      `부서 ${departments.length}, 직원 ${employees.length}, 프로젝트 ${projects.length}, WBS 항목 ${allWbsItems.length}, 평가기간 ${periods.length} 생성 완료`,
    );

    return {
      departments,
      employees,
      projects,
      wbsItems: allWbsItems,
      periods,
    };
  }

  /**
   * 테스트 데이터를 정리한다
   * @returns 정리된 데이터 수
   */
  async 테스트_데이터를_정리한다(): Promise<{
    departments: number;
    employees: number;
    projects: number;
    wbsItems: number;
    periods: number;
  }> {
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
      this.평가기간_테스트데이터를_정리한다(),
    ]);

    return {
      departments: departmentCount,
      employees: employeeCount,
      projects: projectCount,
      wbsItems: wbsItemCount,
      periods: periodCount,
    };
  }

  /**
   * 평가기간 테스트 데이터를 정리한다
   * @returns 정리된 평가기간 수
   */
  async 평가기간_테스트데이터를_정리한다(): Promise<number> {
    const periods = await this.evaluationPeriodRepository.find();
    if (periods.length > 0) {
      await this.evaluationPeriodRepository.remove(periods);
    }
    return periods.length;
  }

  /**
   * 모든 테스트 데이터를 삭제한다
   * @returns 삭제된 데이터 수
   */
  async 모든_테스트데이터를_삭제한다(): Promise<{
    departments: number;
    employees: number;
    projects: number;
    wbsItems: number;
  }> {
    const [departmentCount, employeeCount, projectCount, wbsItemCount] =
      await Promise.all([
        this.departmentTestService.모든_테스트데이터를_삭제한다(),
        this.employeeTestService.모든_테스트데이터를_삭제한다(),
        this.projectTestService.모든_테스트데이터를_삭제한다(),
        this.wbsItemTestService.모든_테스트데이터를_삭제한다(),
      ]);

    return {
      departments: departmentCount,
      employees: employeeCount,
      projects: projectCount,
      wbsItems: wbsItemCount,
    };
  }

  /**
   * 테스트 환경 상태를 확인한다
   * @returns 현재 테스트 환경 상태
   */
  async 테스트환경_상태를_확인한다(): Promise<{
    departmentCount: number;
    employeeCount: number;
    projectCount: number;
    wbsItemCount: number;
  }> {
    const employeeCount =
      await this.employeeTestService.현재_직원_수를_조회한다();

    console.log(`현재 테스트 환경 상태 - 직원: ${employeeCount}명`);

    return {
      departmentCount: 0,
      employeeCount,
      projectCount: 0,
      wbsItemCount: 0,
    };
  }

  /**
   * 직원 데이터만 확인하고 필요시 생성한다
   * @param minCount 최소 필요한 직원 수
   * @returns 직원 목록
   */
  async 직원_데이터를_확인하고_준비한다(
    minCount: number = 3,
  ): Promise<EmployeeDto[]> {
    console.log('=== 직원 데이터 확인 및 준비 ===');
    const employees =
      await this.employeeTestService.직원_데이터를_확인하고_생성한다(minCount);
    console.log(`준비된 직원 수: ${employees.length}`);
    return employees;
  }

  /**
   * 테스트용 WBS 할당 데이터를 생성한다
   * @param employees 직원 목록
   * @param projects 프로젝트 목록
   * @param wbsItems WBS 항목 목록
   * @param periods 평가기간 목록
   * @returns 생성된 WBS 할당 목록
   */
  async 테스트용_WBS할당을_생성한다(
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
      console.log('WBS 할당 생성을 위한 데이터가 부족합니다.');
      return [];
    }

    // 진행 중인 평가기간 찾기
    const inProgressPeriod = periods.find(
      (p) => p.status === EvaluationPeriodStatus.IN_PROGRESS,
    );
    if (!inProgressPeriod) {
      console.log('진행 중인 평가기간이 없습니다.');
      return [];
    }

    const firstProject = projects[0];
    const assignedBy = employees[0].id; // 첫 번째 직원을 할당자로 사용
    const assignments: EvaluationWbsAssignment[] = [];

    // 각 직원에 대해 모든 WBS 항목 할당 생성
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

    console.log(`WBS 할당 ${savedAssignments.length}개 생성 완료`);
    return savedAssignments.map((a) => a.DTO로_변환한다());
  }
}
