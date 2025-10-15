import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, Not, IsNull } from 'typeorm';
import { Employee } from './employee.entity';
import {
  EmployeeStatus,
  EmployeeStatistics,
  EmployeeFilter,
  EmployeeGender,
} from './employee.types';
import { IEmployeeRepository } from './employee.repository.interface';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

/**
 * 직원 리포지토리
 *
 * 직원 엔티티에 대한 데이터베이스 접근을 담당합니다.
 * 트랜잭션 관리를 위해 EntityManager를 선택적으로 받을 수 있습니다.
 */
@Injectable()
export class EmployeeRepository implements IEmployeeRepository {
  constructor(
    @InjectRepository(Employee)
    private readonly repository: Repository<Employee>,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  /**
   * ID로 직원 조회
   */
  async findByIdWithManager(
    id: string,
    manager?: EntityManager,
  ): Promise<Employee | null> {
    const repository = this.transactionManager.getRepository(
      Employee,
      this.repository,
      manager,
    );
    return repository.findOne({ where: { id } });
  }

  /**
   * ID로 직원 조회 (기존 호환성)
   */
  async findById(
    id: string,
    manager?: EntityManager,
  ): Promise<Employee | null> {
    return this.findByIdWithManager(id, manager);
  }

  /**
   * 외부 ID로 직원 조회
   */
  async findByExternalIdWithManager(
    externalId: string,
    manager?: EntityManager,
  ): Promise<Employee | null> {
    const repository = this.transactionManager.getRepository(
      Employee,
      this.repository,
      manager,
    );
    return repository.findOne({ where: { externalId } });
  }

  /**
   * 외부 ID로 직원 조회 (기존 호환성)
   */
  async findByExternalId(
    externalId: string,
    manager?: EntityManager,
  ): Promise<Employee | null> {
    return this.findByExternalIdWithManager(externalId, manager);
  }

  /**
   * 모든 직원 조회
   */
  async findAllWithManager(
    manager?: EntityManager,
    includeExcluded: boolean = false,
  ): Promise<Employee[]> {
    const repository = this.transactionManager.getRepository(
      Employee,
      this.repository,
      manager,
    );

    const where: any = {};
    // 기본적으로 제외된 직원은 보이지 않음
    if (!includeExcluded) {
      where.isExcludedFromList = false;
    }

    return repository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  /**
   * 모든 직원 조회 (기존 호환성)
   */
  async findAll(manager?: EntityManager): Promise<Employee[]> {
    return this.findAllWithManager(manager);
  }

  /**
   * 직원 저장
   */
  async saveWithManager(
    employee: Employee,
    manager?: EntityManager,
  ): Promise<Employee> {
    const repository = this.transactionManager.getRepository(
      Employee,
      this.repository,
      manager,
    );
    return repository.save(employee);
  }

  /**
   * 직원 저장 (기존 호환성)
   */
  async save(employee: Employee, manager?: EntityManager): Promise<Employee> {
    return this.saveWithManager(employee, manager);
  }

  /**
   * 여러 직원 일괄 저장
   */
  async saveManyWithManager(
    employees: Employee[],
    manager?: EntityManager,
  ): Promise<Employee[]> {
    const repository = this.transactionManager.getRepository(
      Employee,
      this.repository,
      manager,
    );
    return repository.save(employees);
  }

  /**
   * 여러 직원 일괄 저장 (기존 호환성)
   */
  async saveMany(
    employees: Employee[],
    manager?: EntityManager,
  ): Promise<Employee[]> {
    return this.saveManyWithManager(employees, manager);
  }

  /**
   * 직원 삭제
   */
  async deleteWithManager(id: string, manager?: EntityManager): Promise<void> {
    const repository = this.transactionManager.getRepository(
      Employee,
      this.repository,
      manager,
    );
    await repository.delete(id);
  }

  /**
   * 직원 삭제 (기존 호환성)
   */
  async delete(id: string, manager?: EntityManager): Promise<void> {
    return this.deleteWithManager(id, manager);
  }

  /**
   * 직원번호로 직원 조회
   */
  async findByEmployeeNumberWithManager(
    employeeNumber: string,
    manager?: EntityManager,
  ): Promise<Employee | null> {
    const repository = this.transactionManager.getRepository(
      Employee,
      this.repository,
      manager,
    );
    return repository.findOne({ where: { employeeNumber } });
  }

  /**
   * 직원번호로 직원 조회 (기존 호환성)
   */
  async findByEmployeeNumber(
    employeeNumber: string,
    manager?: EntityManager,
  ): Promise<Employee | null> {
    return this.findByEmployeeNumberWithManager(employeeNumber, manager);
  }

  /**
   * 이메일로 직원 조회
   */
  async findByEmailWithManager(
    email: string,
    manager?: EntityManager,
  ): Promise<Employee | null> {
    const repository = this.transactionManager.getRepository(
      Employee,
      this.repository,
      manager,
    );
    return repository.findOne({ where: { email } });
  }

  /**
   * 이메일로 직원 조회 (기존 호환성)
   */
  async findByEmail(
    email: string,
    manager?: EntityManager,
  ): Promise<Employee | null> {
    return this.findByEmailWithManager(email, manager);
  }

  /**
   * 필터로 직원 조회
   */
  async findByFilterWithManager(
    filter: EmployeeFilter,
    manager?: EntityManager,
  ): Promise<Employee[]> {
    const repository = this.transactionManager.getRepository(
      Employee,
      this.repository,
      manager,
    );
    const queryBuilder = repository.createQueryBuilder('employee');

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

    return queryBuilder.orderBy('employee.name', 'ASC').getMany();
  }

  /**
   * 필터로 직원 조회 (기존 호환성)
   */
  async findByFilter(
    filter: EmployeeFilter,
    manager?: EntityManager,
  ): Promise<Employee[]> {
    return this.findByFilterWithManager(filter, manager);
  }

  /**
   * 부서별 직원 목록 조회
   */
  async findByDepartmentIdWithManager(
    departmentId: string,
    manager?: EntityManager,
  ): Promise<Employee[]> {
    const repository = this.transactionManager.getRepository(
      Employee,
      this.repository,
      manager,
    );
    return repository.find({
      where: { departmentId },
      order: { name: 'ASC' },
    });
  }

  /**
   * 부서별 직원 목록 조회 (기존 호환성)
   */
  async findByDepartmentId(
    departmentId: string,
    manager?: EntityManager,
  ): Promise<Employee[]> {
    return this.findByDepartmentIdWithManager(departmentId, manager);
  }

  /**
   * 상태별 직원 조회
   */
  async findByStatusWithManager(
    status: EmployeeStatus,
    manager?: EntityManager,
  ): Promise<Employee[]> {
    const repository = this.transactionManager.getRepository(
      Employee,
      this.repository,
      manager,
    );
    return repository.find({
      where: { status },
      order: { name: 'ASC' },
    });
  }

  /**
   * 상태별 직원 조회 (기존 호환성)
   */
  async findByStatus(
    status: EmployeeStatus,
    manager?: EntityManager,
  ): Promise<Employee[]> {
    return this.findByStatusWithManager(status, manager);
  }

  /**
   * 성별로 직원 조회
   */
  async findByGenderWithManager(
    gender: EmployeeGender,
    manager?: EntityManager,
  ): Promise<Employee[]> {
    const repository = this.transactionManager.getRepository(
      Employee,
      this.repository,
      manager,
    );
    return repository.find({
      where: { gender },
      order: { name: 'ASC' },
    });
  }

  /**
   * 성별로 직원 조회 (기존 호환성)
   */
  async findByGender(
    gender: EmployeeGender,
    manager?: EntityManager,
  ): Promise<Employee[]> {
    return this.findByGenderWithManager(gender, manager);
  }

  /**
   * 직급별 직원 조회
   */
  async findByPositionIdWithManager(
    positionId: string,
    manager?: EntityManager,
  ): Promise<Employee[]> {
    const repository = this.transactionManager.getRepository(
      Employee,
      this.repository,
      manager,
    );
    return repository.find({
      where: { positionId },
      order: { name: 'ASC' },
    });
  }

  /**
   * 직급별 직원 조회 (기존 호환성)
   */
  async findByPositionId(
    positionId: string,
    manager?: EntityManager,
  ): Promise<Employee[]> {
    return this.findByPositionIdWithManager(positionId, manager);
  }

  /**
   * 직책별 직원 조회
   */
  async findByRankIdWithManager(
    rankId: string,
    manager?: EntityManager,
  ): Promise<Employee[]> {
    const repository = this.transactionManager.getRepository(
      Employee,
      this.repository,
      manager,
    );
    return repository.find({
      where: { rankId },
      order: { name: 'ASC' },
    });
  }

  /**
   * 직책별 직원 조회 (기존 호환성)
   */
  async findByRankId(
    rankId: string,
    manager?: EntityManager,
  ): Promise<Employee[]> {
    return this.findByRankIdWithManager(rankId, manager);
  }

  /**
   * 활성 직원 목록 조회
   */
  async findActiveEmployeesWithManager(
    manager?: EntityManager,
  ): Promise<Employee[]> {
    const repository = this.transactionManager.getRepository(
      Employee,
      this.repository,
      manager,
    );
    return repository.find({
      where: { status: '재직중' },
      order: { name: 'ASC' },
    });
  }

  /**
   * 활성 직원 목록 조회 (기존 호환성)
   */
  async findActiveEmployees(manager?: EntityManager): Promise<Employee[]> {
    return this.findActiveEmployeesWithManager(manager);
  }

  /**
   * 직원명으로 검색 (부분 일치)
   */
  async searchByNameWithManager(
    searchTerm: string,
    manager?: EntityManager,
  ): Promise<Employee[]> {
    const repository = this.transactionManager.getRepository(
      Employee,
      this.repository,
      manager,
    );
    return repository
      .createQueryBuilder('employee')
      .where('employee.name ILIKE :searchTerm', {
        searchTerm: `%${searchTerm}%`,
      })
      .orderBy('employee.name', 'ASC')
      .getMany();
  }

  /**
   * 직원명으로 검색 (기존 호환성)
   */
  async searchByName(
    searchTerm: string,
    manager?: EntityManager,
  ): Promise<Employee[]> {
    return this.searchByNameWithManager(searchTerm, manager);
  }

  /**
   * 직원 통계 조회
   */
  async getEmployeeStatsWithManager(
    manager?: EntityManager,
  ): Promise<EmployeeStatistics> {
    const repository = this.transactionManager.getRepository(
      Employee,
      this.repository,
      manager,
    );

    const [
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      resignedEmployees,
    ] = await Promise.all([
      repository.count(),
      repository.count({ where: { status: '재직중' } }),
      repository.count({ where: { status: '휴직중' } }),
      repository.count({ where: { status: '퇴사' } }),
    ]);

    const departmentStats = await repository
      .createQueryBuilder('employee')
      .select('employee.departmentId', 'departmentId')
      .addSelect('COUNT(*)', 'count')
      .where('employee.departmentId IS NOT NULL')
      .groupBy('employee.departmentId')
      .getRawMany();

    const positionStats = await repository
      .createQueryBuilder('employee')
      .select('employee.positionId', 'positionId')
      .addSelect('COUNT(*)', 'count')
      .where('employee.positionId IS NOT NULL')
      .groupBy('employee.positionId')
      .getRawMany();

    const rankStats = await repository
      .createQueryBuilder('employee')
      .select('employee.rankId', 'rankId')
      .addSelect('COUNT(*)', 'count')
      .where('employee.rankId IS NOT NULL')
      .groupBy('employee.rankId')
      .getRawMany();

    const genderStats = await repository
      .createQueryBuilder('employee')
      .select('employee.gender', 'gender')
      .addSelect('COUNT(*)', 'count')
      .where('employee.gender IS NOT NULL')
      .groupBy('employee.gender')
      .getRawMany();

    const statusStats = await repository
      .createQueryBuilder('employee')
      .select('employee.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('employee.status')
      .getRawMany();

    // 마지막 동기화 시간 조회
    const lastSyncResult = await repository
      .createQueryBuilder('employee')
      .select('MAX(employee.lastSyncAt)', 'lastSyncAt')
      .getRawOne();

    return {
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      resignedEmployees,
      employeesByDepartment: departmentStats.reduce((acc, stat) => {
        acc[stat.departmentId] = parseInt(stat.count);
        return acc;
      }, {}),
      employeesByPosition: positionStats.reduce((acc, stat) => {
        acc[stat.positionId] = parseInt(stat.count);
        return acc;
      }, {}),
      employeesByRank: rankStats.reduce((acc, stat) => {
        acc[stat.rankId] = parseInt(stat.count);
        return acc;
      }, {}),
      employeesByGender: genderStats.reduce((acc, stat) => {
        acc[stat.gender] = parseInt(stat.count);
        return acc;
      }, {}),
      employeesByStatus: statusStats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.count);
        return acc;
      }, {}),
      lastSyncAt: lastSyncResult.lastSyncAt
        ? new Date(lastSyncResult.lastSyncAt)
        : undefined,
    };
  }

  /**
   * 직원 통계 조회 (기존 호환성)
   */
  async getEmployeeStats(manager?: EntityManager): Promise<EmployeeStatistics> {
    return this.getEmployeeStatsWithManager(manager);
  }
}
