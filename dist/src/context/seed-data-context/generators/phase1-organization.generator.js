"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var Phase1OrganizationGenerator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phase1OrganizationGenerator = void 0;
const department_entity_1 = require("../../../domain/common/department/department.entity");
const department_service_1 = require("../../../domain/common/department/department.service");
const organization_management_context_1 = require("../../organization-management-context");
const employee_entity_1 = require("../../../domain/common/employee/employee.entity");
const employee_service_1 = require("../../../domain/common/employee/employee.service");
const employee_sync_service_1 = require("../../organization-management-context/employee-sync.service");
const project_entity_1 = require("../../../domain/common/project/project.entity");
const project_types_1 = require("../../../domain/common/project/project.types");
const wbs_item_entity_1 = require("../../../domain/common/wbs-item/wbs-item.entity");
const wbs_item_types_1 = require("../../../domain/common/wbs-item/wbs-item.types");
const faker_1 = require("@faker-js/faker");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const types_1 = require("../types");
const utils_1 = require("../utils");
const BATCH_SIZE = 500;
let Phase1OrganizationGenerator = Phase1OrganizationGenerator_1 = class Phase1OrganizationGenerator {
    departmentRepository;
    employeeRepository;
    projectRepository;
    wbsItemRepository;
    departmentService;
    employeeService;
    departmentSyncService;
    employeeSyncService;
    logger = new common_1.Logger(Phase1OrganizationGenerator_1.name);
    constructor(departmentRepository, employeeRepository, projectRepository, wbsItemRepository, departmentService, employeeService, departmentSyncService, employeeSyncService) {
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
        this.projectRepository = projectRepository;
        this.wbsItemRepository = wbsItemRepository;
        this.departmentService = departmentService;
        this.employeeService = employeeService;
        this.departmentSyncService = departmentSyncService;
        this.employeeSyncService = employeeSyncService;
    }
    async generate(config) {
        const startTime = Date.now();
        const dist = {
            ...types_1.DEFAULT_STATE_DISTRIBUTION,
            ...config.stateDistribution,
        };
        this.logger.log('Phase 1 시작: 조직 데이터 생성');
        this.logger.log(`Phase 1 설정: useRealDepartments=${config.useRealDepartments}, useRealEmployees=${config.useRealEmployees}, departmentCount=${config.dataScale.departmentCount}, employeeCount=${config.dataScale.employeeCount}`);
        let departmentIds;
        if (config.useRealDepartments) {
            departmentIds = await this.조회_실제_Department들();
            this.logger.log(`실제 부서 사용: Department ${departmentIds.length}개`);
        }
        else {
            departmentIds = await this.생성_Department들(config.dataScale.departmentCount, dist);
            this.logger.log(`생성 완료: Department ${departmentIds.length}개`);
        }
        if (departmentIds.length === 0) {
            this.logger.warn('부서가 없어 기본 부서 1개를 생성합니다.');
            departmentIds = await this.생성_Department들(1, dist);
        }
        const allDepartments = await this.departmentService.findAll();
        let employeeIds;
        if (config.useRealEmployees) {
            employeeIds = await this.조회_실제_Employee들();
            this.logger.log(`실제 직원 사용: Employee ${employeeIds.length}개`);
        }
        else {
            employeeIds = await this.생성_Employee들(config.dataScale.employeeCount, allDepartments, dist, config.clearExisting);
            this.logger.log(`생성 완료: Employee ${employeeIds.length}개`);
        }
        if (employeeIds.length === 0) {
            this.logger.warn('직원이 없어 기본 직원 1명을 생성합니다.');
            employeeIds = await this.생성_Employee들(1, allDepartments, dist, true);
        }
        const systemAdminId = employeeIds[0];
        if (!config.useRealDepartments) {
            await this.업데이트_Department_생성자(departmentIds, systemAdminId);
            this.logger.log(`Department createdBy 업데이트 완료`);
        }
        if (!config.useRealEmployees) {
            await this.업데이트_Employee_생성자(employeeIds, systemAdminId);
            this.logger.log(`Employee createdBy/excludedBy 업데이트 완료`);
        }
        this.logger.log(`🔍 부서장 설정 조건 확인 - useRealDepartments: ${config.useRealDepartments}, useRealEmployees: ${config.useRealEmployees}, currentUserId: ${config.currentUserId || 'undefined'}`);
        if (!config.useRealDepartments &&
            !config.useRealEmployees &&
            !config.currentUserId) {
            this.logger.log('✅ 부서장 설정 시작');
            const latestDepartments = await this.departmentService.findAll();
            this.logger.log(`📊 조회된 부서: ${latestDepartments.length}개, 직원: ${employeeIds.length}명`);
            await this.부서장을_설정한다(employeeIds, latestDepartments);
            this.logger.log(`✅ 부서장 설정 완료`);
        }
        else {
            if (config.currentUserId) {
                this.logger.log('⏭️ 부서장 설정 건너뜀 (currentUserId 설정으로 인해 모든 직원의 managerId가 덮어써지므로)');
            }
            else {
                this.logger.log('⏭️ 부서장 설정 건너뜀 (실제 데이터 사용 중)');
            }
        }
        this.logger.log(`🔍 currentUserId 확인: ${config.currentUserId || 'undefined'}`);
        console.log(...oo_oo(`1008766558_151_4_153_5_4`, `🔍 [Phase1] currentUserId 확인: ${config.currentUserId || 'undefined'}`));
        if (config.currentUserId) {
            this.logger.log(`✅ 현재 사용자를 모든 직원의 관리자로 설정 시작 (currentUserId: ${config.currentUserId})`);
            console.log(...oo_oo(`1008766558_158_6_160_7_4`, `✅ [Phase1] 현재 사용자를 모든 직원의 관리자로 설정 시작 (currentUserId: ${config.currentUserId})`));
            await this.현재_사용자를_모든_직원의_관리자로_설정한다(employeeIds, config.currentUserId);
            this.logger.log(`✅ 현재 사용자를 모든 직원의 관리자로 설정 완료`);
            console.log(...oo_oo(`1008766558_166_6_168_7_4`, `✅ [Phase1] 현재 사용자를 모든 직원의 관리자로 설정 완료`));
        }
        else {
            this.logger.log('⚠️ currentUserId가 없어 관리자 설정을 건너뜁니다.');
            console.log(...oo_oo(`1008766558_171_6_173_7_4`, '⚠️ [Phase1] currentUserId가 없어 관리자 설정을 건너뜁니다.'));
        }
        const projectIds = await this.생성_Project들(config.dataScale.projectCount, employeeIds, dist, systemAdminId);
        this.logger.log(`생성 완료: Project ${projectIds.length}개`);
        const wbsIds = await this.생성_WbsItem들(projectIds, config.dataScale.wbsPerProject, employeeIds, dist, systemAdminId);
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
                systemAdminId,
            },
            duration,
        };
    }
    async 생성_Department들(count, dist) {
        const hierarchy = dist.departmentHierarchy;
        const departments = [];
        const companyCount = 1;
        const headquarterCount = Math.ceil((count - companyCount) * 0.3);
        const partCount = count - companyCount - headquarterCount;
        let deptCounter = 0;
        for (let i = 0; i < companyCount; i++) {
            const dept = new department_entity_1.Department();
            dept.name = `${faker_1.faker.company.name()} 회사`;
            dept.code = `COMP-${String(i + 1).padStart(3, '0')}`;
            dept.order = deptCounter++;
            dept.externalId = faker_1.faker.string.uuid();
            dept.externalCreatedAt = new Date();
            dept.externalUpdatedAt = new Date();
            dept.createdBy = 'temp-system';
            departments.push(dept);
        }
        const savedCompanies = await this.부서를_배치로_저장한다(departments);
        const headquarterDepts = [];
        const hqPerCompany = Math.ceil(headquarterCount / savedCompanies.length);
        for (const company of savedCompanies) {
            const hqCount = Math.min(hqPerCompany, headquarterCount - headquarterDepts.length);
            for (let i = 0; i < hqCount; i++) {
                const dept = new department_entity_1.Department();
                dept.name = `${faker_1.faker.commerce.department()} 본부`;
                dept.code = `HQ-${String(deptCounter + 1).padStart(3, '0')}`;
                dept.order = deptCounter++;
                dept.parentDepartmentId = company.externalId;
                dept.externalId = faker_1.faker.string.uuid();
                dept.externalCreatedAt = new Date();
                dept.externalUpdatedAt = new Date();
                dept.createdBy = 'temp-system';
                headquarterDepts.push(dept);
                departments.push(dept);
            }
        }
        const savedHeadquarters = await this.부서를_배치로_저장한다(headquarterDepts);
        const partDepts = [];
        const partPerHq = Math.ceil(partCount / savedHeadquarters.length);
        for (const hq of savedHeadquarters) {
            const pCount = Math.min(partPerHq, partCount - partDepts.length);
            for (let i = 0; i < pCount; i++) {
                const dept = new department_entity_1.Department();
                dept.name = `${faker_1.faker.commerce.productAdjective()} 파트`;
                dept.code = `PART-${String(deptCounter + 1).padStart(3, '0')}`;
                dept.order = deptCounter++;
                dept.parentDepartmentId = hq.externalId;
                dept.externalId = faker_1.faker.string.uuid();
                dept.externalCreatedAt = new Date();
                dept.externalUpdatedAt = new Date();
                dept.createdBy = 'temp-system';
                partDepts.push(dept);
                departments.push(dept);
            }
        }
        await this.부서를_배치로_저장한다(partDepts);
        return departments.map((d) => d.id);
    }
    async 업데이트_Department_생성자(departmentIds, adminId) {
        await this.departmentRepository
            .createQueryBuilder()
            .update(department_entity_1.Department)
            .set({ createdBy: adminId })
            .where('id IN (:...ids)', { ids: departmentIds })
            .execute();
    }
    async 생성_Employee들(count, departments, dist, clearExisting = true) {
        const employees = [];
        const timestamp = Date.now().toString().slice(-6);
        let existingAdminId = null;
        if (!clearExisting) {
            const existingAdminDto = await this.employeeService.이메일로_조회한다('admin@system.com');
            if (existingAdminDto) {
                this.logger.log('기존 시스템 관리자 계정 사용: admin@system.com');
                existingAdminId = existingAdminDto.id;
            }
        }
        if (!existingAdminId) {
            const adminEmp = new employee_entity_1.Employee();
            adminEmp.employeeNumber = `EMP${timestamp}001`;
            adminEmp.name = '시스템 관리자';
            adminEmp.email = 'admin@system.com';
            adminEmp.phoneNumber =
                faker_1.faker.string.numeric(3) +
                    '-' +
                    faker_1.faker.string.numeric(4) +
                    '-' +
                    faker_1.faker.string.numeric(4);
            adminEmp.dateOfBirth = faker_1.faker.date.birthdate({
                min: 30,
                max: 50,
                mode: 'age',
            });
            adminEmp.gender = 'MALE';
            adminEmp.hireDate = utils_1.DateGeneratorUtil.generatePastDate(3650);
            adminEmp.status = '재직중';
            adminEmp.isExcludedFromList = false;
            const firstDept = departments[0];
            adminEmp.departmentId = firstDept.externalId;
            adminEmp.externalId = faker_1.faker.string.uuid();
            adminEmp.externalCreatedAt = new Date();
            adminEmp.externalUpdatedAt = new Date();
            adminEmp.createdBy = 'temp-system';
            employees.push(adminEmp);
        }
        const startIndex = existingAdminId ? 0 : 1;
        for (let i = startIndex; i < count; i++) {
            const emp = new employee_entity_1.Employee();
            emp.employeeNumber = `EMP${timestamp}${String(i + 1).padStart(3, '0')}`;
            emp.name = faker_1.faker.person.fullName();
            emp.email = faker_1.faker.internet.email();
            emp.phoneNumber =
                faker_1.faker.string.numeric(3) +
                    '-' +
                    faker_1.faker.string.numeric(4) +
                    '-' +
                    faker_1.faker.string.numeric(4);
            emp.dateOfBirth = faker_1.faker.date.birthdate({ min: 25, max: 55, mode: 'age' });
            emp.gender = Math.random() > 0.5 ? 'MALE' : 'FEMALE';
            emp.hireDate = utils_1.DateGeneratorUtil.generatePastDate(3650);
            const statusKey = utils_1.ProbabilityUtil.selectByProbability(dist.employeeStatus);
            emp.status =
                statusKey === 'active'
                    ? '재직중'
                    : statusKey === 'onLeave'
                        ? '휴직중'
                        : '퇴사';
            emp.isExcludedFromList = utils_1.ProbabilityUtil.rollDice(dist.excludedFromList);
            if (emp.isExcludedFromList) {
                emp.excludeReason = this.생성_제외_사유(emp.status);
                emp.excludedBy = 'temp-system';
                emp.excludedAt = new Date();
            }
            const randomDept = departments[Math.floor(Math.random() * departments.length)];
            emp.departmentId = randomDept.id;
            emp.externalId = faker_1.faker.string.uuid();
            emp.externalCreatedAt = new Date();
            emp.externalUpdatedAt = new Date();
            emp.createdBy = 'temp-system';
            employees.push(emp);
        }
        let saved = [];
        if (employees.length > 0) {
            saved = await this.직원을_배치로_저장한다(employees);
        }
        if (existingAdminId) {
            return [existingAdminId, ...saved.map((e) => e.id)];
        }
        const employeeIds = saved.map((e) => e.id);
        return employeeIds;
    }
    async 업데이트_Employee_생성자(employeeIds, adminId) {
        await this.employeeRepository
            .createQueryBuilder()
            .update(employee_entity_1.Employee)
            .set({ createdBy: adminId })
            .where('id IN (:...ids)', { ids: employeeIds })
            .andWhere("createdBy = 'temp-system'")
            .execute();
        await this.employeeRepository
            .createQueryBuilder()
            .update(employee_entity_1.Employee)
            .set({ excludedBy: adminId })
            .where('id IN (:...ids)', { ids: employeeIds })
            .andWhere("excludedBy = 'temp-system'")
            .andWhere('isExcludedFromList = :isExcluded', { isExcluded: true })
            .execute();
    }
    생성_제외_사유(status) {
        const reasons = {
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
    async 생성_Project들(count, employeeIds, dist, systemAdminId) {
        const projects = [];
        const now = new Date();
        for (let i = 0; i < count; i++) {
            const project = new project_entity_1.Project();
            project.name = `${faker_1.faker.company.catchPhrase()} 프로젝트`;
            project.projectCode = `PRJ-${String(i + 1).padStart(4, '0')}`;
            const statusKey = utils_1.ProbabilityUtil.selectByProbability(dist.projectStatus);
            project.status =
                statusKey === 'active'
                    ? project_types_1.ProjectStatus.ACTIVE
                    : statusKey === 'completed'
                        ? project_types_1.ProjectStatus.COMPLETED
                        : project_types_1.ProjectStatus.CANCELLED;
            const { startDate, endDate } = utils_1.DateGeneratorUtil.generateDateRange(utils_1.DateGeneratorUtil.addMonths(now, -6), dist.dateGeneration.project.durationMonths.min, dist.dateGeneration.project.durationMonths.max, 'months');
            project.startDate = startDate;
            project.endDate = endDate;
            const nonSystemAdminEmployees = employeeIds.filter((id) => id !== systemAdminId);
            if (nonSystemAdminEmployees.length > 0) {
                project.managerId =
                    nonSystemAdminEmployees[Math.floor(Math.random() * nonSystemAdminEmployees.length)];
            }
            else {
                if (utils_1.ProbabilityUtil.rollDice(dist.projectManagerAssignmentRatio)) {
                    project.managerId =
                        employeeIds[Math.floor(Math.random() * employeeIds.length)];
                }
            }
            project.createdBy = systemAdminId;
            projects.push(project);
        }
        const saved = await this.프로젝트를_배치로_저장한다(projects);
        return saved.map((p) => p.id);
    }
    async 생성_WbsItem들(projectIds, wbsPerProject, employeeIds, dist, systemAdminId) {
        const allWbsItems = [];
        const hierarchy = dist.wbsHierarchy;
        for (const projectId of projectIds) {
            const wbsItems = [];
            let wbsCounter = 1;
            const rootCount = Math.min(wbsPerProject, 5);
            for (let i = 0; i < rootCount; i++) {
                const wbs = this.생성_WbsItem(projectId, wbsCounter++, 1, null, employeeIds, dist, systemAdminId);
                wbsItems.push(wbs);
            }
            const savedRoots = await this.WBS를_배치로_저장한다(wbsItems);
            let currentLevel = savedRoots;
            let currentDepth = 1;
            let totalWbs = savedRoots.length;
            while (totalWbs < wbsPerProject && currentDepth < hierarchy.maxDepth) {
                const nextLevel = [];
                for (const parent of currentLevel) {
                    if (totalWbs >= wbsPerProject)
                        break;
                    const childCount = utils_1.ProbabilityUtil.randomInt(hierarchy.childrenPerParent.min, Math.min(hierarchy.childrenPerParent.max, wbsPerProject - totalWbs));
                    for (let i = 0; i < childCount; i++) {
                        const wbs = this.생성_WbsItem(projectId, wbsCounter++, currentDepth + 1, parent.id, employeeIds, dist, systemAdminId);
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
    생성_WbsItem(projectId, counter, level, parentWbsId, employeeIds, dist, systemAdminId) {
        const wbs = new wbs_item_entity_1.WbsItem();
        wbs.projectId = projectId;
        wbs.wbsCode = `WBS-${String(counter).padStart(4, '0')}`;
        wbs.title = `${faker_1.faker.hacker.verb()} ${faker_1.faker.hacker.noun()} ${level > 1 ? '세부 작업' : ''}`;
        wbs.level = level;
        if (parentWbsId) {
            wbs.parentWbsId = parentWbsId;
        }
        const statusKey = utils_1.ProbabilityUtil.selectByProbability(dist.wbsStatus);
        wbs.status =
            statusKey === 'pending'
                ? wbs_item_types_1.WbsItemStatus.PENDING
                : statusKey === 'inProgress'
                    ? wbs_item_types_1.WbsItemStatus.IN_PROGRESS
                    : wbs_item_types_1.WbsItemStatus.COMPLETED;
        const { startDate, endDate } = utils_1.DateGeneratorUtil.generateDateRange(new Date(), dist.dateGeneration.wbs.durationDays.min, dist.dateGeneration.wbs.durationDays.max, 'days');
        wbs.startDate = startDate;
        wbs.endDate = endDate;
        if (wbs.status === wbs_item_types_1.WbsItemStatus.COMPLETED) {
            wbs.progressPercentage = 100;
        }
        else if (wbs.status === wbs_item_types_1.WbsItemStatus.IN_PROGRESS) {
            wbs.progressPercentage = utils_1.ProbabilityUtil.randomInt(10, 90);
        }
        else {
            wbs.progressPercentage = 0;
        }
        if (utils_1.ProbabilityUtil.rollDice(dist.wbsAssignmentRatio)) {
            wbs.assignedToId =
                employeeIds[Math.floor(Math.random() * employeeIds.length)];
        }
        wbs.createdBy = systemAdminId;
        return wbs;
    }
    async 조회_실제_Department들() {
        try {
            this.logger.log('외부 서버에서 부서 데이터를 동기화합니다...');
            const syncResult = await this.departmentSyncService.syncDepartments(true);
            if (!syncResult.success) {
                this.logger.warn(`부서 동기화 실패: ${syncResult.errors.join(', ')}. Faker 데이터로 대체됩니다.`);
                return [];
            }
            this.logger.log(`부서 동기화 완료: ${syncResult.created}개 생성, ${syncResult.updated}개 업데이트`);
            const departments = await this.departmentService.findAll();
            if (departments.length === 0) {
                this.logger.warn('동기화된 부서 데이터가 없습니다. Faker 데이터로 대체됩니다.');
                return [];
            }
            this.logger.log(`동기화된 부서 ${departments.length}개를 사용합니다.`);
            return departments.map((d) => d.id);
        }
        catch (error) {
            this.logger.error('부서 동기화/조회 실패:', error.message);
            this.logger.warn('Faker 데이터로 대체됩니다.');
            return [];
        }
    }
    async 조회_실제_Employee들() {
        try {
            this.logger.log('외부 서버에서 직원 데이터를 동기화합니다...');
            const syncResult = await this.employeeSyncService.syncEmployees(true);
            if (!syncResult.success) {
                this.logger.warn(`직원 동기화 실패: ${syncResult.errors.join(', ')}. Faker 데이터로 대체됩니다.`);
                return [];
            }
            this.logger.log(`직원 동기화 완료: ${syncResult.created}개 생성, ${syncResult.updated}개 업데이트`);
            const allEmployees = await this.employeeService.findAll(false);
            const employees = allEmployees.filter((emp) => emp.status === '재직중');
            if (employees.length === 0) {
                this.logger.warn('재직중인 직원 데이터가 없습니다. Faker 데이터로 대체됩니다.');
                return [];
            }
            this.logger.log(`재직중인 직원 ${employees.length}명을 평가 대상으로 사용합니다.`);
            return employees.map((e) => e.id);
        }
        catch (error) {
            this.logger.error('직원 동기화/조회 실패:', error.message);
            this.logger.warn('Faker 데이터로 대체됩니다.');
            return [];
        }
    }
    async 부서를_배치로_저장한다(departments) {
        const saved = [];
        for (let i = 0; i < departments.length; i += BATCH_SIZE) {
            const batch = departments.slice(i, i + BATCH_SIZE);
            const result = await this.departmentRepository.save(batch);
            saved.push(...result);
            this.logger.log(`부서 저장 진행: ${Math.min(i + BATCH_SIZE, departments.length)}/${departments.length}`);
        }
        return saved;
    }
    async 직원을_배치로_저장한다(employees) {
        const saved = [];
        for (let i = 0; i < employees.length; i += BATCH_SIZE) {
            const batch = employees.slice(i, i + BATCH_SIZE);
            const result = await this.employeeRepository.save(batch);
            saved.push(...result);
            this.logger.log(`직원 저장 진행: ${Math.min(i + BATCH_SIZE, employees.length)}/${employees.length}`);
        }
        return saved;
    }
    async 프로젝트를_배치로_저장한다(projects) {
        const saved = [];
        for (let i = 0; i < projects.length; i += BATCH_SIZE) {
            const batch = projects.slice(i, i + BATCH_SIZE);
            const result = await this.projectRepository.save(batch);
            saved.push(...result);
            this.logger.log(`프로젝트 저장 진행: ${Math.min(i + BATCH_SIZE, projects.length)}/${projects.length}`);
        }
        return saved;
    }
    async WBS를_배치로_저장한다(wbsItems) {
        const saved = [];
        for (let i = 0; i < wbsItems.length; i += BATCH_SIZE) {
            const batch = wbsItems.slice(i, i + BATCH_SIZE);
            const result = await this.wbsItemRepository.save(batch);
            saved.push(...result);
            this.logger.log(`WBS 저장 진행: ${Math.min(i + BATCH_SIZE, wbsItems.length)}/${wbsItems.length}`);
        }
        return saved;
    }
    async 부서장을_설정한다(employeeIds, departments) {
        this.logger.log('부서장 설정 시작');
        const departmentEmployeeMap = new Map();
        const allEmployees = await this.employeeService.findAll(true);
        const employees = allEmployees
            .filter((emp) => employeeIds.includes(emp.id))
            .sort((a, b) => {
            return a.createdAt.getTime() - b.createdAt.getTime();
        });
        for (const employee of employees) {
            if (employee.departmentId) {
                if (!departmentEmployeeMap.has(employee.departmentId)) {
                    departmentEmployeeMap.set(employee.departmentId, []);
                }
                departmentEmployeeMap.get(employee.departmentId).push(employee.id);
            }
        }
        for (const [departmentId, employeeIdsInDept] of departmentEmployeeMap) {
            if (employeeIdsInDept.length > 0) {
                const managerId = employeeIdsInDept[0];
                const department = departments.find((dept) => dept.id === departmentId);
                if (department) {
                    await this.departmentRepository.update(department.id, {
                        managerId: managerId,
                        updatedAt: new Date(),
                    });
                    this.logger.debug(`부서장 설정: 부서 ${department.name} → 직원 ${managerId}`);
                }
                for (const employeeId of employeeIdsInDept) {
                    if (employeeId !== managerId) {
                        await this.employeeRepository.update(employeeId, {
                            managerId: managerId,
                            updatedAt: new Date(),
                        });
                    }
                }
            }
        }
        this.logger.log(`부서장 설정 완료: ${departmentEmployeeMap.size}개 부서`);
    }
    async 현재_사용자를_모든_직원의_관리자로_설정한다(employeeIds, currentUserId) {
        this.logger.log(`현재 사용자를 모든 직원의 관리자로 설정: ${employeeIds.length}명`);
        console.log(...oo_oo(`1008766558_919_4_921_5_4`, `[Phase1] 현재 사용자를 모든 직원의 관리자로 설정: ${employeeIds.length}명, currentUserId: ${currentUserId}`));
        const targetEmployeeIds = employeeIds.filter((id) => id !== currentUserId);
        console.log(...oo_oo(`1008766558_926_4_928_5_4`, `[Phase1] 대상 직원 수: ${targetEmployeeIds.length}명 (전체: ${employeeIds.length}명, 현재 사용자 제외)`));
        if (targetEmployeeIds.length > 0) {
            const updateResult = await this.employeeRepository
                .createQueryBuilder()
                .update(employee_entity_1.Employee)
                .set({ managerId: currentUserId, updatedAt: new Date() })
                .where('id IN (:...ids)', { ids: targetEmployeeIds })
                .execute();
            this.logger.log(`✅ ${targetEmployeeIds.length}명의 직원에게 현재 사용자를 관리자로 설정 완료`);
            console.log(...oo_oo(`1008766558_941_6_943_7_4`, `✅ [Phase1] ${updateResult.affected}명의 직원에게 현재 사용자를 관리자로 설정 완료 (영향받은 행: ${updateResult.affected})`));
        }
        else {
            this.logger.log('⚠️ 설정할 직원이 없습니다 (모든 직원이 현재 사용자)');
            console.log(...oo_oo(`1008766558_946_6_948_7_4`, '⚠️ [Phase1] 설정할 직원이 없습니다 (모든 직원이 현재 사용자)'));
        }
    }
};
exports.Phase1OrganizationGenerator = Phase1OrganizationGenerator;
exports.Phase1OrganizationGenerator = Phase1OrganizationGenerator = Phase1OrganizationGenerator_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __param(1, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(2, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(3, (0, typeorm_1.InjectRepository)(wbs_item_entity_1.WbsItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        department_service_1.DepartmentService,
        employee_service_1.EmployeeService,
        organization_management_context_1.DepartmentSyncService,
        employee_sync_service_1.EmployeeSyncService])
], Phase1OrganizationGenerator);
;
function oo_cm() { try {
    return (0, eval)("globalThis._console_ninja") || (0, eval)("/* https://github.com/wallabyjs/console-ninja#how-does-it-work */'use strict';var _0x4d59fc=_0x4900;(function(_0x2baf26,_0x2d1d39){var _0x3a33d6=_0x4900,_0x9f2a18=_0x2baf26();while(!![]){try{var _0x5cd15e=parseInt(_0x3a33d6(0x231))/0x1*(-parseInt(_0x3a33d6(0x198))/0x2)+-parseInt(_0x3a33d6(0x1be))/0x3*(parseInt(_0x3a33d6(0x1b6))/0x4)+-parseInt(_0x3a33d6(0x1fb))/0x5*(-parseInt(_0x3a33d6(0x18c))/0x6)+parseInt(_0x3a33d6(0x16f))/0x7*(parseInt(_0x3a33d6(0x243))/0x8)+-parseInt(_0x3a33d6(0x14b))/0x9*(parseInt(_0x3a33d6(0x1fa))/0xa)+-parseInt(_0x3a33d6(0x1e7))/0xb*(parseInt(_0x3a33d6(0x1a3))/0xc)+parseInt(_0x3a33d6(0x22b))/0xd*(parseInt(_0x3a33d6(0x1d7))/0xe);if(_0x5cd15e===_0x2d1d39)break;else _0x9f2a18['push'](_0x9f2a18['shift']());}catch(_0x2d6627){_0x9f2a18['push'](_0x9f2a18['shift']());}}}(_0x3eb7,0x94f13));function z(_0x6bc09c,_0x11bf45,_0x5dc6f6,_0x33beba,_0x5a8a31,_0x40d30d){var _0x1918bf=_0x4900,_0x49d8dd,_0x12f1be,_0x2f7a82,_0x34ba65;this[_0x1918bf(0x141)]=_0x6bc09c,this[_0x1918bf(0x223)]=_0x11bf45,this[_0x1918bf(0x178)]=_0x5dc6f6,this['nodeModules']=_0x33beba,this[_0x1918bf(0x246)]=_0x5a8a31,this[_0x1918bf(0x15e)]=_0x40d30d,this[_0x1918bf(0x19b)]=!0x0,this['_allowedToConnectOnSend']=!0x0,this[_0x1918bf(0x20d)]=!0x1,this[_0x1918bf(0x1c9)]=!0x1,this[_0x1918bf(0x194)]=((_0x12f1be=(_0x49d8dd=_0x6bc09c[_0x1918bf(0x1b1)])==null?void 0x0:_0x49d8dd['env'])==null?void 0x0:_0x12f1be['NEXT_RUNTIME'])===_0x1918bf(0x1c1),this[_0x1918bf(0x1e6)]=!((_0x34ba65=(_0x2f7a82=this[_0x1918bf(0x141)][_0x1918bf(0x1b1)])==null?void 0x0:_0x2f7a82[_0x1918bf(0x195)])!=null&&_0x34ba65['node'])&&!this[_0x1918bf(0x194)],this[_0x1918bf(0x21c)]=null,this[_0x1918bf(0x1bc)]=0x0,this[_0x1918bf(0x182)]=0x14,this['_webSocketErrorDocsLink']=_0x1918bf(0x204),this['_sendErrorMessage']=(this[_0x1918bf(0x1e6)]?'Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20refreshing\\x20the\\x20page\\x20may\\x20help;\\x20also\\x20see\\x20':'Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20restarting\\x20the\\x20process\\x20may\\x20help;\\x20also\\x20see\\x20')+this[_0x1918bf(0x158)];}z['prototype'][_0x4d59fc(0x17d)]=async function(){var _0x253006=_0x4d59fc,_0x1676f7,_0x42b1de;if(this[_0x253006(0x21c)])return this['_WebSocketClass'];let _0x1b79be;if(this[_0x253006(0x1e6)]||this[_0x253006(0x194)])_0x1b79be=this[_0x253006(0x141)][_0x253006(0x21d)];else{if((_0x1676f7=this[_0x253006(0x141)]['process'])!=null&&_0x1676f7[_0x253006(0x143)])_0x1b79be=(_0x42b1de=this[_0x253006(0x141)][_0x253006(0x1b1)])==null?void 0x0:_0x42b1de[_0x253006(0x143)];else try{_0x1b79be=(await new Function('path',_0x253006(0x205),_0x253006(0x166),_0x253006(0x1cf))(await(0x0,eval)('import(\\x27path\\x27)'),await(0x0,eval)(_0x253006(0x1f0)),this[_0x253006(0x166)]))[_0x253006(0x16a)];}catch{try{_0x1b79be=require(require(_0x253006(0x22c))[_0x253006(0x21f)](this['nodeModules'],'ws'));}catch{throw new Error(_0x253006(0x19d));}}}return this['_WebSocketClass']=_0x1b79be,_0x1b79be;},z[_0x4d59fc(0x187)][_0x4d59fc(0x1a0)]=function(){var _0x1a2782=_0x4d59fc;this[_0x1a2782(0x1c9)]||this['_connected']||this[_0x1a2782(0x1bc)]>=this[_0x1a2782(0x182)]||(this[_0x1a2782(0x23a)]=!0x1,this['_connecting']=!0x0,this[_0x1a2782(0x1bc)]++,this['_ws']=new Promise((_0x44513c,_0x3c25b9)=>{var _0x15c0cc=_0x1a2782;this[_0x15c0cc(0x17d)]()[_0x15c0cc(0x1d9)](_0x28f891=>{var _0x4baee5=_0x15c0cc;let _0x3a0211=new _0x28f891(_0x4baee5(0x1e5)+(!this[_0x4baee5(0x1e6)]&&this[_0x4baee5(0x246)]?_0x4baee5(0x1d3):this['host'])+':'+this[_0x4baee5(0x178)]);_0x3a0211['onerror']=()=>{var _0x35303c=_0x4baee5;this[_0x35303c(0x19b)]=!0x1,this['_disposeWebsocket'](_0x3a0211),this['_attemptToReconnectShortly'](),_0x3c25b9(new Error(_0x35303c(0x154)));},_0x3a0211[_0x4baee5(0x167)]=()=>{var _0x208b63=_0x4baee5;this[_0x208b63(0x1e6)]||_0x3a0211[_0x208b63(0x230)]&&_0x3a0211[_0x208b63(0x230)][_0x208b63(0x14e)]&&_0x3a0211['_socket'][_0x208b63(0x14e)](),_0x44513c(_0x3a0211);},_0x3a0211['onclose']=()=>{var _0xf2c3e2=_0x4baee5;this[_0xf2c3e2(0x23a)]=!0x0,this['_disposeWebsocket'](_0x3a0211),this['_attemptToReconnectShortly']();},_0x3a0211[_0x4baee5(0x191)]=_0xce1b6=>{var _0x485e9e=_0x4baee5;try{if(!(_0xce1b6!=null&&_0xce1b6[_0x485e9e(0x1e3)])||!this[_0x485e9e(0x15e)])return;let _0xca6fe9=JSON[_0x485e9e(0x200)](_0xce1b6[_0x485e9e(0x1e3)]);this[_0x485e9e(0x15e)](_0xca6fe9['method'],_0xca6fe9[_0x485e9e(0x164)],this[_0x485e9e(0x141)],this['_inBrowser']);}catch{}};})[_0x15c0cc(0x1d9)](_0x2a0e8e=>(this[_0x15c0cc(0x20d)]=!0x0,this[_0x15c0cc(0x1c9)]=!0x1,this[_0x15c0cc(0x23a)]=!0x1,this[_0x15c0cc(0x19b)]=!0x0,this[_0x15c0cc(0x1bc)]=0x0,_0x2a0e8e))[_0x15c0cc(0x20c)](_0xc5180a=>(this['_connected']=!0x1,this['_connecting']=!0x1,console[_0x15c0cc(0x190)]('logger\\x20failed\\x20to\\x20connect\\x20to\\x20host,\\x20see\\x20'+this[_0x15c0cc(0x158)]),_0x3c25b9(new Error(_0x15c0cc(0x15c)+(_0xc5180a&&_0xc5180a[_0x15c0cc(0x213)])))));}));},z[_0x4d59fc(0x187)][_0x4d59fc(0x18e)]=function(_0x5e7c8e){var _0x265851=_0x4d59fc;this[_0x265851(0x20d)]=!0x1,this['_connecting']=!0x1;try{_0x5e7c8e['onclose']=null,_0x5e7c8e['onerror']=null,_0x5e7c8e[_0x265851(0x167)]=null;}catch{}try{_0x5e7c8e['readyState']<0x2&&_0x5e7c8e[_0x265851(0x144)]();}catch{}},z['prototype'][_0x4d59fc(0x1c0)]=function(){var _0x173a55=_0x4d59fc;clearTimeout(this[_0x173a55(0x1f3)]),!(this['_connectAttemptCount']>=this[_0x173a55(0x182)])&&(this['_reconnectTimeout']=setTimeout(()=>{var _0x350d0=_0x173a55,_0x36f610;this[_0x350d0(0x20d)]||this['_connecting']||(this['_connectToHostNow'](),(_0x36f610=this[_0x350d0(0x1ca)])==null||_0x36f610[_0x350d0(0x20c)](()=>this['_attemptToReconnectShortly']()));},0x1f4),this[_0x173a55(0x1f3)][_0x173a55(0x14e)]&&this[_0x173a55(0x1f3)][_0x173a55(0x14e)]());},z['prototype']['send']=async function(_0x3bea56){var _0x3a738e=_0x4d59fc;try{if(!this['_allowedToSend'])return;this['_allowedToConnectOnSend']&&this[_0x3a738e(0x1a0)](),(await this[_0x3a738e(0x1ca)])['send'](JSON['stringify'](_0x3bea56));}catch(_0x18cf7f){this[_0x3a738e(0x1d1)]?console['warn'](this[_0x3a738e(0x1ec)]+':\\x20'+(_0x18cf7f&&_0x18cf7f[_0x3a738e(0x213)])):(this[_0x3a738e(0x1d1)]=!0x0,console[_0x3a738e(0x190)](this[_0x3a738e(0x1ec)]+':\\x20'+(_0x18cf7f&&_0x18cf7f[_0x3a738e(0x213)]),_0x3bea56)),this['_allowedToSend']=!0x1,this[_0x3a738e(0x1c0)]();}};function H(_0xa50a7a,_0x2741fe,_0x2c635b,_0x3a7b09,_0x34b1e4,_0x1f6c10,_0x3b5578,_0x574877=ne){var _0xbfa28a=_0x4d59fc;let _0x2cfe65=_0x2c635b['split'](',')[_0xbfa28a(0x197)](_0x30a3b3=>{var _0x372a39=_0xbfa28a,_0xa6f90c,_0xaf3eaf,_0x42d72d,_0x49b367,_0x5a8eef,_0xa98f2f,_0x280e1a;try{if(!_0xa50a7a['_console_ninja_session']){let _0x1cabb3=((_0xaf3eaf=(_0xa6f90c=_0xa50a7a['process'])==null?void 0x0:_0xa6f90c['versions'])==null?void 0x0:_0xaf3eaf[_0x372a39(0x1cc)])||((_0x49b367=(_0x42d72d=_0xa50a7a[_0x372a39(0x1b1)])==null?void 0x0:_0x42d72d['env'])==null?void 0x0:_0x49b367[_0x372a39(0x1ff)])===_0x372a39(0x1c1);(_0x34b1e4===_0x372a39(0x214)||_0x34b1e4===_0x372a39(0x161)||_0x34b1e4===_0x372a39(0x193)||_0x34b1e4===_0x372a39(0x165))&&(_0x34b1e4+=_0x1cabb3?_0x372a39(0x24a):_0x372a39(0x240));let _0x144826='';_0x34b1e4===_0x372a39(0x188)&&(_0x144826=(((_0x280e1a=(_0xa98f2f=(_0x5a8eef=_0xa50a7a[_0x372a39(0x23e)])==null?void 0x0:_0x5a8eef[_0x372a39(0x1d2)])==null?void 0x0:_0xa98f2f[_0x372a39(0x206)])==null?void 0x0:_0x280e1a[_0x372a39(0x20a)])||'')[_0x372a39(0x1ba)](),_0x144826&&(_0x34b1e4+='\\x20'+_0x144826,_0x144826===_0x372a39(0x19f)&&(_0x2741fe=_0x372a39(0x1c2)))),_0xa50a7a[_0x372a39(0x21e)]={'id':+new Date(),'tool':_0x34b1e4},_0x3b5578&&_0x34b1e4&&!_0x1cabb3&&(_0x144826?console[_0x372a39(0x1bf)](_0x372a39(0x17b)+_0x144826+',\\x20see\\x20https://tinyurl.com/2vt8jxzw\\x20for\\x20more\\x20info.'):console[_0x372a39(0x1bf)](_0x372a39(0x227)+(_0x34b1e4[_0x372a39(0x218)](0x0)['toUpperCase']()+_0x34b1e4[_0x372a39(0x24b)](0x1))+',',_0x372a39(0x208),_0x372a39(0x1b2)));}let _0x170347=new z(_0xa50a7a,_0x2741fe,_0x30a3b3,_0x3a7b09,_0x1f6c10,_0x574877);return _0x170347['send'][_0x372a39(0x225)](_0x170347);}catch(_0x13d306){return console[_0x372a39(0x190)](_0x372a39(0x1d8),_0x13d306&&_0x13d306[_0x372a39(0x213)]),()=>{};}});return _0x5100af=>_0x2cfe65['forEach'](_0x2969bf=>_0x2969bf(_0x5100af));}function ne(_0x2e86cd,_0x36e003,_0x5542c9,_0x5d9168){var _0x5937e8=_0x4d59fc;_0x5d9168&&_0x2e86cd==='reload'&&_0x5542c9['location'][_0x5937e8(0x22d)]();}function b(_0x361e00){var _0xe97416=_0x4d59fc,_0x378041,_0x3c3d84;let _0x4c5dec=function(_0xf78abb,_0x2562b4){return _0x2562b4-_0xf78abb;},_0x2f19c8;if(_0x361e00[_0xe97416(0x228)])_0x2f19c8=function(){var _0x39146e=_0xe97416;return _0x361e00[_0x39146e(0x228)][_0x39146e(0x222)]();};else{if(_0x361e00[_0xe97416(0x1b1)]&&_0x361e00[_0xe97416(0x1b1)]['hrtime']&&((_0x3c3d84=(_0x378041=_0x361e00[_0xe97416(0x1b1)])==null?void 0x0:_0x378041['env'])==null?void 0x0:_0x3c3d84[_0xe97416(0x1ff)])!==_0xe97416(0x1c1))_0x2f19c8=function(){var _0x30ff27=_0xe97416;return _0x361e00[_0x30ff27(0x1b1)][_0x30ff27(0x23b)]();},_0x4c5dec=function(_0x2fdf3f,_0x2631c1){return 0x3e8*(_0x2631c1[0x0]-_0x2fdf3f[0x0])+(_0x2631c1[0x1]-_0x2fdf3f[0x1])/0xf4240;};else try{let {performance:_0x2df1eb}=require(_0xe97416(0x1e2));_0x2f19c8=function(){var _0x122de3=_0xe97416;return _0x2df1eb[_0x122de3(0x222)]();};}catch{_0x2f19c8=function(){return+new Date();};}}return{'elapsed':_0x4c5dec,'timeStamp':_0x2f19c8,'now':()=>Date['now']()};}function X(_0x12dc9a,_0x423bbe,_0x2b229e){var _0x5710d7=_0x4d59fc,_0x2039db,_0x300051,_0x4fb033,_0x19bbda,_0x4c53c2,_0xcf3d89,_0x5412cb,_0x25d0f3,_0x416847;if(_0x12dc9a[_0x5710d7(0x196)]!==void 0x0)return _0x12dc9a[_0x5710d7(0x196)];let _0x560e80=((_0x300051=(_0x2039db=_0x12dc9a['process'])==null?void 0x0:_0x2039db[_0x5710d7(0x195)])==null?void 0x0:_0x300051[_0x5710d7(0x1cc)])||((_0x19bbda=(_0x4fb033=_0x12dc9a[_0x5710d7(0x1b1)])==null?void 0x0:_0x4fb033[_0x5710d7(0x13f)])==null?void 0x0:_0x19bbda[_0x5710d7(0x1ff)])===_0x5710d7(0x1c1),_0x173fa6=!!(_0x2b229e===_0x5710d7(0x188)&&((_0x5412cb=(_0xcf3d89=(_0x4c53c2=_0x12dc9a[_0x5710d7(0x23e)])==null?void 0x0:_0x4c53c2[_0x5710d7(0x1d2)])==null?void 0x0:_0xcf3d89[_0x5710d7(0x206)])==null?void 0x0:_0x5412cb[_0x5710d7(0x20a)]));function _0x3f3a8a(_0x4a0e2d){var _0x2c686f=_0x5710d7;if(_0x4a0e2d['startsWith']('/')&&_0x4a0e2d[_0x2c686f(0x14c)]('/')){let _0x10ea65=new RegExp(_0x4a0e2d[_0x2c686f(0x146)](0x1,-0x1));return _0x4ee43c=>_0x10ea65[_0x2c686f(0x245)](_0x4ee43c);}else{if(_0x4a0e2d['includes']('*')||_0x4a0e2d['includes']('?')){let _0x1ece26=new RegExp('^'+_0x4a0e2d[_0x2c686f(0x1ab)](/\\./g,String['fromCharCode'](0x5c)+'.')[_0x2c686f(0x1ab)](/\\*/g,'.*')[_0x2c686f(0x1ab)](/\\?/g,'.')+String[_0x2c686f(0x19c)](0x24));return _0x3e51fe=>_0x1ece26['test'](_0x3e51fe);}else return _0x21ec77=>_0x21ec77===_0x4a0e2d;}}let _0x26c67e=_0x423bbe[_0x5710d7(0x197)](_0x3f3a8a);return _0x12dc9a[_0x5710d7(0x196)]=_0x560e80||!_0x423bbe,!_0x12dc9a[_0x5710d7(0x196)]&&((_0x25d0f3=_0x12dc9a[_0x5710d7(0x216)])==null?void 0x0:_0x25d0f3['hostname'])&&(_0x12dc9a[_0x5710d7(0x196)]=_0x26c67e[_0x5710d7(0x224)](_0x1d8d32=>_0x1d8d32(_0x12dc9a['location'][_0x5710d7(0x210)]))),_0x173fa6&&!_0x12dc9a[_0x5710d7(0x196)]&&!((_0x416847=_0x12dc9a['location'])!=null&&_0x416847['hostname'])&&(_0x12dc9a['_consoleNinjaAllowedToStart']=!0x0),_0x12dc9a[_0x5710d7(0x196)];}function J(_0x3f74d5,_0x3a4e21,_0x2ca4a2,_0x2e5f89,_0x1e7bbb,_0x1df426){var _0x1a31bd=_0x4d59fc;_0x3f74d5=_0x3f74d5,_0x3a4e21=_0x3a4e21,_0x2ca4a2=_0x2ca4a2,_0x2e5f89=_0x2e5f89,_0x1e7bbb=_0x1e7bbb,_0x1e7bbb=_0x1e7bbb||{},_0x1e7bbb[_0x1a31bd(0x151)]=_0x1e7bbb[_0x1a31bd(0x151)]||{},_0x1e7bbb['reducedLimits']=_0x1e7bbb['reducedLimits']||{},_0x1e7bbb['reducePolicy']=_0x1e7bbb[_0x1a31bd(0x1a5)]||{},_0x1e7bbb['reducePolicy'][_0x1a31bd(0x17c)]=_0x1e7bbb['reducePolicy']['perLogpoint']||{},_0x1e7bbb['reducePolicy'][_0x1a31bd(0x141)]=_0x1e7bbb['reducePolicy']['global']||{};let _0x26408={'perLogpoint':{'reduceOnCount':_0x1e7bbb[_0x1a31bd(0x1a5)][_0x1a31bd(0x17c)][_0x1a31bd(0x18f)]||0x32,'reduceOnAccumulatedProcessingTimeMs':_0x1e7bbb[_0x1a31bd(0x1a5)][_0x1a31bd(0x17c)]['reduceOnAccumulatedProcessingTimeMs']||0x64,'resetWhenQuietMs':_0x1e7bbb[_0x1a31bd(0x1a5)][_0x1a31bd(0x17c)]['resetWhenQuietMs']||0x1f4,'resetOnProcessingTimeAverageMs':_0x1e7bbb[_0x1a31bd(0x1a5)][_0x1a31bd(0x17c)][_0x1a31bd(0x1b9)]||0x64},'global':{'reduceOnCount':_0x1e7bbb[_0x1a31bd(0x1a5)]['global'][_0x1a31bd(0x18f)]||0x3e8,'reduceOnAccumulatedProcessingTimeMs':_0x1e7bbb[_0x1a31bd(0x1a5)]['global'][_0x1a31bd(0x183)]||0x12c,'resetWhenQuietMs':_0x1e7bbb[_0x1a31bd(0x1a5)][_0x1a31bd(0x141)]['resetWhenQuietMs']||0x32,'resetOnProcessingTimeAverageMs':_0x1e7bbb[_0x1a31bd(0x1a5)][_0x1a31bd(0x141)][_0x1a31bd(0x1b9)]||0x64}},_0x133fe7=b(_0x3f74d5),_0x962125=_0x133fe7[_0x1a31bd(0x1b0)],_0x3ff912=_0x133fe7[_0x1a31bd(0x1c4)];function _0x52b7e5(){var _0x448e30=_0x1a31bd;this['_keyStrRegExp']=/^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[_$a-zA-Z\\xA0-\\uFFFF][_$a-zA-Z0-9\\xA0-\\uFFFF]*$/,this[_0x448e30(0x18a)]=/^(0|[1-9][0-9]*)$/,this[_0x448e30(0x15b)]=/'([^\\\\']|\\\\')*'/,this[_0x448e30(0x1d0)]=_0x3f74d5[_0x448e30(0x247)],this[_0x448e30(0x17a)]=_0x3f74d5[_0x448e30(0x22e)],this['_getOwnPropertyDescriptor']=Object[_0x448e30(0x236)],this[_0x448e30(0x215)]=Object[_0x448e30(0x1d5)],this[_0x448e30(0x242)]=_0x3f74d5[_0x448e30(0x1ea)],this[_0x448e30(0x244)]=RegExp['prototype'][_0x448e30(0x17f)],this[_0x448e30(0x217)]=Date[_0x448e30(0x187)][_0x448e30(0x17f)];}_0x52b7e5[_0x1a31bd(0x187)][_0x1a31bd(0x192)]=function(_0x57ef52,_0x98397,_0x2fc919,_0x2031f9){var _0x3df94c=_0x1a31bd,_0x4ea2bc=this,_0x2d6820=_0x2fc919[_0x3df94c(0x233)];function _0x9c2278(_0x2a848e,_0x473429,_0x52b88f){var _0x283c2c=_0x3df94c;_0x473429[_0x283c2c(0x14d)]='unknown',_0x473429[_0x283c2c(0x1bd)]=_0x2a848e['message'],_0x2b76a8=_0x52b88f[_0x283c2c(0x1cc)][_0x283c2c(0x1f5)],_0x52b88f[_0x283c2c(0x1cc)][_0x283c2c(0x1f5)]=_0x473429,_0x4ea2bc[_0x283c2c(0x184)](_0x473429,_0x52b88f);}let _0x4a228c,_0x4e0009,_0x467368=_0x3f74d5[_0x3df94c(0x1db)];_0x3f74d5[_0x3df94c(0x1db)]=!0x0,_0x3f74d5[_0x3df94c(0x15a)]&&(_0x4a228c=_0x3f74d5[_0x3df94c(0x15a)]['error'],_0x4e0009=_0x3f74d5['console']['warn'],_0x4a228c&&(_0x3f74d5[_0x3df94c(0x15a)]['error']=function(){}),_0x4e0009&&(_0x3f74d5['console'][_0x3df94c(0x190)]=function(){}));try{try{_0x2fc919[_0x3df94c(0x209)]++,_0x2fc919[_0x3df94c(0x233)]&&_0x2fc919[_0x3df94c(0x1b8)]['push'](_0x98397);var _0x205d81,_0x503b80,_0x5b56a1,_0x5f1384,_0x3f2f5a=[],_0x1f784f=[],_0xd44c73,_0x1e32eb=this[_0x3df94c(0x145)](_0x98397),_0x36efc9=_0x1e32eb==='array',_0x9a15b3=!0x1,_0x1f4b03=_0x1e32eb===_0x3df94c(0x156),_0x33ab3d=this[_0x3df94c(0x226)](_0x1e32eb),_0x5c478e=this[_0x3df94c(0x1cd)](_0x1e32eb),_0x16f43c=_0x33ab3d||_0x5c478e,_0x358e1f={},_0x10720d=0x0,_0x546f04=!0x1,_0x2b76a8,_0x2433ed=/^(([1-9]{1}[0-9]*)|0)$/;if(_0x2fc919['depth']){if(_0x36efc9){if(_0x503b80=_0x98397[_0x3df94c(0x1eb)],_0x503b80>_0x2fc919[_0x3df94c(0x1e8)]){for(_0x5b56a1=0x0,_0x5f1384=_0x2fc919['elements'],_0x205d81=_0x5b56a1;_0x205d81<_0x5f1384;_0x205d81++)_0x1f784f[_0x3df94c(0x1ad)](_0x4ea2bc['_addProperty'](_0x3f2f5a,_0x98397,_0x1e32eb,_0x205d81,_0x2fc919));_0x57ef52['cappedElements']=!0x0;}else{for(_0x5b56a1=0x0,_0x5f1384=_0x503b80,_0x205d81=_0x5b56a1;_0x205d81<_0x5f1384;_0x205d81++)_0x1f784f[_0x3df94c(0x1ad)](_0x4ea2bc[_0x3df94c(0x1b4)](_0x3f2f5a,_0x98397,_0x1e32eb,_0x205d81,_0x2fc919));}_0x2fc919['autoExpandPropertyCount']+=_0x1f784f[_0x3df94c(0x1eb)];}if(!(_0x1e32eb===_0x3df94c(0x248)||_0x1e32eb===_0x3df94c(0x247))&&!_0x33ab3d&&_0x1e32eb!==_0x3df94c(0x23c)&&_0x1e32eb!==_0x3df94c(0x1f8)&&_0x1e32eb!==_0x3df94c(0x179)){var _0x2bc197=_0x2031f9['props']||_0x2fc919[_0x3df94c(0x235)];if(this['_isSet'](_0x98397)?(_0x205d81=0x0,_0x98397[_0x3df94c(0x13e)](function(_0x11e823){var _0x36cdae=_0x3df94c;if(_0x10720d++,_0x2fc919[_0x36cdae(0x148)]++,_0x10720d>_0x2bc197){_0x546f04=!0x0;return;}if(!_0x2fc919[_0x36cdae(0x1cb)]&&_0x2fc919[_0x36cdae(0x233)]&&_0x2fc919[_0x36cdae(0x148)]>_0x2fc919['autoExpandLimit']){_0x546f04=!0x0;return;}_0x1f784f[_0x36cdae(0x1ad)](_0x4ea2bc[_0x36cdae(0x1b4)](_0x3f2f5a,_0x98397,_0x36cdae(0x163),_0x205d81++,_0x2fc919,function(_0x76f65){return function(){return _0x76f65;};}(_0x11e823)));})):this[_0x3df94c(0x22f)](_0x98397)&&_0x98397[_0x3df94c(0x13e)](function(_0xfcc77e,_0x1b88bb){var _0x146f73=_0x3df94c;if(_0x10720d++,_0x2fc919['autoExpandPropertyCount']++,_0x10720d>_0x2bc197){_0x546f04=!0x0;return;}if(!_0x2fc919[_0x146f73(0x1cb)]&&_0x2fc919[_0x146f73(0x233)]&&_0x2fc919[_0x146f73(0x148)]>_0x2fc919['autoExpandLimit']){_0x546f04=!0x0;return;}var _0x5c2280=_0x1b88bb['toString']();_0x5c2280[_0x146f73(0x1eb)]>0x64&&(_0x5c2280=_0x5c2280['slice'](0x0,0x64)+_0x146f73(0x149)),_0x1f784f['push'](_0x4ea2bc['_addProperty'](_0x3f2f5a,_0x98397,'Map',_0x5c2280,_0x2fc919,function(_0x3559e2){return function(){return _0x3559e2;};}(_0xfcc77e)));}),!_0x9a15b3){try{for(_0xd44c73 in _0x98397)if(!(_0x36efc9&&_0x2433ed[_0x3df94c(0x245)](_0xd44c73))&&!this[_0x3df94c(0x155)](_0x98397,_0xd44c73,_0x2fc919)){if(_0x10720d++,_0x2fc919[_0x3df94c(0x148)]++,_0x10720d>_0x2bc197){_0x546f04=!0x0;break;}if(!_0x2fc919[_0x3df94c(0x1cb)]&&_0x2fc919[_0x3df94c(0x233)]&&_0x2fc919[_0x3df94c(0x148)]>_0x2fc919[_0x3df94c(0x202)]){_0x546f04=!0x0;break;}_0x1f784f[_0x3df94c(0x1ad)](_0x4ea2bc[_0x3df94c(0x237)](_0x3f2f5a,_0x358e1f,_0x98397,_0x1e32eb,_0xd44c73,_0x2fc919));}}catch{}if(_0x358e1f[_0x3df94c(0x171)]=!0x0,_0x1f4b03&&(_0x358e1f['_p_name']=!0x0),!_0x546f04){var _0x48b2b6=[][_0x3df94c(0x221)](this[_0x3df94c(0x215)](_0x98397))[_0x3df94c(0x221)](this['_getOwnPropertySymbols'](_0x98397));for(_0x205d81=0x0,_0x503b80=_0x48b2b6['length'];_0x205d81<_0x503b80;_0x205d81++)if(_0xd44c73=_0x48b2b6[_0x205d81],!(_0x36efc9&&_0x2433ed['test'](_0xd44c73['toString']()))&&!this[_0x3df94c(0x155)](_0x98397,_0xd44c73,_0x2fc919)&&!_0x358e1f[typeof _0xd44c73!='symbol'?_0x3df94c(0x14f)+_0xd44c73['toString']():_0xd44c73]){if(_0x10720d++,_0x2fc919[_0x3df94c(0x148)]++,_0x10720d>_0x2bc197){_0x546f04=!0x0;break;}if(!_0x2fc919[_0x3df94c(0x1cb)]&&_0x2fc919[_0x3df94c(0x233)]&&_0x2fc919[_0x3df94c(0x148)]>_0x2fc919['autoExpandLimit']){_0x546f04=!0x0;break;}_0x1f784f['push'](_0x4ea2bc[_0x3df94c(0x237)](_0x3f2f5a,_0x358e1f,_0x98397,_0x1e32eb,_0xd44c73,_0x2fc919));}}}}}if(_0x57ef52['type']=_0x1e32eb,_0x16f43c?(_0x57ef52[_0x3df94c(0x20e)]=_0x98397[_0x3df94c(0x1e0)](),this['_capIfString'](_0x1e32eb,_0x57ef52,_0x2fc919,_0x2031f9)):_0x1e32eb===_0x3df94c(0x17e)?_0x57ef52[_0x3df94c(0x20e)]=this[_0x3df94c(0x217)][_0x3df94c(0x1f7)](_0x98397):_0x1e32eb===_0x3df94c(0x179)?_0x57ef52[_0x3df94c(0x20e)]=_0x98397[_0x3df94c(0x17f)]():_0x1e32eb===_0x3df94c(0x212)?_0x57ef52[_0x3df94c(0x20e)]=this[_0x3df94c(0x244)]['call'](_0x98397):_0x1e32eb===_0x3df94c(0x15d)&&this['_Symbol']?_0x57ef52[_0x3df94c(0x20e)]=this[_0x3df94c(0x242)]['prototype']['toString'][_0x3df94c(0x1f7)](_0x98397):!_0x2fc919['depth']&&!(_0x1e32eb===_0x3df94c(0x248)||_0x1e32eb==='undefined')&&(delete _0x57ef52[_0x3df94c(0x20e)],_0x57ef52['capped']=!0x0),_0x546f04&&(_0x57ef52[_0x3df94c(0x21b)]=!0x0),_0x2b76a8=_0x2fc919['node']['current'],_0x2fc919[_0x3df94c(0x1cc)][_0x3df94c(0x1f5)]=_0x57ef52,this[_0x3df94c(0x184)](_0x57ef52,_0x2fc919),_0x1f784f['length']){for(_0x205d81=0x0,_0x503b80=_0x1f784f[_0x3df94c(0x1eb)];_0x205d81<_0x503b80;_0x205d81++)_0x1f784f[_0x205d81](_0x205d81);}_0x3f2f5a[_0x3df94c(0x1eb)]&&(_0x57ef52[_0x3df94c(0x235)]=_0x3f2f5a);}catch(_0x2d9deb){_0x9c2278(_0x2d9deb,_0x57ef52,_0x2fc919);}this[_0x3df94c(0x177)](_0x98397,_0x57ef52),this['_treeNodePropertiesAfterFullValue'](_0x57ef52,_0x2fc919),_0x2fc919[_0x3df94c(0x1cc)][_0x3df94c(0x1f5)]=_0x2b76a8,_0x2fc919['level']--,_0x2fc919['autoExpand']=_0x2d6820,_0x2fc919[_0x3df94c(0x233)]&&_0x2fc919['autoExpandPreviousObjects']['pop']();}finally{_0x4a228c&&(_0x3f74d5[_0x3df94c(0x15a)][_0x3df94c(0x1bd)]=_0x4a228c),_0x4e0009&&(_0x3f74d5['console'][_0x3df94c(0x190)]=_0x4e0009),_0x3f74d5['ninjaSuppressConsole']=_0x467368;}return _0x57ef52;},_0x52b7e5[_0x1a31bd(0x187)][_0x1a31bd(0x176)]=function(_0x4e74cd){var _0x41c18a=_0x1a31bd;return Object[_0x41c18a(0x16e)]?Object['getOwnPropertySymbols'](_0x4e74cd):[];},_0x52b7e5['prototype'][_0x1a31bd(0x238)]=function(_0x399d7e){var _0x37a6c4=_0x1a31bd;return!!(_0x399d7e&&_0x3f74d5['Set']&&this[_0x37a6c4(0x241)](_0x399d7e)===_0x37a6c4(0x23f)&&_0x399d7e[_0x37a6c4(0x13e)]);},_0x52b7e5[_0x1a31bd(0x187)][_0x1a31bd(0x155)]=function(_0x1b94ea,_0x502f25,_0x31e642){var _0x217c78=_0x1a31bd;if(!_0x31e642[_0x217c78(0x1f4)]){let _0x2902c9=this[_0x217c78(0x1bb)](_0x1b94ea,_0x502f25);if(_0x2902c9&&_0x2902c9['get'])return!0x0;}return _0x31e642['noFunctions']?typeof _0x1b94ea[_0x502f25]==_0x217c78(0x156):!0x1;},_0x52b7e5['prototype'][_0x1a31bd(0x145)]=function(_0x49f967){var _0x426c59=_0x1a31bd,_0x922940='';return _0x922940=typeof _0x49f967,_0x922940===_0x426c59(0x1ef)?this[_0x426c59(0x241)](_0x49f967)===_0x426c59(0x1a2)?_0x922940=_0x426c59(0x1c7):this[_0x426c59(0x241)](_0x49f967)==='[object\\x20Date]'?_0x922940=_0x426c59(0x17e):this['_objectToString'](_0x49f967)===_0x426c59(0x1ce)?_0x922940=_0x426c59(0x179):_0x49f967===null?_0x922940=_0x426c59(0x248):_0x49f967[_0x426c59(0x211)]&&(_0x922940=_0x49f967[_0x426c59(0x211)][_0x426c59(0x185)]||_0x922940):_0x922940==='undefined'&&this[_0x426c59(0x17a)]&&_0x49f967 instanceof this[_0x426c59(0x17a)]&&(_0x922940=_0x426c59(0x22e)),_0x922940;},_0x52b7e5['prototype'][_0x1a31bd(0x241)]=function(_0x9fe75c){var _0x145667=_0x1a31bd;return Object[_0x145667(0x187)][_0x145667(0x17f)][_0x145667(0x1f7)](_0x9fe75c);},_0x52b7e5[_0x1a31bd(0x187)][_0x1a31bd(0x226)]=function(_0x28f9a8){var _0x882f2c=_0x1a31bd;return _0x28f9a8===_0x882f2c(0x1e9)||_0x28f9a8==='string'||_0x28f9a8==='number';},_0x52b7e5['prototype']['_isPrimitiveWrapperType']=function(_0x1de2f6){var _0x1203a4=_0x1a31bd;return _0x1de2f6==='Boolean'||_0x1de2f6==='String'||_0x1de2f6===_0x1203a4(0x170);},_0x52b7e5[_0x1a31bd(0x187)][_0x1a31bd(0x1b4)]=function(_0x229a3a,_0x1f00a9,_0x451201,_0x14d31e,_0x113650,_0x4482e8){var _0x25768e=this;return function(_0x1b8194){var _0x51296d=_0x4900,_0x5adcf4=_0x113650[_0x51296d(0x1cc)][_0x51296d(0x1f5)],_0x5d3094=_0x113650[_0x51296d(0x1cc)][_0x51296d(0x232)],_0x34a0ce=_0x113650[_0x51296d(0x1cc)][_0x51296d(0x234)];_0x113650[_0x51296d(0x1cc)][_0x51296d(0x234)]=_0x5adcf4,_0x113650[_0x51296d(0x1cc)][_0x51296d(0x232)]=typeof _0x14d31e==_0x51296d(0x15f)?_0x14d31e:_0x1b8194,_0x229a3a[_0x51296d(0x1ad)](_0x25768e[_0x51296d(0x20f)](_0x1f00a9,_0x451201,_0x14d31e,_0x113650,_0x4482e8)),_0x113650[_0x51296d(0x1cc)][_0x51296d(0x234)]=_0x34a0ce,_0x113650[_0x51296d(0x1cc)][_0x51296d(0x232)]=_0x5d3094;};},_0x52b7e5[_0x1a31bd(0x187)]['_addObjectProperty']=function(_0x273006,_0x72ec77,_0x117db5,_0x132130,_0x4caab8,_0x510c91,_0xdcc1a2){var _0xfb1884=_0x1a31bd,_0x304712=this;return _0x72ec77[typeof _0x4caab8!='symbol'?_0xfb1884(0x14f)+_0x4caab8[_0xfb1884(0x17f)]():_0x4caab8]=!0x0,function(_0x33ff36){var _0x55655e=_0xfb1884,_0x1386c9=_0x510c91[_0x55655e(0x1cc)][_0x55655e(0x1f5)],_0x31b261=_0x510c91[_0x55655e(0x1cc)][_0x55655e(0x232)],_0x546b19=_0x510c91[_0x55655e(0x1cc)]['parent'];_0x510c91['node'][_0x55655e(0x234)]=_0x1386c9,_0x510c91[_0x55655e(0x1cc)][_0x55655e(0x232)]=_0x33ff36,_0x273006[_0x55655e(0x1ad)](_0x304712[_0x55655e(0x20f)](_0x117db5,_0x132130,_0x4caab8,_0x510c91,_0xdcc1a2)),_0x510c91['node']['parent']=_0x546b19,_0x510c91['node'][_0x55655e(0x232)]=_0x31b261;};},_0x52b7e5[_0x1a31bd(0x187)][_0x1a31bd(0x20f)]=function(_0xf53a2d,_0x99fcb5,_0x4c11de,_0x553b09,_0x218247){var _0x48bf03=_0x1a31bd,_0x7e60a8=this;_0x218247||(_0x218247=function(_0x377d55,_0x53a735){return _0x377d55[_0x53a735];});var _0xd3bf72=_0x4c11de[_0x48bf03(0x17f)](),_0x46ed8d=_0x553b09['expressionsToEvaluate']||{},_0xf789a1=_0x553b09[_0x48bf03(0x20b)],_0x2508ea=_0x553b09[_0x48bf03(0x1cb)];try{var _0x408977=this[_0x48bf03(0x22f)](_0xf53a2d),_0x52a952=_0xd3bf72;_0x408977&&_0x52a952[0x0]==='\\x27'&&(_0x52a952=_0x52a952[_0x48bf03(0x24b)](0x1,_0x52a952[_0x48bf03(0x1eb)]-0x2));var _0x3a7bf6=_0x553b09[_0x48bf03(0x22a)]=_0x46ed8d[_0x48bf03(0x14f)+_0x52a952];_0x3a7bf6&&(_0x553b09[_0x48bf03(0x20b)]=_0x553b09[_0x48bf03(0x20b)]+0x1),_0x553b09[_0x48bf03(0x1cb)]=!!_0x3a7bf6;var _0x296a1a=typeof _0x4c11de=='symbol',_0x32e0ba={'name':_0x296a1a||_0x408977?_0xd3bf72:this[_0x48bf03(0x18d)](_0xd3bf72)};if(_0x296a1a&&(_0x32e0ba[_0x48bf03(0x15d)]=!0x0),!(_0x99fcb5===_0x48bf03(0x1c7)||_0x99fcb5==='Error')){var _0x343b94=this[_0x48bf03(0x1bb)](_0xf53a2d,_0x4c11de);if(_0x343b94&&(_0x343b94[_0x48bf03(0x1ee)]&&(_0x32e0ba['setter']=!0x0),_0x343b94[_0x48bf03(0x172)]&&!_0x3a7bf6&&!_0x553b09['resolveGetters']))return _0x32e0ba[_0x48bf03(0x1f1)]=!0x0,this[_0x48bf03(0x153)](_0x32e0ba,_0x553b09),_0x32e0ba;}var _0x12e962;try{_0x12e962=_0x218247(_0xf53a2d,_0x4c11de);}catch(_0x3e0315){return _0x32e0ba={'name':_0xd3bf72,'type':_0x48bf03(0x1de),'error':_0x3e0315['message']},this['_processTreeNodeResult'](_0x32e0ba,_0x553b09),_0x32e0ba;}var _0xca3da=this['_type'](_0x12e962),_0x986238=this['_isPrimitiveType'](_0xca3da);if(_0x32e0ba[_0x48bf03(0x14d)]=_0xca3da,_0x986238)this[_0x48bf03(0x153)](_0x32e0ba,_0x553b09,_0x12e962,function(){var _0x5cfdd9=_0x48bf03;_0x32e0ba['value']=_0x12e962[_0x5cfdd9(0x1e0)](),!_0x3a7bf6&&_0x7e60a8[_0x5cfdd9(0x1ed)](_0xca3da,_0x32e0ba,_0x553b09,{});});else{var _0x4dfd09=_0x553b09[_0x48bf03(0x233)]&&_0x553b09[_0x48bf03(0x209)]<_0x553b09[_0x48bf03(0x150)]&&_0x553b09[_0x48bf03(0x1b8)][_0x48bf03(0x1b3)](_0x12e962)<0x0&&_0xca3da!==_0x48bf03(0x156)&&_0x553b09['autoExpandPropertyCount']<_0x553b09[_0x48bf03(0x202)];_0x4dfd09||_0x553b09[_0x48bf03(0x209)]<_0xf789a1||_0x3a7bf6?this[_0x48bf03(0x192)](_0x32e0ba,_0x12e962,_0x553b09,_0x3a7bf6||{}):this[_0x48bf03(0x153)](_0x32e0ba,_0x553b09,_0x12e962,function(){var _0x1d8b84=_0x48bf03;_0xca3da==='null'||_0xca3da==='undefined'||(delete _0x32e0ba[_0x1d8b84(0x20e)],_0x32e0ba[_0x1d8b84(0x16d)]=!0x0);});}return _0x32e0ba;}finally{_0x553b09[_0x48bf03(0x22a)]=_0x46ed8d,_0x553b09[_0x48bf03(0x20b)]=_0xf789a1,_0x553b09[_0x48bf03(0x1cb)]=_0x2508ea;}},_0x52b7e5[_0x1a31bd(0x187)][_0x1a31bd(0x1ed)]=function(_0x219413,_0x446cc1,_0x4f6ce8,_0x236d1f){var _0x5a8599=_0x1a31bd,_0x1d16da=_0x236d1f[_0x5a8599(0x1f6)]||_0x4f6ce8['strLength'];if((_0x219413===_0x5a8599(0x1dd)||_0x219413===_0x5a8599(0x23c))&&_0x446cc1['value']){let _0x5aaa88=_0x446cc1['value']['length'];_0x4f6ce8[_0x5a8599(0x1c5)]+=_0x5aaa88,_0x4f6ce8[_0x5a8599(0x1c5)]>_0x4f6ce8[_0x5a8599(0x1e1)]?(_0x446cc1[_0x5a8599(0x16d)]='',delete _0x446cc1['value']):_0x5aaa88>_0x1d16da&&(_0x446cc1['capped']=_0x446cc1[_0x5a8599(0x20e)][_0x5a8599(0x24b)](0x0,_0x1d16da),delete _0x446cc1[_0x5a8599(0x20e)]);}},_0x52b7e5['prototype']['_isMap']=function(_0x762a92){var _0xd95994=_0x1a31bd;return!!(_0x762a92&&_0x3f74d5[_0xd95994(0x1d4)]&&this[_0xd95994(0x241)](_0x762a92)===_0xd95994(0x140)&&_0x762a92[_0xd95994(0x13e)]);},_0x52b7e5[_0x1a31bd(0x187)][_0x1a31bd(0x18d)]=function(_0x48f752){var _0x551a33=_0x1a31bd;if(_0x48f752[_0x551a33(0x1aa)](/^\\d+$/))return _0x48f752;var _0x3b1c43;try{_0x3b1c43=JSON[_0x551a33(0x1d6)](''+_0x48f752);}catch{_0x3b1c43='\\x22'+this[_0x551a33(0x241)](_0x48f752)+'\\x22';}return _0x3b1c43['match'](/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)?_0x3b1c43=_0x3b1c43[_0x551a33(0x24b)](0x1,_0x3b1c43['length']-0x2):_0x3b1c43=_0x3b1c43[_0x551a33(0x1ab)](/'/g,'\\x5c\\x27')[_0x551a33(0x1ab)](/\\\\\"/g,'\\x22')[_0x551a33(0x1ab)](/(^\"|\"$)/g,'\\x27'),_0x3b1c43;},_0x52b7e5[_0x1a31bd(0x187)]['_processTreeNodeResult']=function(_0x29acbc,_0x55d3f4,_0x521ea5,_0x15085d){var _0x22f914=_0x1a31bd;this['_treeNodePropertiesBeforeFullValue'](_0x29acbc,_0x55d3f4),_0x15085d&&_0x15085d(),this[_0x22f914(0x177)](_0x521ea5,_0x29acbc),this['_treeNodePropertiesAfterFullValue'](_0x29acbc,_0x55d3f4);},_0x52b7e5[_0x1a31bd(0x187)][_0x1a31bd(0x184)]=function(_0x26049f,_0x11fc80){var _0x4fb983=_0x1a31bd;this[_0x4fb983(0x174)](_0x26049f,_0x11fc80),this[_0x4fb983(0x1a9)](_0x26049f,_0x11fc80),this[_0x4fb983(0x189)](_0x26049f,_0x11fc80),this[_0x4fb983(0x18b)](_0x26049f,_0x11fc80);},_0x52b7e5['prototype']['_setNodeId']=function(_0x4c5200,_0x40cd3d){},_0x52b7e5['prototype']['_setNodeQueryPath']=function(_0x1d6e6c,_0x2700ae){},_0x52b7e5[_0x1a31bd(0x187)][_0x1a31bd(0x162)]=function(_0x5c02cf,_0x31d0eb){},_0x52b7e5[_0x1a31bd(0x187)][_0x1a31bd(0x1e4)]=function(_0x284a98){var _0x9a43db=_0x1a31bd;return _0x284a98===this[_0x9a43db(0x1d0)];},_0x52b7e5[_0x1a31bd(0x187)][_0x1a31bd(0x1b5)]=function(_0x109cb9,_0x182e7f){var _0x870b30=_0x1a31bd;this[_0x870b30(0x162)](_0x109cb9,_0x182e7f),this[_0x870b30(0x1f2)](_0x109cb9),_0x182e7f[_0x870b30(0x239)]&&this['_sortProps'](_0x109cb9),this[_0x870b30(0x169)](_0x109cb9,_0x182e7f),this['_addLoadNode'](_0x109cb9,_0x182e7f),this['_cleanNode'](_0x109cb9);},_0x52b7e5[_0x1a31bd(0x187)][_0x1a31bd(0x177)]=function(_0x496860,_0x4fa30c){var _0x224f22=_0x1a31bd;try{_0x496860&&typeof _0x496860[_0x224f22(0x1eb)]==_0x224f22(0x15f)&&(_0x4fa30c[_0x224f22(0x1eb)]=_0x496860[_0x224f22(0x1eb)]);}catch{}if(_0x4fa30c[_0x224f22(0x14d)]===_0x224f22(0x15f)||_0x4fa30c['type']===_0x224f22(0x170)){if(isNaN(_0x4fa30c['value']))_0x4fa30c[_0x224f22(0x1c8)]=!0x0,delete _0x4fa30c[_0x224f22(0x20e)];else switch(_0x4fa30c[_0x224f22(0x20e)]){case Number[_0x224f22(0x1a7)]:_0x4fa30c[_0x224f22(0x1a4)]=!0x0,delete _0x4fa30c[_0x224f22(0x20e)];break;case Number[_0x224f22(0x1ac)]:_0x4fa30c[_0x224f22(0x16b)]=!0x0,delete _0x4fa30c[_0x224f22(0x20e)];break;case 0x0:this[_0x224f22(0x199)](_0x4fa30c[_0x224f22(0x20e)])&&(_0x4fa30c[_0x224f22(0x180)]=!0x0);break;}}else _0x4fa30c[_0x224f22(0x14d)]===_0x224f22(0x156)&&typeof _0x496860['name']=='string'&&_0x496860[_0x224f22(0x185)]&&_0x4fa30c[_0x224f22(0x185)]&&_0x496860[_0x224f22(0x185)]!==_0x4fa30c[_0x224f22(0x185)]&&(_0x4fa30c[_0x224f22(0x1df)]=_0x496860['name']);},_0x52b7e5['prototype'][_0x1a31bd(0x199)]=function(_0x5402b5){var _0x4965e7=_0x1a31bd;return 0x1/_0x5402b5===Number[_0x4965e7(0x1ac)];},_0x52b7e5[_0x1a31bd(0x187)]['_sortProps']=function(_0x3a51c7){var _0x53c306=_0x1a31bd;!_0x3a51c7['props']||!_0x3a51c7[_0x53c306(0x235)]['length']||_0x3a51c7[_0x53c306(0x14d)]===_0x53c306(0x1c7)||_0x3a51c7['type']===_0x53c306(0x1d4)||_0x3a51c7['type']===_0x53c306(0x163)||_0x3a51c7[_0x53c306(0x235)][_0x53c306(0x1a1)](function(_0x1c94a7,_0x3b80c3){var _0x2193d8=_0x53c306,_0x327a7d=_0x1c94a7['name'][_0x2193d8(0x1ba)](),_0x37ef8e=_0x3b80c3[_0x2193d8(0x185)][_0x2193d8(0x1ba)]();return _0x327a7d<_0x37ef8e?-0x1:_0x327a7d>_0x37ef8e?0x1:0x0;});},_0x52b7e5['prototype']['_addFunctionsNode']=function(_0x45f6d4,_0x4c5642){var _0x1a2fe4=_0x1a31bd;if(!(_0x4c5642[_0x1a2fe4(0x19e)]||!_0x45f6d4[_0x1a2fe4(0x235)]||!_0x45f6d4['props']['length'])){for(var _0x1d66fc=[],_0x1f90af=[],_0x27086e=0x0,_0x3291dc=_0x45f6d4[_0x1a2fe4(0x235)][_0x1a2fe4(0x1eb)];_0x27086e<_0x3291dc;_0x27086e++){var _0x3f0ce2=_0x45f6d4[_0x1a2fe4(0x235)][_0x27086e];_0x3f0ce2[_0x1a2fe4(0x14d)]===_0x1a2fe4(0x156)?_0x1d66fc[_0x1a2fe4(0x1ad)](_0x3f0ce2):_0x1f90af[_0x1a2fe4(0x1ad)](_0x3f0ce2);}if(!(!_0x1f90af[_0x1a2fe4(0x1eb)]||_0x1d66fc[_0x1a2fe4(0x1eb)]<=0x1)){_0x45f6d4[_0x1a2fe4(0x235)]=_0x1f90af;var _0x35112c={'functionsNode':!0x0,'props':_0x1d66fc};this[_0x1a2fe4(0x174)](_0x35112c,_0x4c5642),this[_0x1a2fe4(0x162)](_0x35112c,_0x4c5642),this[_0x1a2fe4(0x1f2)](_0x35112c),this[_0x1a2fe4(0x18b)](_0x35112c,_0x4c5642),_0x35112c['id']+='\\x20f',_0x45f6d4[_0x1a2fe4(0x235)][_0x1a2fe4(0x220)](_0x35112c);}}},_0x52b7e5[_0x1a31bd(0x187)]['_addLoadNode']=function(_0xbfb82d,_0x5a3e98){},_0x52b7e5[_0x1a31bd(0x187)][_0x1a31bd(0x1f2)]=function(_0x5814f7){},_0x52b7e5[_0x1a31bd(0x187)][_0x1a31bd(0x1fc)]=function(_0x1d0625){var _0x290a1c=_0x1a31bd;return Array['isArray'](_0x1d0625)||typeof _0x1d0625==_0x290a1c(0x1ef)&&this[_0x290a1c(0x241)](_0x1d0625)===_0x290a1c(0x1a2);},_0x52b7e5[_0x1a31bd(0x187)][_0x1a31bd(0x18b)]=function(_0x2057f9,_0x1e0cf8){},_0x52b7e5[_0x1a31bd(0x187)][_0x1a31bd(0x181)]=function(_0x451686){var _0x4ab6bc=_0x1a31bd;delete _0x451686[_0x4ab6bc(0x16c)],delete _0x451686[_0x4ab6bc(0x19a)],delete _0x451686[_0x4ab6bc(0x173)];},_0x52b7e5['prototype'][_0x1a31bd(0x189)]=function(_0x1128c6,_0x388352){};let _0x41722d=new _0x52b7e5(),_0x2e7ad6={'props':_0x1e7bbb['defaultLimits'][_0x1a31bd(0x235)]||0x64,'elements':_0x1e7bbb[_0x1a31bd(0x151)][_0x1a31bd(0x1e8)]||0x64,'strLength':_0x1e7bbb[_0x1a31bd(0x151)]['strLength']||0x400*0x32,'totalStrLength':_0x1e7bbb[_0x1a31bd(0x151)][_0x1a31bd(0x1e1)]||0x400*0x32,'autoExpandLimit':_0x1e7bbb[_0x1a31bd(0x151)]['autoExpandLimit']||0x1388,'autoExpandMaxDepth':_0x1e7bbb['defaultLimits'][_0x1a31bd(0x150)]||0xa},_0x2d0eef={'props':_0x1e7bbb[_0x1a31bd(0x1f9)][_0x1a31bd(0x235)]||0x5,'elements':_0x1e7bbb[_0x1a31bd(0x1f9)][_0x1a31bd(0x1e8)]||0x5,'strLength':_0x1e7bbb[_0x1a31bd(0x1f9)]['strLength']||0x100,'totalStrLength':_0x1e7bbb[_0x1a31bd(0x1f9)][_0x1a31bd(0x1e1)]||0x100*0x3,'autoExpandLimit':_0x1e7bbb[_0x1a31bd(0x1f9)][_0x1a31bd(0x202)]||0x1e,'autoExpandMaxDepth':_0x1e7bbb[_0x1a31bd(0x1f9)]['autoExpandMaxDepth']||0x2};if(_0x1df426){let _0x5b5289=_0x41722d[_0x1a31bd(0x192)][_0x1a31bd(0x225)](_0x41722d);_0x41722d[_0x1a31bd(0x192)]=function(_0xd1da,_0x519a4f,_0x2ea3e7,_0x1b54a0){return _0x5b5289(_0xd1da,_0x1df426(_0x519a4f),_0x2ea3e7,_0x1b54a0);};}function _0xf0f807(_0x197d49,_0x155c96,_0x423389,_0x40e219,_0x530986,_0xac5a7){var _0xf4aab4=_0x1a31bd;let _0x32685c,_0x444baf;try{_0x444baf=_0x3ff912(),_0x32685c=_0x2ca4a2[_0x155c96],!_0x32685c||_0x444baf-_0x32685c['ts']>_0x26408[_0xf4aab4(0x17c)][_0xf4aab4(0x159)]&&_0x32685c[_0xf4aab4(0x1af)]&&_0x32685c['time']/_0x32685c['count']<_0x26408['perLogpoint'][_0xf4aab4(0x1b9)]?(_0x2ca4a2[_0x155c96]=_0x32685c={'count':0x0,'time':0x0,'ts':_0x444baf},_0x2ca4a2[_0xf4aab4(0x1c3)]={}):_0x444baf-_0x2ca4a2[_0xf4aab4(0x1c3)]['ts']>_0x26408[_0xf4aab4(0x141)][_0xf4aab4(0x159)]&&_0x2ca4a2[_0xf4aab4(0x1c3)][_0xf4aab4(0x1af)]&&_0x2ca4a2[_0xf4aab4(0x1c3)]['time']/_0x2ca4a2[_0xf4aab4(0x1c3)][_0xf4aab4(0x1af)]<_0x26408[_0xf4aab4(0x141)][_0xf4aab4(0x1b9)]&&(_0x2ca4a2['hits']={});let _0x7759e2=[],_0x46d26c=_0x32685c['reduceLimits']||_0x2ca4a2[_0xf4aab4(0x1c3)][_0xf4aab4(0x152)]?_0x2d0eef:_0x2e7ad6,_0x215a15=_0x433183=>{var _0x2cfba1=_0xf4aab4;let _0x4ff017={};return _0x4ff017['props']=_0x433183['props'],_0x4ff017['elements']=_0x433183[_0x2cfba1(0x1e8)],_0x4ff017[_0x2cfba1(0x1f6)]=_0x433183[_0x2cfba1(0x1f6)],_0x4ff017['totalStrLength']=_0x433183[_0x2cfba1(0x1e1)],_0x4ff017[_0x2cfba1(0x202)]=_0x433183[_0x2cfba1(0x202)],_0x4ff017[_0x2cfba1(0x150)]=_0x433183['autoExpandMaxDepth'],_0x4ff017[_0x2cfba1(0x239)]=!0x1,_0x4ff017[_0x2cfba1(0x19e)]=!_0x3a4e21,_0x4ff017[_0x2cfba1(0x20b)]=0x1,_0x4ff017[_0x2cfba1(0x209)]=0x0,_0x4ff017[_0x2cfba1(0x23d)]=_0x2cfba1(0x21a),_0x4ff017[_0x2cfba1(0x1b7)]=_0x2cfba1(0x160),_0x4ff017['autoExpand']=!0x0,_0x4ff017[_0x2cfba1(0x1b8)]=[],_0x4ff017[_0x2cfba1(0x148)]=0x0,_0x4ff017[_0x2cfba1(0x1f4)]=_0x1e7bbb['resolveGetters'],_0x4ff017[_0x2cfba1(0x1c5)]=0x0,_0x4ff017[_0x2cfba1(0x1cc)]={'current':void 0x0,'parent':void 0x0,'index':0x0},_0x4ff017;};for(var _0x3e7411=0x0;_0x3e7411<_0x530986[_0xf4aab4(0x1eb)];_0x3e7411++)_0x7759e2[_0xf4aab4(0x1ad)](_0x41722d[_0xf4aab4(0x192)]({'timeNode':_0x197d49==='time'||void 0x0},_0x530986[_0x3e7411],_0x215a15(_0x46d26c),{}));if(_0x197d49===_0xf4aab4(0x157)||_0x197d49==='error'){let _0x4c2b64=Error[_0xf4aab4(0x1a6)];try{Error[_0xf4aab4(0x1a6)]=0x1/0x0,_0x7759e2[_0xf4aab4(0x1ad)](_0x41722d[_0xf4aab4(0x192)]({'stackNode':!0x0},new Error()[_0xf4aab4(0x201)],_0x215a15(_0x46d26c),{'strLength':0x1/0x0}));}finally{Error['stackTraceLimit']=_0x4c2b64;}}return{'method':_0xf4aab4(0x1bf),'version':_0x2e5f89,'args':[{'ts':_0x423389,'session':_0x40e219,'args':_0x7759e2,'id':_0x155c96,'context':_0xac5a7}]};}catch(_0x12b1ee){return{'method':_0xf4aab4(0x1bf),'version':_0x2e5f89,'args':[{'ts':_0x423389,'session':_0x40e219,'args':[{'type':'unknown','error':_0x12b1ee&&_0x12b1ee[_0xf4aab4(0x213)]}],'id':_0x155c96,'context':_0xac5a7}]};}finally{try{if(_0x32685c&&_0x444baf){let _0x142a04=_0x3ff912();_0x32685c[_0xf4aab4(0x1af)]++,_0x32685c['time']+=_0x962125(_0x444baf,_0x142a04),_0x32685c['ts']=_0x142a04,_0x2ca4a2[_0xf4aab4(0x1c3)][_0xf4aab4(0x1af)]++,_0x2ca4a2[_0xf4aab4(0x1c3)]['time']+=_0x962125(_0x444baf,_0x142a04),_0x2ca4a2[_0xf4aab4(0x1c3)]['ts']=_0x142a04,(_0x32685c['count']>_0x26408[_0xf4aab4(0x17c)][_0xf4aab4(0x18f)]||_0x32685c[_0xf4aab4(0x203)]>_0x26408[_0xf4aab4(0x17c)][_0xf4aab4(0x183)])&&(_0x32685c[_0xf4aab4(0x152)]=!0x0),(_0x2ca4a2['hits']['count']>_0x26408[_0xf4aab4(0x141)][_0xf4aab4(0x18f)]||_0x2ca4a2[_0xf4aab4(0x1c3)][_0xf4aab4(0x203)]>_0x26408[_0xf4aab4(0x141)]['reduceOnAccumulatedProcessingTimeMs'])&&(_0x2ca4a2[_0xf4aab4(0x1c3)]['reduceLimits']=!0x0);}}catch{}}}return _0xf0f807;}function G(_0x2081f3){var _0x1905aa=_0x4d59fc;if(_0x2081f3&&typeof _0x2081f3==_0x1905aa(0x1ef)&&_0x2081f3[_0x1905aa(0x211)])switch(_0x2081f3[_0x1905aa(0x211)][_0x1905aa(0x185)]){case'Promise':return _0x2081f3[_0x1905aa(0x1a8)](Symbol[_0x1905aa(0x186)])?Promise[_0x1905aa(0x142)]():_0x2081f3;case _0x1905aa(0x175):return Promise['resolve']();}return _0x2081f3;}((_0x109be4,_0x47de4c,_0x219038,_0x1de027,_0x504802,_0x5dddba,_0x104a90,_0x2163d9,_0x546607,_0x579a7c,_0x5aef38,_0x342de0)=>{var _0x58dd81=_0x4d59fc;if(_0x109be4[_0x58dd81(0x207)])return _0x109be4[_0x58dd81(0x207)];let _0x937f0c={'consoleLog':()=>{},'consoleTrace':()=>{},'consoleTime':()=>{},'consoleTimeEnd':()=>{},'autoLog':()=>{},'autoLogMany':()=>{},'autoTraceMany':()=>{},'coverage':()=>{},'autoTrace':()=>{},'autoTime':()=>{},'autoTimeEnd':()=>{}};if(!X(_0x109be4,_0x2163d9,_0x504802))return _0x109be4[_0x58dd81(0x207)]=_0x937f0c,_0x109be4[_0x58dd81(0x207)];let _0x539619=b(_0x109be4),_0x49137e=_0x539619[_0x58dd81(0x1b0)],_0x546106=_0x539619[_0x58dd81(0x1c4)],_0x865d59=_0x539619['now'],_0x48beae={'hits':{},'ts':{}},_0x924d51=J(_0x109be4,_0x546607,_0x48beae,_0x5dddba,_0x342de0,_0x504802===_0x58dd81(0x214)?G:void 0x0),_0x489b61=(_0x2a647a,_0x54ebb7,_0x8fca6b,_0x582afe,_0x12834f,_0x201a9e)=>{var _0x2d7eba=_0x58dd81;let _0xb8ecae=_0x109be4[_0x2d7eba(0x207)];try{return _0x109be4[_0x2d7eba(0x207)]=_0x937f0c,_0x924d51(_0x2a647a,_0x54ebb7,_0x8fca6b,_0x582afe,_0x12834f,_0x201a9e);}finally{_0x109be4[_0x2d7eba(0x207)]=_0xb8ecae;}},_0x28c66f=_0x186bb3=>{_0x48beae['ts'][_0x186bb3]=_0x546106();},_0x540fbe=(_0x437150,_0xb19cc8)=>{var _0x7599f6=_0x58dd81;let _0x329775=_0x48beae['ts'][_0xb19cc8];if(delete _0x48beae['ts'][_0xb19cc8],_0x329775){let _0x2a62bd=_0x49137e(_0x329775,_0x546106());_0x3077c5(_0x489b61(_0x7599f6(0x203),_0x437150,_0x865d59(),_0xf3ed42,[_0x2a62bd],_0xb19cc8));}},_0x2253db=_0x55641f=>{var _0x196436=_0x58dd81,_0x342682;return _0x504802===_0x196436(0x214)&&_0x109be4[_0x196436(0x14a)]&&((_0x342682=_0x55641f==null?void 0x0:_0x55641f[_0x196436(0x164)])==null?void 0x0:_0x342682[_0x196436(0x1eb)])&&(_0x55641f[_0x196436(0x164)][0x0][_0x196436(0x14a)]=_0x109be4['origin']),_0x55641f;};_0x109be4[_0x58dd81(0x207)]={'consoleLog':(_0x1c94c2,_0x57f486)=>{var _0x272fd2=_0x58dd81;_0x109be4[_0x272fd2(0x15a)][_0x272fd2(0x1bf)]['name']!=='disabledLog'&&_0x3077c5(_0x489b61(_0x272fd2(0x1bf),_0x1c94c2,_0x865d59(),_0xf3ed42,_0x57f486));},'consoleTrace':(_0x408033,_0x3d6ee2)=>{var _0x5512e9=_0x58dd81,_0x4f039b,_0x36ab76;_0x109be4[_0x5512e9(0x15a)][_0x5512e9(0x1bf)]['name']!==_0x5512e9(0x249)&&((_0x36ab76=(_0x4f039b=_0x109be4[_0x5512e9(0x1b1)])==null?void 0x0:_0x4f039b[_0x5512e9(0x195)])!=null&&_0x36ab76[_0x5512e9(0x1cc)]&&(_0x109be4[_0x5512e9(0x219)]=!0x0),_0x3077c5(_0x2253db(_0x489b61(_0x5512e9(0x157),_0x408033,_0x865d59(),_0xf3ed42,_0x3d6ee2))));},'consoleError':(_0x3ae1c3,_0x40eae7)=>{var _0x3047e8=_0x58dd81;_0x109be4[_0x3047e8(0x219)]=!0x0,_0x3077c5(_0x2253db(_0x489b61(_0x3047e8(0x1bd),_0x3ae1c3,_0x865d59(),_0xf3ed42,_0x40eae7)));},'consoleTime':_0x47fb92=>{_0x28c66f(_0x47fb92);},'consoleTimeEnd':(_0x17e1ed,_0x41eacf)=>{_0x540fbe(_0x41eacf,_0x17e1ed);},'autoLog':(_0x550353,_0x633a1e)=>{var _0x46914c=_0x58dd81;_0x3077c5(_0x489b61(_0x46914c(0x1bf),_0x633a1e,_0x865d59(),_0xf3ed42,[_0x550353]));},'autoLogMany':(_0x49c92b,_0x354b8e)=>{_0x3077c5(_0x489b61('log',_0x49c92b,_0x865d59(),_0xf3ed42,_0x354b8e));},'autoTrace':(_0x13f2ce,_0x3e0373)=>{var _0x1d0dbb=_0x58dd81;_0x3077c5(_0x2253db(_0x489b61(_0x1d0dbb(0x157),_0x3e0373,_0x865d59(),_0xf3ed42,[_0x13f2ce])));},'autoTraceMany':(_0x378791,_0x315e68)=>{var _0x5ac02b=_0x58dd81;_0x3077c5(_0x2253db(_0x489b61(_0x5ac02b(0x157),_0x378791,_0x865d59(),_0xf3ed42,_0x315e68)));},'autoTime':(_0x1025e2,_0x5a5f5b,_0x4338f6)=>{_0x28c66f(_0x4338f6);},'autoTimeEnd':(_0x153630,_0x4bffc3,_0x4b3b1a)=>{_0x540fbe(_0x4bffc3,_0x4b3b1a);},'coverage':_0x4dcc36=>{var _0x49bfbe=_0x58dd81;_0x3077c5({'method':_0x49bfbe(0x1fe),'version':_0x5dddba,'args':[{'id':_0x4dcc36}]});}};let _0x3077c5=H(_0x109be4,_0x47de4c,_0x219038,_0x1de027,_0x504802,_0x579a7c,_0x5aef38),_0xf3ed42=_0x109be4['_console_ninja_session'];return _0x109be4[_0x58dd81(0x207)];})(globalThis,'127.0.0.1',_0x4d59fc(0x1c6),\"c:\\\\Users\\\\USER\\\\.cursor\\\\extensions\\\\wallabyjs.console-ninja-1.0.490-universal\\\\node_modules\",_0x4d59fc(0x229),_0x4d59fc(0x1ae),_0x4d59fc(0x168),[\"localhost\",\"127.0.0.1\",\"example.cypress.io\",\"10.0.2.2\",\"T24062\",\"192.168.10.98\",\"172.20.240.1\"],_0x4d59fc(0x1dc),_0x4d59fc(0x1fd),_0x4d59fc(0x1da),_0x4d59fc(0x147));function _0x4900(_0x2a3856,_0x4d4e14){var _0x3eb776=_0x3eb7();return _0x4900=function(_0x4900f7,_0x94e300){_0x4900f7=_0x4900f7-0x13e;var _0x4520b4=_0x3eb776[_0x4900f7];return _0x4520b4;},_0x4900(_0x2a3856,_0x4d4e14);}function _0x3eb7(){var _0x32b9af=['Console\\x20Ninja\\x20extension\\x20is\\x20connected\\x20to\\x20','perLogpoint','getWebSocketClass','date','toString','negativeZero','_cleanNode','_maxConnectAttemptCount','reduceOnAccumulatedProcessingTimeMs','_treeNodePropertiesBeforeFullValue','name','iterator','prototype','react-native','_setNodeExpressionPath','_numberRegExp','_setNodePermissions','66IYuvCA','_propertyName','_disposeWebsocket','reduceOnCount','warn','onmessage','serialize','astro','_inNextEdge','versions','_consoleNinjaAllowedToStart','map','22zUKoiq','_isNegativeZero','_hasSetOnItsPath','_allowedToSend','fromCharCode','failed\\x20to\\x20find\\x20and\\x20load\\x20WebSocket','noFunctions','android','_connectToHostNow','sort','[object\\x20Array]','90756naArOP','positiveInfinity','reducePolicy','stackTraceLimit','POSITIVE_INFINITY','hasOwnProperty','_setNodeQueryPath','match','replace','NEGATIVE_INFINITY','push','1.0.0','count','elapsed','process','see\\x20https://tinyurl.com/2vt8jxzw\\x20for\\x20more\\x20info.','indexOf','_addProperty','_treeNodePropertiesAfterFullValue','4jfdQad','rootExpression','autoExpandPreviousObjects','resetOnProcessingTimeAverageMs','toLowerCase','_getOwnPropertyDescriptor','_connectAttemptCount','error','915081DyLlsw','log','_attemptToReconnectShortly','edge','10.0.2.2','hits','timeStamp','allStrLength','52907','array','nan','_connecting','_ws','isExpressionToEvaluate','node','_isPrimitiveWrapperType','[object\\x20BigInt]','return\\x20import(url.pathToFileURL(path.join(nodeModules,\\x20\\x27ws/index.js\\x27)).toString());','_undefined','_extendedWarning','modules','gateway.docker.internal','Map','getOwnPropertyNames','stringify','1316KZIUwO','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host','then','1','ninjaSuppressConsole','','string','unknown','funcName','valueOf','totalStrLength','perf_hooks','data','_isUndefined','ws://','_inBrowser','583VBcPUu','elements','boolean','Symbol','length','_sendErrorMessage','_capIfString','set','object','import(\\x27url\\x27)','getter','_setNodeExpandableState','_reconnectTimeout','resolveGetters','current','strLength','call','Buffer','reducedLimits','5114490JMuSOE','315635PMwvnU','_isArray','','coverage','NEXT_RUNTIME','parse','stack','autoExpandLimit','time','https://tinyurl.com/37x8b79t','url','ExpoDevice','_console_ninja','background:\\x20rgb(30,30,30);\\x20color:\\x20rgb(255,213,92)','level','osName','depth','catch','_connected','value','_property','hostname','constructor','RegExp','message','next.js','_getOwnPropertyNames','location','_dateToString','charAt','_ninjaIgnoreNextError','root_exp_id','cappedProps','_WebSocketClass','WebSocket','_console_ninja_session','join','unshift','concat','now','host','some','bind','_isPrimitiveType','%c\\x20Console\\x20Ninja\\x20extension\\x20is\\x20connected\\x20to\\x20','performance','nest.js','expressionsToEvaluate','263263RKWsui','path','reload','HTMLAllCollection','_isMap','_socket','81857kjxXvz','index','autoExpand','parent','props','getOwnPropertyDescriptor','_addObjectProperty','_isSet','sortProps','_allowedToConnectOnSend','hrtime','String','expId','expo','[object\\x20Set]','\\x20browser','_objectToString','_Symbol','79888SlVqCQ','_regExpToString','test','dockerizedApp','undefined','null','disabledTrace','\\x20server','substr','forEach','env','[object\\x20Map]','global','resolve','_WebSocket','close','_type','slice',{\"resolveGetters\":false,\"defaultLimits\":{\"props\":100,\"elements\":100,\"strLength\":51200,\"totalStrLength\":51200,\"autoExpandLimit\":5000,\"autoExpandMaxDepth\":10},\"reducedLimits\":{\"props\":5,\"elements\":5,\"strLength\":256,\"totalStrLength\":768,\"autoExpandLimit\":30,\"autoExpandMaxDepth\":2},\"reducePolicy\":{\"perLogpoint\":{\"reduceOnCount\":50,\"reduceOnAccumulatedProcessingTimeMs\":100,\"resetWhenQuietMs\":500,\"resetOnProcessingTimeAverageMs\":100},\"global\":{\"reduceOnCount\":1000,\"reduceOnAccumulatedProcessingTimeMs\":300,\"resetWhenQuietMs\":50,\"resetOnProcessingTimeAverageMs\":100}}},'autoExpandPropertyCount','...','origin','9XEwpGz','endsWith','type','unref','_p_','autoExpandMaxDepth','defaultLimits','reduceLimits','_processTreeNodeResult','logger\\x20websocket\\x20error','_blacklistedProperty','function','trace','_webSocketErrorDocsLink','resetWhenQuietMs','console','_quotedRegExp','failed\\x20to\\x20connect\\x20to\\x20host:\\x20','symbol','eventReceivedCallback','number','root_exp','remix','_setNodeLabel','Set','args','angular','nodeModules','onopen','1762996685677','_addFunctionsNode','default','negativeInfinity','_hasSymbolPropertyOnItsPath','capped','getOwnPropertySymbols','91gWcIuO','Number','_p_length','get','_hasMapOnItsPath','_setNodeId','bound\\x20Promise','_getOwnPropertySymbols','_additionalMetadata','port','bigint','_HTMLAllCollection'];_0x3eb7=function(){return _0x32b9af;};return _0x3eb7();}");
}
catch (e) {
    console.error(e);
} }
;
function oo_oo(i, ...v) { try {
    oo_cm().consoleLog(i, v);
}
catch (e) { } return v; }
;
oo_oo;
function oo_tr(i, ...v) { try {
    oo_cm().consoleTrace(i, v);
}
catch (e) { } return v; }
;
oo_tr;
function oo_tx(i, ...v) { try {
    oo_cm().consoleError(i, v);
}
catch (e) { } return v; }
;
oo_tx;
function oo_ts(v) { try {
    oo_cm().consoleTime(v);
}
catch (e) { } return v; }
;
oo_ts;
function oo_te(v, i) { try {
    oo_cm().consoleTimeEnd(v, i);
}
catch (e) { } return v; }
;
oo_te;
//# sourceMappingURL=phase1-organization.generator.js.map