import { Department } from '@domain/common/department/department.entity';
import { DepartmentSyncService } from '@domain/common/department/department-sync.service';
import { Employee } from '@domain/common/employee/employee.entity';
import { EmployeeSyncService } from '@/context/organization-management-context/employee-sync.service';
import { Project } from '@domain/common/project/project.entity';
import { ProjectStatus } from '@domain/common/project/project.types';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { WbsItemStatus } from '@domain/common/wbs-item/wbs-item.types';
import { faker } from '@faker-js/faker';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  DEFAULT_STATE_DISTRIBUTION,
  GeneratorResult,
  SeedDataConfig,
} from '../types';
import { DateGeneratorUtil, ProbabilityUtil } from '../utils';

const BATCH_SIZE = 500;

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
    private readonly departmentSyncService: DepartmentSyncService,
    private readonly employeeSyncService: EmployeeSyncService,
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
    let departmentIds: string[];
    if (config.useRealDepartments) {
      // 실제 부서 데이터 사용
      departmentIds = await this.조회_실제_Department들();
      this.logger.log(`실제 부서 사용: Department ${departmentIds.length}개`);
    } else {
      // Faker로 생성
      departmentIds = await this.생성_Department들(
        config.dataScale.departmentCount,
        dist,
      );
      this.logger.log(`생성 완료: Department ${departmentIds.length}개`);
    }

    // 부서가 없으면 최소 1개 생성
    if (departmentIds.length === 0) {
      this.logger.warn('부서가 없어 기본 부서 1개를 생성합니다.');
      departmentIds = await this.생성_Department들(1, dist);
    }

    // 2. Employee 생성
    const allDepartments = await this.departmentRepository.find();
    let employeeIds: string[];
    if (config.useRealEmployees) {
      // 실제 직원 데이터 사용
      employeeIds = await this.조회_실제_Employee들();
      this.logger.log(`실제 직원 사용: Employee ${employeeIds.length}개`);
    } else {
      // Faker로 생성
      employeeIds = await this.생성_Employee들(
        config.dataScale.employeeCount,
        allDepartments,
        dist,
        config.clearExisting,
      );
      this.logger.log(`생성 완료: Employee ${employeeIds.length}개`);
    }

    // 직원이 없으면 최소 1명 생성
    if (employeeIds.length === 0) {
      this.logger.warn('직원이 없어 기본 직원 1명을 생성합니다.');
      employeeIds = await this.생성_Employee들(1, allDepartments, dist, true);
    }

    // 3. 첫 번째 직원을 관리자로 사용하여 Department의 createdBy 업데이트
    const systemAdminId = employeeIds[0];

    // 실제 부서 데이터를 사용하지 않은 경우에만 업데이트
    if (!config.useRealDepartments) {
      await this.업데이트_Department_생성자(departmentIds, systemAdminId);
      this.logger.log(`Department createdBy 업데이트 완료`);
    }

    // 실제 직원 데이터를 사용하지 않은 경우에만 업데이트
    if (!config.useRealEmployees) {
      await this.업데이트_Employee_생성자(employeeIds, systemAdminId);
      this.logger.log(`Employee createdBy/excludedBy 업데이트 완료`);
    }

    // 4. Project 생성
    const projectIds = await this.생성_Project들(
      config.dataScale.projectCount,
      employeeIds,
      dist,
      systemAdminId,
    );
    this.logger.log(`생성 완료: Project ${projectIds.length}개`);

    // 5. WbsItem 계층 생성 (프로젝트별)
    const wbsIds = await this.생성_WbsItem들(
      projectIds,
      config.dataScale.wbsPerProject,
      employeeIds,
      dist,
      systemAdminId,
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
        systemAdminId, // 시스템 관리자 ID 추가
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

    // 1단계: 회사 생성 (최상위) - createdBy는 나중에 업데이트
    for (let i = 0; i < companyCount; i++) {
      const dept = new Department();
      dept.name = `${faker.company.name()} 회사`;
      dept.code = `COMP-${String(i + 1).padStart(3, '0')}`;
      dept.order = deptCounter++;
      dept.externalId = faker.string.uuid();
      dept.externalCreatedAt = new Date();
      dept.externalUpdatedAt = new Date();
      // createdBy는 나중에 업데이트하므로 일단 임시 값 설정
      dept.createdBy = 'temp-system';
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
        // createdBy는 나중에 업데이트하므로 일단 임시 값 설정
        dept.createdBy = 'temp-system';
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
        // createdBy는 나중에 업데이트하므로 일단 임시 값 설정
        dept.createdBy = 'temp-system';
        partDepts.push(dept);
        departments.push(dept);
      }
    }

    // 파트 저장
    await this.부서를_배치로_저장한다(partDepts);

    return departments.map((d) => d.id);
  }

  /**
   * Department의 createdBy를 시스템 관리자 ID로 업데이트한다
   */
  private async 업데이트_Department_생성자(
    departmentIds: string[],
    adminId: string,
  ): Promise<void> {
    await this.departmentRepository
      .createQueryBuilder()
      .update(Department)
      .set({ createdBy: adminId })
      .where('id IN (:...ids)', { ids: departmentIds })
      .execute();
  }

  private async 생성_Employee들(
    count: number,
    departments: Department[],
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    clearExisting: boolean = true,
  ): Promise<string[]> {
    const employees: Employee[] = [];

    // 고유한 employeeNumber 생성을 위한 타임스탬프 접미사
    const timestamp = Date.now().toString().slice(-6);

    // clearExisting=false 모드에서는 기존 시스템 관리자 확인
    let existingAdminId: string | null = null;
    if (!clearExisting) {
      const existingAdmin = await this.employeeRepository.findOne({
        where: {
          email: 'admin@system.com',
          deletedAt: IsNull(),
        },
      });

      if (existingAdmin) {
        this.logger.log('기존 시스템 관리자 계정 사용: admin@system.com');
        existingAdminId = existingAdmin.id;
      }
    }

    // 시스템 관리자가 없는 경우에만 생성
    if (!existingAdminId) {
      // 첫 번째 직원을 먼저 생성하고 저장 (시스템 관리자 역할)
      const adminEmp = new Employee();
      adminEmp.employeeNumber = `EMP${timestamp}001`;
      adminEmp.name = '시스템 관리자';
      adminEmp.email = 'admin@system.com';
      adminEmp.phoneNumber = faker.phone.number('010-####-####');
      adminEmp.dateOfBirth = faker.date.birthdate({
        min: 30,
        max: 50,
        mode: 'age',
      });
      adminEmp.gender = 'MALE';
      adminEmp.hireDate = DateGeneratorUtil.generatePastDate(3650);
      adminEmp.status = '재직중';
      adminEmp.isExcludedFromList = false;

      // 첫 번째 부서에 할당
      const firstDept = departments[0];
      adminEmp.departmentId = firstDept.externalId;
      adminEmp.externalId = faker.string.uuid();
      adminEmp.externalCreatedAt = new Date();
      adminEmp.externalUpdatedAt = new Date();
      // 첫 번째 직원은 자기 자신을 생성자로 설정 (나중에 업데이트)
      adminEmp.createdBy = 'temp-system';

      employees.push(adminEmp);
    }

    // 나머지 직원 생성
    // existingAdminId가 있으면 i=0부터, 없으면 i=1부터 시작
    const startIndex = existingAdminId ? 0 : 1;
    for (let i = startIndex; i < count; i++) {
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
      emp.isExcludedFromList = ProbabilityUtil.rollDice(dist.excludedFromList);

      if (emp.isExcludedFromList) {
        emp.excludeReason = this.생성_제외_사유(emp.status);
        // excludedBy는 나중에 첫 번째 직원 ID로 업데이트
        emp.excludedBy = 'temp-system';
        emp.excludedAt = new Date();
      }

      // 랜덤 부서 할당 (externalId 사용)
      const randomDept =
        departments[Math.floor(Math.random() * departments.length)];
      emp.departmentId = randomDept.externalId; // externalId로 매칭
      emp.externalId = faker.string.uuid();
      emp.externalCreatedAt = new Date();
      emp.externalUpdatedAt = new Date();
      emp.createdBy = 'temp-system'; // 임시로 temp-system (나중에 업데이트)

      employees.push(emp);
    }

    // 배치 저장
    let saved: Employee[] = [];
    if (employees.length > 0) {
      saved = await this.직원을_배치로_저장한다(employees);
    }

    // 기존 관리자가 있는 경우 첫 번째에 추가
    if (existingAdminId) {
      return [existingAdminId, ...saved.map((e) => e.id)];
    }

    return saved.map((e) => e.id);
  }

  /**
   * Employee의 createdBy와 excludedBy를 시스템 관리자 ID로 업데이트한다
   */
  private async 업데이트_Employee_생성자(
    employeeIds: string[],
    adminId: string,
  ): Promise<void> {
    // createdBy 업데이트
    await this.employeeRepository
      .createQueryBuilder()
      .update(Employee)
      .set({ createdBy: adminId })
      .where('id IN (:...ids)', { ids: employeeIds })
      .andWhere("createdBy = 'temp-system'")
      .execute();

    // excludedBy 업데이트 (제외된 직원만)
    await this.employeeRepository
      .createQueryBuilder()
      .update(Employee)
      .set({ excludedBy: adminId })
      .where('id IN (:...ids)', { ids: employeeIds })
      .andWhere("excludedBy = 'temp-system'")
      .andWhere('isExcludedFromList = :isExcluded', { isExcluded: true })
      .execute();
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
    systemAdminId: string,
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

      project.createdBy = systemAdminId;
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
    systemAdminId: string,
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
          systemAdminId,
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
              systemAdminId,
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
    systemAdminId: string,
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

    wbs.createdBy = systemAdminId;
    return wbs;
  }

  // ==================== 실제 데이터 조회 메서드 ====================

  /**
   * 외부 서버에서 실제 부서 데이터를 동기화하고 조회한다
   */
  private async 조회_실제_Department들(): Promise<string[]> {
    try {
      // 1. 외부 서버에서 부서 데이터 동기화
      this.logger.log('외부 서버에서 부서 데이터를 동기화합니다...');
      const syncResult = await this.departmentSyncService.syncDepartments(true);

      if (!syncResult.success) {
        this.logger.warn(
          `부서 동기화 실패: ${syncResult.errors.join(', ')}. Faker 데이터로 대체됩니다.`,
        );
        return [];
      }

      this.logger.log(
        `부서 동기화 완료: ${syncResult.created}개 생성, ${syncResult.updated}개 업데이트`,
      );

      // 2. 동기화된 부서 데이터 조회
      const departments = await this.departmentRepository.find({
        where: { deletedAt: IsNull() },
        order: { order: 'ASC', name: 'ASC' },
      });

      if (departments.length === 0) {
        this.logger.warn(
          '동기화된 부서 데이터가 없습니다. Faker 데이터로 대체됩니다.',
        );
        return [];
      }

      this.logger.log(`동기화된 부서 ${departments.length}개를 사용합니다.`);
      return departments.map((d) => d.id);
    } catch (error) {
      this.logger.error('부서 동기화/조회 실패:', error.message);
      this.logger.warn('Faker 데이터로 대체됩니다.');
      return [];
    }
  }

  /**
   * 외부 서버에서 실제 직원 데이터를 동기화하고 조회한다
   */
  private async 조회_실제_Employee들(): Promise<string[]> {
    try {
      // 1. 외부 서버에서 직원 데이터 동기화
      this.logger.log('외부 서버에서 직원 데이터를 동기화합니다...');
      const syncResult = await this.employeeSyncService.syncEmployees(true);

      if (!syncResult.success) {
        this.logger.warn(
          `직원 동기화 실패: ${syncResult.errors.join(', ')}. Faker 데이터로 대체됩니다.`,
        );
        return [];
      }

      this.logger.log(
        `직원 동기화 완료: ${syncResult.created}개 생성, ${syncResult.updated}개 업데이트`,
      );

      // 2. 동기화된 직원 데이터 조회 (삭제되지 않고, 제외되지 않고, 재직중인 것만)
      const employees = await this.employeeRepository.find({
        where: {
          deletedAt: IsNull(),
          isExcludedFromList: false,
          status: '재직중', // 재직중인 직원만 평가 대상으로 포함
        },
        order: { name: 'ASC' },
      });

      if (employees.length === 0) {
        this.logger.warn(
          '재직중인 직원 데이터가 없습니다. Faker 데이터로 대체됩니다.',
        );
        return [];
      }

      this.logger.log(
        `재직중인 직원 ${employees.length}명을 평가 대상으로 사용합니다.`,
      );
      return employees.map((e) => e.id);
    } catch (error) {
      this.logger.error('직원 동기화/조회 실패:', error.message);
      this.logger.warn('Faker 데이터로 대체됩니다.');
      return [];
    }
  }

  // ==================== 배치 저장 헬퍼 메서드들 ====================

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
