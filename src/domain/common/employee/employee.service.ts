import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Employee } from './employee.entity';
import {
  EmployeeDto,
  EmployeeFilter,
  EmployeeListOptions,
} from './employee.types';

/**
 * 직원 도메인 서비스
 *
 * 직원 엔티티의 비즈니스 로직을 담당하는 서비스입니다.
 */
@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  /**
   * ID로 직원을 조회한다
   * @param id 직원 ID
   * @returns 직원 정보 (없으면 null)
   */
  async ID로_조회한다(id: string): Promise<EmployeeDto | null> {
    const employee = await this.employeeRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    return employee ? employee.DTO로_변환한다() : null;
  }

  /**
   * 직원 번호로 직원을 조회한다
   * @param employeeNumber 직원 번호
   * @returns 직원 정보 (없으면 null)
   */
  async 직원번호로_조회한다(
    employeeNumber: string,
  ): Promise<EmployeeDto | null> {
    const employee = await this.employeeRepository.findOne({
      where: { employeeNumber, deletedAt: IsNull() },
    });

    return employee ? employee.DTO로_변환한다() : null;
  }

  /**
   * 이메일로 직원을 조회한다
   * @param email 이메일
   * @returns 직원 정보 (없으면 null)
   */
  async 이메일로_조회한다(email: string): Promise<EmployeeDto | null> {
    const employee = await this.employeeRepository.findOne({
      where: { email, deletedAt: IsNull() },
    });

    return employee ? employee.DTO로_변환한다() : null;
  }

  /**
   * 필터 조건으로 직원 목록을 조회한다
   * @param filter 필터 조건
   * @returns 직원 목록
   */
  async 필터_조회한다(filter: EmployeeFilter): Promise<EmployeeDto[]> {
    const queryBuilder = this.employeeRepository.createQueryBuilder('employee');
    queryBuilder.where('employee.deletedAt IS NULL');

    if (filter.departmentId) {
      queryBuilder.andWhere('employee.departmentId = :departmentId', {
        departmentId: filter.departmentId,
      });
    }

    if (filter.positionId) {
      queryBuilder.andWhere('employee.positionId = :positionId', {
        positionId: filter.positionId,
      });
    }

    if (filter.rankId) {
      queryBuilder.andWhere('employee.rankId = :rankId', {
        rankId: filter.rankId,
      });
    }

    if (filter.status) {
      queryBuilder.andWhere('employee.status = :status', {
        status: filter.status,
      });
    }

    if (filter.gender) {
      queryBuilder.andWhere('employee.gender = :gender', {
        gender: filter.gender,
      });
    }

    if (filter.managerId) {
      queryBuilder.andWhere('employee.managerId = :managerId', {
        managerId: filter.managerId,
      });
    }

    // 조회 제외 필터 (기본값: false - 제외된 직원은 보이지 않음)
    if (filter.includeExcluded !== true) {
      queryBuilder.andWhere('employee.isExcludedFromList = :isExcluded', {
        isExcluded: false,
      });
    }

    const employees = await queryBuilder.getMany();
    return employees.map((employee) => employee.DTO로_변환한다());
  }

  /**
   * 옵션에 따라 직원 목록을 조회한다 (페이징, 정렬 포함)
   * @param options 조회 옵션
   * @returns 직원 목록과 총 개수
   */
  async 목록_조회한다(options: EmployeeListOptions = {}): Promise<{
    employees: EmployeeDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      filter = {},
    } = options;

    const queryBuilder = this.employeeRepository.createQueryBuilder('employee');
    queryBuilder.where('employee.deletedAt IS NULL');

    // 필터 적용
    if (filter.departmentId) {
      queryBuilder.andWhere('employee.departmentId = :departmentId', {
        departmentId: filter.departmentId,
      });
    }

    if (filter.positionId) {
      queryBuilder.andWhere('employee.positionId = :positionId', {
        positionId: filter.positionId,
      });
    }

    if (filter.rankId) {
      queryBuilder.andWhere('employee.rankId = :rankId', {
        rankId: filter.rankId,
      });
    }

    if (filter.status) {
      queryBuilder.andWhere('employee.status = :status', {
        status: filter.status,
      });
    }

    if (filter.gender) {
      queryBuilder.andWhere('employee.gender = :gender', {
        gender: filter.gender,
      });
    }

    if (filter.managerId) {
      queryBuilder.andWhere('employee.managerId = :managerId', {
        managerId: filter.managerId,
      });
    }

    // 조회 제외 필터 (기본값: false - 제외된 직원은 보이지 않음)
    if (filter.includeExcluded !== true) {
      queryBuilder.andWhere('employee.isExcludedFromList = :isExcluded', {
        isExcluded: false,
      });
    }

    // 정렬
    queryBuilder.orderBy(`employee.${sortBy}`, sortOrder);

    // 페이징
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [employees, total] = await queryBuilder.getManyAndCount();

    return {
      employees: employees.map((employee) => employee.DTO로_변환한다()),
      total,
      page,
      limit,
    };
  }

  /**
   * 전체 직원 목록을 조회한다
   * @param includeExcluded 제외된 직원도 포함할지 여부 (기본값: false)
   * @returns 전체 직원 목록
   */
  async 전체_조회한다(
    includeExcluded: boolean = false,
  ): Promise<EmployeeDto[]> {
    const where: any = { deletedAt: IsNull() };

    // 기본적으로 제외된 직원은 보이지 않음
    if (!includeExcluded) {
      where.isExcludedFromList = false;
    }

    const employees = await this.employeeRepository.find({
      where,
      order: { name: 'ASC' },
    });

    return employees.map((employee) => employee.DTO로_변환한다());
  }

  /**
   * 부서별 직원 목록을 조회한다
   * @param departmentId 부서 ID
   * @param includeExcluded 제외된 직원도 포함할지 여부 (기본값: false)
   * @returns 부서 직원 목록
   */
  async 부서별_조회한다(
    departmentId: string,
    includeExcluded: boolean = false,
  ): Promise<EmployeeDto[]> {
    const where: any = { departmentId, deletedAt: IsNull() };

    // 기본적으로 제외된 직원은 보이지 않음
    if (!includeExcluded) {
      where.isExcludedFromList = false;
    }

    const employees = await this.employeeRepository.find({
      where,
      order: { name: 'ASC' },
    });

    return employees.map((employee) => employee.DTO로_변환한다());
  }

  /**
   * 매니저별 직원 목록을 조회한다
   * @param managerId 매니저 ID
   * @param includeExcluded 제외된 직원도 포함할지 여부 (기본값: false)
   * @returns 매니저 하위 직원 목록
   */
  async 매니저별_조회한다(
    managerId: string,
    includeExcluded: boolean = false,
  ): Promise<EmployeeDto[]> {
    const where: any = { managerId, deletedAt: IsNull() };

    // 기본적으로 제외된 직원은 보이지 않음
    if (!includeExcluded) {
      where.isExcludedFromList = false;
    }

    const employees = await this.employeeRepository.find({
      where,
      order: { name: 'ASC' },
    });

    return employees.map((employee) => employee.DTO로_변환한다());
  }

  /**
   * 재직중인 직원 목록을 조회한다
   * @param includeExcluded 제외된 직원도 포함할지 여부 (기본값: false)
   * @returns 재직중 직원 목록
   */
  async 재직중_조회한다(
    includeExcluded: boolean = false,
  ): Promise<EmployeeDto[]> {
    const where: any = { status: '재직중', deletedAt: IsNull() };

    // 기본적으로 제외된 직원은 보이지 않음
    if (!includeExcluded) {
      where.isExcludedFromList = false;
    }

    const employees = await this.employeeRepository.find({
      where,
      order: { name: 'ASC' },
    });

    return employees.map((employee) => employee.DTO로_변환한다());
  }

  /**
   * 직원이 존재하는지 확인한다
   * @param id 직원 ID
   * @returns 존재 여부
   */
  async 존재하는가(id: string): Promise<boolean> {
    const count = await this.employeeRepository.count({
      where: { id, deletedAt: IsNull() },
    });
    return count > 0;
  }

  /**
   * 직원 번호가 존재하는지 확인한다
   * @param employeeNumber 직원 번호
   * @returns 존재 여부
   */
  async 직원번호가_존재하는가(employeeNumber: string): Promise<boolean> {
    const count = await this.employeeRepository.count({
      where: { employeeNumber, deletedAt: IsNull() },
    });
    return count > 0;
  }

  /**
   * 이메일이 존재하는지 확인한다
   * @param email 이메일
   * @returns 존재 여부
   */
  async 이메일이_존재하는가(email: string): Promise<boolean> {
    const count = await this.employeeRepository.count({
      where: { email, deletedAt: IsNull() },
    });
    return count > 0;
  }

  /**
   * 직원을 조회 목록에서 제외한다
   * @param id 직원 ID
   * @param excludeReason 제외 사유
   * @param excludedBy 제외 설정자
   * @returns 업데이트된 직원 정보
   */
  async 조회에서_제외한다(
    id: string,
    excludeReason: string,
    excludedBy: string,
  ): Promise<EmployeeDto | null> {
    const employee = await this.employeeRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!employee) {
      return null;
    }

    employee.isExcludedFromList = true;
    employee.excludeReason = excludeReason;
    employee.excludedBy = excludedBy;
    employee.excludedAt = new Date();
    employee.updatedBy = excludedBy;

    const updated = await this.employeeRepository.save(employee);
    return updated.DTO로_변환한다();
  }

  /**
   * 직원을 조회 목록에 다시 포함한다
   * @param id 직원 ID
   * @param updatedBy 포함 설정자
   * @returns 업데이트된 직원 정보
   */
  async 조회에_포함한다(
    id: string,
    updatedBy: string,
  ): Promise<EmployeeDto | null> {
    const employee = await this.employeeRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!employee) {
      return null;
    }

    employee.isExcludedFromList = false;
    employee.excludeReason = null;
    employee.excludedBy = null;
    employee.excludedAt = null;
    employee.updatedBy = updatedBy;

    const updated = await this.employeeRepository.save(employee);
    return updated.DTO로_변환한다();
  }

  /**
   * 직원의 조회 제외 상태를 확인한다
   * @param id 직원 ID
   * @returns 제외 여부
   */
  async 조회에서_제외되었는가(id: string): Promise<boolean> {
    const employee = await this.employeeRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    return employee ? employee.isExcludedFromList : false;
  }

  // ======================================
  // Auth Context를 위한 메서드들
  // ======================================

  /**
   * ID로 직원 엔티티를 조회한다
   * @param id 직원 ID
   * @returns 직원 엔티티 (없으면 null)
   */
  async findById(id: string): Promise<Employee | null> {
    return this.employeeRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  /**
   * 직원 번호로 직원 엔티티를 조회한다
   * @param employeeNumber 직원 번호
   * @returns 직원 엔티티 (없으면 null)
   */
  async findByEmployeeNumber(employeeNumber: string): Promise<Employee | null> {
    return this.employeeRepository.findOne({
      where: { employeeNumber, deletedAt: IsNull() },
    });
  }

  /**
   * 새 직원을 생성한다
   * @param data 직원 데이터
   * @returns 생성된 직원 엔티티
   */
  async create(data: Partial<Employee>): Promise<Employee> {
    const employee = this.employeeRepository.create(data);
    return this.employeeRepository.save(employee);
  }

  /**
   * 직원 정보를 업데이트한다
   * @param id 직원 ID
   * @param data 업데이트할 데이터
   * @returns 업데이트된 직원 엔티티
   */
  async update(id: string, data: Partial<Employee>): Promise<Employee | null> {
    const employee = await this.findById(id);
    if (!employee) {
      return null;
    }

    Object.assign(employee, data);
    return this.employeeRepository.save(employee);
  }

  /**
   * 직원의 역할 정보를 업데이트한다
   * @param id 직원 ID
   * @param roles 역할 배열
   * @returns 업데이트된 직원 엔티티
   */
  async updateRoles(id: string, roles: string[]): Promise<Employee | null> {
    const employee = await this.findById(id);
    if (!employee) {
      return null;
    }

    employee.roles = roles;
    return this.employeeRepository.save(employee);
  }
}
