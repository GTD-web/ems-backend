import { Department } from '@domain/common/department/department.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Project } from '@domain/common/project/project.entity';
import { ProjectStatus } from '@domain/common/project/project.types';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { WbsItemStatus } from '@domain/common/wbs-item/wbs-item.types';
import { faker } from '@faker-js/faker';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DEFAULT_STATE_DISTRIBUTION,
  GeneratorResult,
  SeedDataConfig,
} from '../types';
import { DateGeneratorUtil, ProbabilityUtil } from '../utils';

const BATCH_SIZE = 500;
const CREATED_BY = 'seed-generator';

@Injectable()
export class Phase1OrganizationGenerator {
  private readonly logger = new Logger(Phase1OrganizationGenerator.name);

  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(WbsItem)
    private readonly wbsItemRepository: Repository<WbsItem>,
  ) {}
  // Note: @faker-js/faker v8+ 에서는 로케일 설정 방식이 변경되었습니다.
  // 한국어 특화 데이터가 필요한 경우 별도로 처리합니다.

  async generate(config: SeedDataConfig): Promise<GeneratorResult> {
    const startTime = Date.now();
    const dist = {
      ...DEFAULT_STATE_DISTRIBUTION,
      ...config.stateDistribution,
    };

    this.logger.log('Phase 1 시작: 조직 데이터 생성');

    // 1. Department 계층 생성
    const departmentIds = await this.생성_Department들(
      config.dataScale.departmentCount,
      dist,
    );
    this.logger.log(`생성 완료: Department ${departmentIds.length}개`);

    // 2. Employee 생성 (부서 전체 정보를 전달)
    const allDepartments = await this.departmentRepository.find();
    const employeeIds = await this.생성_Employee들(
      config.dataScale.employeeCount,
      allDepartments,
      dist,
    );
    this.logger.log(`생성 완료: Employee ${employeeIds.length}개`);

    // 3. Project 생성
    const projectIds = await this.생성_Project들(
      config.dataScale.projectCount,
      employeeIds,
      dist,
    );
    this.logger.log(`생성 완료: Project ${projectIds.length}개`);

    // 4. WbsItem 계층 생성 (프로젝트별)
    const wbsIds = await this.생성_WbsItem들(
      projectIds,
      config.dataScale.wbsPerProject,
      employeeIds,
      dist,
    );
    this.logger.log(`생성 완료: WbsItem ${wbsIds.length}개`);

    const duration = Date.now() - startTime;
    this.logger.log(`Phase 1 완료 (${duration}ms)`);

    return {
      phase: 'Phase1',
      entityCounts: {
        Department: departmentIds.length,
        Employee: employeeIds.length,
        Project: projectIds.length,
        WbsItem: wbsIds.length,
      },
      generatedIds: {
        departmentIds,
        employeeIds,
        projectIds,
        wbsIds,
      },
      duration,
    };
  }

  private async 생성_Department들(
    count: number,
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
  ): Promise<string[]> {
    const hierarchy = dist.departmentHierarchy;
    const departments: Department[] = [];

    // 3단계 고정 구조: 회사 → 본부 → 파트
    // 계층별 부서 수 계산 (피라미드 구조)
    const companyCount = 1; // 회사는 무조건 1개
    const headquarterCount = Math.ceil((count - companyCount) * 0.3); // 30% - 본부
    const partCount = count - companyCount - headquarterCount; // 나머지 70% - 파트

    let deptCounter = 0;

    // 1단계: 회사 생성 (최상위)
    for (let i = 0; i < companyCount; i++) {
      const dept = new Department();
      dept.name = `${faker.company.name()} 회사`;
      dept.code = `COMP-${String(i + 1).padStart(3, '0')}`;
      dept.order = deptCounter++;
      dept.externalId = faker.string.uuid();
      dept.externalCreatedAt = new Date();
      dept.externalUpdatedAt = new Date();
      dept.createdBy = CREATED_BY;
      departments.push(dept);
    }

    // 회사 저장
    const savedCompanies = await this.부서를_배치로_저장한다(departments);

    // 2단계: 본부 생성
    const headquarterDepts: Department[] = [];
    const hqPerCompany = Math.ceil(headquarterCount / savedCompanies.length);

    for (const company of savedCompanies) {
      const hqCount = Math.min(
        hqPerCompany,
        headquarterCount - headquarterDepts.length,
      );
      for (let i = 0; i < hqCount; i++) {
        const dept = new Department();
        dept.name = `${faker.commerce.department()} 본부`;
        dept.code = `HQ-${String(deptCounter + 1).padStart(3, '0')}`;
        dept.order = deptCounter++;
        dept.parentDepartmentId = company.externalId; // externalId로 매칭
        dept.externalId = faker.string.uuid();
        dept.externalCreatedAt = new Date();
        dept.externalUpdatedAt = new Date();
        dept.createdBy = CREATED_BY;
        headquarterDepts.push(dept);
        departments.push(dept);
      }
    }

    // 본부 저장
    const savedHeadquarters =
      await this.부서를_배치로_저장한다(headquarterDepts);

    // 3단계: 파트 생성
    const partDepts: Department[] = [];
    const partPerHq = Math.ceil(partCount / savedHeadquarters.length);

    for (const hq of savedHeadquarters) {
      const pCount = Math.min(partPerHq, partCount - partDepts.length);
      for (let i = 0; i < pCount; i++) {
        const dept = new Department();
        dept.name = `${faker.commerce.productAdjective()} 파트`;
        dept.code = `PART-${String(deptCounter + 1).padStart(3, '0')}`;
        dept.order = deptCounter++;
        dept.parentDepartmentId = hq.externalId; // externalId로 매칭
        dept.externalId = faker.string.uuid();
        dept.externalCreatedAt = new Date();
        dept.externalUpdatedAt = new Date();
        dept.createdBy = CREATED_BY;
        partDepts.push(dept);
        departments.push(dept);
      }
    }

    // 파트 저장
    await this.부서를_배치로_저장한다(partDepts);

    return departments.map((d) => d.id);
  }

  private async 생성_Employee들(
    count: number,
    departments: Department[],
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
  ): Promise<string[]> {
    const employees: Employee[] = [];

    // 고유한 employeeNumber 생성을 위한 타임스탬프 접미사
    const timestamp = Date.now().toString().slice(-6);

    for (let i = 0; i < count; i++) {
      const emp = new Employee();
      emp.employeeNumber = `EMP${timestamp}${String(i + 1).padStart(3, '0')}`;
      emp.name = faker.person.fullName();
      emp.email = faker.internet.email();
      emp.phoneNumber = faker.phone.number('010-####-####');
      emp.dateOfBirth = faker.date.birthdate({ min: 25, max: 55, mode: 'age' });
      emp.gender = Math.random() > 0.5 ? 'MALE' : 'FEMALE';
      emp.hireDate = DateGeneratorUtil.generatePastDate(3650); // 최대 10년 전

      // 상태 결정
      const statusKey = ProbabilityUtil.selectByProbability(
        dist.employeeStatus,
      );
      emp.status =
        statusKey === 'active'
          ? '재직중'
          : statusKey === 'onLeave'
            ? '휴직중'
            : '퇴사';

      // 조회 제외 여부 결정
      emp.isExcludedFromList = ProbabilityUtil.rollDice(
        dist.excludedFromList,
      );

      if (emp.isExcludedFromList) {
        emp.excludeReason = this.생성_제외_사유(emp.status);
        emp.excludedBy = CREATED_BY;
        emp.excludedAt = new Date();
      }

      // 랜덤 부서 할당 (externalId 사용)
      const randomDept =
        departments[Math.floor(Math.random() * departments.length)];
      emp.departmentId = randomDept.externalId; // externalId로 매칭
      emp.externalId = faker.string.uuid();
      emp.externalCreatedAt = new Date();
      emp.externalUpdatedAt = new Date();
      emp.createdBy = CREATED_BY;

      employees.push(emp);
    }

    // 배치 저장
    const saved = await this.직원을_배치로_저장한다(employees);
    return saved.map((e) => e.id);
  }

  /**
   * 직원 상태에 따른 제외 사유를 생성한다
   */
  private 생성_제외_사유(status: string): string {
    const reasons: Record<string, string[]> = {
      퇴사: [
        '퇴사 처리 완료',
        '퇴직금 정산 완료 후 제외',
        '계약 종료로 인한 퇴사',
        '자진 퇴사 처리 완료',
      ],
      휴직중: [
        '장기 휴직으로 평가 불가',
        '육아휴직 중 (1년 이상)',
        '병가 휴직 중',
        '무급 휴직 중',
      ],
      재직중: [
        '임원으로 평가 대상 제외',
        '외부 파견 근무 중',
        '계열사 파견 중',
        '별도 평가 체계 적용',
      ],
    };

    const reasonList = reasons[status] || reasons['재직중'];
    return reasonList[Math.floor(Math.random() * reasonList.length)];
  }

  private async 생성_Project들(
    count: number,
    employeeIds: string[],
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
  ): Promise<string[]> {
    const projects: Project[] = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const project = new Project();
      project.name = `${faker.company.catchPhrase()} 프로젝트`;
      project.projectCode = `PRJ-${String(i + 1).padStart(4, '0')}`;

      // 상태 결정
      const statusKey = ProbabilityUtil.selectByProbability(dist.projectStatus);
      project.status =
        statusKey === 'active'
          ? ProjectStatus.ACTIVE
          : statusKey === 'completed'
            ? ProjectStatus.COMPLETED
            : ProjectStatus.CANCELLED;

      // 날짜 생성
      const { startDate, endDate } = DateGeneratorUtil.generateDateRange(
        DateGeneratorUtil.addMonths(now, -6),
        dist.dateGeneration.project.durationMonths.min,
        dist.dateGeneration.project.durationMonths.max,
        'months',
      );
      project.startDate = startDate;
      project.endDate = endDate;

      // 매니저 할당
      if (ProbabilityUtil.rollDice(dist.projectManagerAssignmentRatio)) {
        project.managerId =
          employeeIds[Math.floor(Math.random() * employeeIds.length)];
      }

      project.createdBy = CREATED_BY;
      projects.push(project);
    }

    // 배치 저장
    const saved = await this.프로젝트를_배치로_저장한다(projects);
    return saved.map((p) => p.id);
  }

  private async 생성_WbsItem들(
    projectIds: string[],
    wbsPerProject: number,
    employeeIds: string[],
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
  ): Promise<string[]> {
    const allWbsItems: WbsItem[] = [];
    const hierarchy = dist.wbsHierarchy;

    for (const projectId of projectIds) {
      const wbsItems: WbsItem[] = [];
      let wbsCounter = 1;

      // 1. 최상위 WBS 생성
      const rootCount = Math.min(wbsPerProject, 5); // 최상위는 최대 5개
      for (let i = 0; i < rootCount; i++) {
        const wbs = this.생성_WbsItem(
          projectId,
          wbsCounter++,
          1,
          null,
          employeeIds,
          dist,
        );
        wbsItems.push(wbs);
      }

      // 최상위 WBS 저장
      const savedRoots = await this.WBS를_배치로_저장한다(wbsItems);

      // 2. 하위 WBS 계층 생성
      let currentLevel = savedRoots;
      let currentDepth = 1;
      let totalWbs = savedRoots.length;

      while (totalWbs < wbsPerProject && currentDepth < hierarchy.maxDepth) {
        const nextLevel: WbsItem[] = [];

        for (const parent of currentLevel) {
          if (totalWbs >= wbsPerProject) break;

          const childCount = ProbabilityUtil.randomInt(
            hierarchy.childrenPerParent.min,
            Math.min(hierarchy.childrenPerParent.max, wbsPerProject - totalWbs),
          );

          for (let i = 0; i < childCount; i++) {
            const wbs = this.생성_WbsItem(
              projectId,
              wbsCounter++,
              currentDepth + 1,
              parent.id,
              employeeIds,
              dist,
            );
            nextLevel.push(wbs);
            wbsItems.push(wbs);
            totalWbs++;
          }
        }

        if (nextLevel.length > 0) {
          const saved = await this.WBS를_배치로_저장한다(nextLevel);
          currentLevel = saved;
        }
        currentDepth++;
      }

      allWbsItems.push(...wbsItems);
    }

    return allWbsItems.map((w) => w.id);
  }

  private 생성_WbsItem(
    projectId: string,
    counter: number,
    level: number,
    parentWbsId: string | null,
    employeeIds: string[],
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
  ): WbsItem {
    const wbs = new WbsItem();
    wbs.projectId = projectId;
    wbs.wbsCode = `WBS-${String(counter).padStart(4, '0')}`;
    wbs.title = `${faker.hacker.verb()} ${faker.hacker.noun()} ${level > 1 ? '세부 작업' : ''}`;
    wbs.level = level;
    if (parentWbsId) {
      wbs.parentWbsId = parentWbsId;
    }

    // 상태 결정
    const statusKey = ProbabilityUtil.selectByProbability(dist.wbsStatus);
    wbs.status =
      statusKey === 'pending'
        ? WbsItemStatus.PENDING
        : statusKey === 'inProgress'
          ? WbsItemStatus.IN_PROGRESS
          : WbsItemStatus.COMPLETED;

    // 날짜 생성
    const { startDate, endDate } = DateGeneratorUtil.generateDateRange(
      new Date(),
      dist.dateGeneration.wbs.durationDays.min,
      dist.dateGeneration.wbs.durationDays.max,
      'days',
    );
    wbs.startDate = startDate;
    wbs.endDate = endDate;

    // 진행률
    if (wbs.status === WbsItemStatus.COMPLETED) {
      wbs.progressPercentage = 100;
    } else if (wbs.status === WbsItemStatus.IN_PROGRESS) {
      wbs.progressPercentage = ProbabilityUtil.randomInt(10, 90);
    } else {
      wbs.progressPercentage = 0;
    }

    // 담당자 할당
    if (ProbabilityUtil.rollDice(dist.wbsAssignmentRatio)) {
      wbs.assignedToId =
        employeeIds[Math.floor(Math.random() * employeeIds.length)];
    }

    wbs.createdBy = CREATED_BY;
    return wbs;
  }

  // 배치 저장 헬퍼 메서드들
  private async 부서를_배치로_저장한다(
    departments: Department[],
  ): Promise<Department[]> {
    const saved: Department[] = [];
    for (let i = 0; i < departments.length; i += BATCH_SIZE) {
      const batch = departments.slice(i, i + BATCH_SIZE);
      const result = await this.departmentRepository.save(batch);
      saved.push(...result);
      this.logger.log(
        `부서 저장 진행: ${Math.min(i + BATCH_SIZE, departments.length)}/${departments.length}`,
      );
    }
    return saved;
  }

  private async 직원을_배치로_저장한다(
    employees: Employee[],
  ): Promise<Employee[]> {
    const saved: Employee[] = [];
    for (let i = 0; i < employees.length; i += BATCH_SIZE) {
      const batch = employees.slice(i, i + BATCH_SIZE);
      const result = await this.employeeRepository.save(batch);
      saved.push(...result);
      this.logger.log(
        `직원 저장 진행: ${Math.min(i + BATCH_SIZE, employees.length)}/${employees.length}`,
      );
    }
    return saved;
  }

  private async 프로젝트를_배치로_저장한다(
    projects: Project[],
  ): Promise<Project[]> {
    const saved: Project[] = [];
    for (let i = 0; i < projects.length; i += BATCH_SIZE) {
      const batch = projects.slice(i, i + BATCH_SIZE);
      const result = await this.projectRepository.save(batch);
      saved.push(...result);
      this.logger.log(
        `프로젝트 저장 진행: ${Math.min(i + BATCH_SIZE, projects.length)}/${projects.length}`,
      );
    }
    return saved;
  }

  private async WBS를_배치로_저장한다(wbsItems: WbsItem[]): Promise<WbsItem[]> {
    const saved: WbsItem[] = [];
    for (let i = 0; i < wbsItems.length; i += BATCH_SIZE) {
      const batch = wbsItems.slice(i, i + BATCH_SIZE);
      const result = await this.wbsItemRepository.save(batch);
      saved.push(...result);
      this.logger.log(
        `WBS 저장 진행: ${Math.min(i + BATCH_SIZE, wbsItems.length)}/${wbsItems.length}`,
      );
    }
    return saved;
  }
}
