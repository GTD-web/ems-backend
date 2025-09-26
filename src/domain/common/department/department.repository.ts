import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, Not, IsNull } from 'typeorm';
import { Department } from './department.entity';
import { DepartmentStatistics, DepartmentFilter } from './department.types';
import { IDepartmentRepository } from './department.repository.interface';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

/**
 * 부서 리포지토리
 *
 * 부서 엔티티에 대한 데이터베이스 접근을 담당합니다.
 * 트랜잭션 관리를 위해 EntityManager를 선택적으로 받을 수 있습니다.
 */
@Injectable()
export class DepartmentRepository implements IDepartmentRepository {
  constructor(
    @InjectRepository(Department)
    private readonly repository: Repository<Department>,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  /**
   * ID로 부서 조회
   */
  async findByIdWithManager(
    id: string,
    manager?: EntityManager,
  ): Promise<Department | null> {
    const repository = this.transactionManager.getRepository(
      Department,
      this.repository,
      manager,
    );
    return repository.findOne({ where: { id } });
  }

  /**
   * ID로 부서 조회 (기존 호환성)
   */
  async findById(
    id: string,
    manager?: EntityManager,
  ): Promise<Department | null> {
    return this.findByIdWithManager(id, manager);
  }

  /**
   * 외부 ID로 부서 조회
   */
  async findByExternalIdWithManager(
    externalId: string,
    manager?: EntityManager,
  ): Promise<Department | null> {
    const repository = this.transactionManager.getRepository(
      Department,
      this.repository,
      manager,
    );
    return repository.findOne({ where: { externalId } });
  }

  /**
   * 외부 ID로 부서 조회 (기존 호환성)
   */
  async findByExternalId(
    externalId: string,
    manager?: EntityManager,
  ): Promise<Department | null> {
    return this.findByExternalIdWithManager(externalId, manager);
  }

  /**
   * 모든 부서 조회
   */
  async findAllWithManager(manager?: EntityManager): Promise<Department[]> {
    const repository = this.transactionManager.getRepository(
      Department,
      this.repository,
      manager,
    );
    return repository.find({
      order: { order: 'ASC', name: 'ASC' },
    });
  }

  /**
   * 모든 부서 조회 (기존 호환성)
   */
  async findAll(manager?: EntityManager): Promise<Department[]> {
    return this.findAllWithManager(manager);
  }

  /**
   * 필터로 부서 조회
   */
  async findByFilterWithManager(
    filter: DepartmentFilter,
    manager?: EntityManager,
  ): Promise<Department[]> {
    const repository = this.transactionManager.getRepository(
      Department,
      this.repository,
      manager,
    );
    const queryBuilder = repository.createQueryBuilder('department');

    if (filter.name) {
      queryBuilder.andWhere('department.name LIKE :name', {
        name: `%${filter.name}%`,
      });
    }

    if (filter.code) {
      queryBuilder.andWhere('department.code = :code', { code: filter.code });
    }

    if (filter.managerId) {
      queryBuilder.andWhere('department.managerId = :managerId', {
        managerId: filter.managerId,
      });
    }

    if (filter.parentDepartmentId) {
      queryBuilder.andWhere(
        'department.parentDepartmentId = :parentDepartmentId',
        { parentDepartmentId: filter.parentDepartmentId },
      );
    }

    if (filter.externalId) {
      queryBuilder.andWhere('department.externalId = :externalId', {
        externalId: filter.externalId,
      });
    }

    return queryBuilder
      .orderBy('department.order', 'ASC')
      .addOrderBy('department.name', 'ASC')
      .getMany();
  }

  /**
   * 필터로 부서 조회 (기존 호환성)
   */
  async findByFilter(
    filter: DepartmentFilter,
    manager?: EntityManager,
  ): Promise<Department[]> {
    return this.findByFilterWithManager(filter, manager);
  }

  /**
   * 부서 저장
   */
  async saveWithManager(
    department: Department,
    manager?: EntityManager,
  ): Promise<Department> {
    const repository = this.transactionManager.getRepository(
      Department,
      this.repository,
      manager,
    );
    return repository.save(department);
  }

  /**
   * 부서 저장 (기존 호환성)
   */
  async save(
    department: Department,
    manager?: EntityManager,
  ): Promise<Department> {
    return this.saveWithManager(department, manager);
  }

  /**
   * 여러 부서 일괄 저장
   */
  async saveManyWithManager(
    departments: Department[],
    manager?: EntityManager,
  ): Promise<Department[]> {
    const repository = this.transactionManager.getRepository(
      Department,
      this.repository,
      manager,
    );
    return repository.save(departments);
  }

  /**
   * 여러 부서 일괄 저장 (기존 호환성)
   */
  async saveMany(
    departments: Department[],
    manager?: EntityManager,
  ): Promise<Department[]> {
    return this.saveManyWithManager(departments, manager);
  }

  /**
   * 부서 삭제
   */
  async deleteWithManager(id: string, manager?: EntityManager): Promise<void> {
    const repository = this.transactionManager.getRepository(
      Department,
      this.repository,
      manager,
    );
    await repository.delete(id);
  }

  /**
   * 부서 삭제 (기존 호환성)
   */
  async delete(id: string, manager?: EntityManager): Promise<void> {
    return this.deleteWithManager(id, manager);
  }

  /**
   * 부서명으로 부서 조회
   */
  async findByNameWithManager(
    name: string,
    manager?: EntityManager,
  ): Promise<Department | null> {
    const repository = this.transactionManager.getRepository(
      Department,
      this.repository,
      manager,
    );
    return repository.findOne({ where: { name } });
  }

  /**
   * 부서명으로 부서 조회 (기존 호환성)
   */
  async findByName(
    name: string,
    manager?: EntityManager,
  ): Promise<Department | null> {
    return this.findByNameWithManager(name, manager);
  }

  /**
   * 부서 코드로 부서 조회
   */
  async findByCodeWithManager(
    code: string,
    manager?: EntityManager,
  ): Promise<Department | null> {
    const repository = this.transactionManager.getRepository(
      Department,
      this.repository,
      manager,
    );
    return repository.findOne({ where: { code } });
  }

  /**
   * 부서 코드로 부서 조회 (기존 호환성)
   */
  async findByCode(
    code: string,
    manager?: EntityManager,
  ): Promise<Department | null> {
    return this.findByCodeWithManager(code, manager);
  }

  /**
   * 상위 부서별 하위 부서 조회
   */
  async findByParentDepartmentIdWithManager(
    parentDepartmentId: string,
    manager?: EntityManager,
  ): Promise<Department[]> {
    const repository = this.transactionManager.getRepository(
      Department,
      this.repository,
      manager,
    );
    return repository.find({
      where: { parentDepartmentId },
      order: { order: 'ASC', name: 'ASC' },
    });
  }

  /**
   * 상위 부서별 하위 부서 조회 (기존 호환성)
   */
  async findByParentDepartmentId(
    parentDepartmentId: string,
    manager?: EntityManager,
  ): Promise<Department[]> {
    return this.findByParentDepartmentIdWithManager(
      parentDepartmentId,
      manager,
    );
  }

  /**
   * 루트 부서 목록 조회 (상위 부서가 없는 부서)
   */
  async findRootDepartmentsWithManager(
    manager?: EntityManager,
  ): Promise<Department[]> {
    const repository = this.transactionManager.getRepository(
      Department,
      this.repository,
      manager,
    );
    // QueryBuilder를 사용하여 명시적으로 IS NULL 조건 사용
    return repository
      .createQueryBuilder('department')
      .where('department.parentDepartmentId IS NULL')
      .orderBy('department.order', 'ASC')
      .addOrderBy('department.name', 'ASC')
      .getMany();
  }

  /**
   * 루트 부서 목록 조회 (기존 호환성)
   */
  async findRootDepartments(manager?: EntityManager): Promise<Department[]> {
    return this.findRootDepartmentsWithManager(manager);
  }

  /**
   * 부서 통계 조회
   */
  async getDepartmentStatsWithManager(
    manager?: EntityManager,
  ): Promise<DepartmentStatistics> {
    const repository = this.transactionManager.getRepository(
      Department,
      this.repository,
      manager,
    );

    // 통계 정보 조회
    const totalDepartments = await repository.count();
    const rootDepartments = await repository
      .createQueryBuilder('department')
      .where('department.parentDepartmentId IS NULL')
      .getCount();

    // 마지막 동기화 시간 조회 - QueryBuilder 사용
    const lastSyncRecord = await repository
      .createQueryBuilder('department')
      .select('department.lastSyncAt')
      .where('department.lastSyncAt IS NOT NULL')
      .orderBy('department.lastSyncAt', 'DESC')
      .limit(1)
      .getOne();

    const subDepartments = totalDepartments - rootDepartments;

    return {
      totalDepartments,
      rootDepartments,
      subDepartments,
      employeesByDepartment: {}, // 복잡한 조인이 필요하므로 추후 구현
      averageEmployeesPerDepartment: 0, // 복잡한 조인이 필요하므로 추후 구현
      lastSyncAt: lastSyncRecord?.lastSyncAt,
    };
  }

  /**
   * 부서 통계 조회 (기존 호환성)
   */
  async getDepartmentStats(
    manager?: EntityManager,
  ): Promise<DepartmentStatistics> {
    return this.getDepartmentStatsWithManager(manager);
  }

  /**
   * 동기화가 필요한 부서 조회 (외부 수정일이 더 최신인 경우)
   */
  async findOutdatedDepartmentsWithManager(
    manager?: EntityManager,
  ): Promise<Department[]> {
    const repository = this.transactionManager.getRepository(
      Department,
      this.repository,
      manager,
    );
    return repository
      .createQueryBuilder('department')
      .where(
        'department.lastSyncAt IS NULL OR department.lastSyncAt < department.externalUpdatedAt',
      )
      .getMany();
  }

  /**
   * 동기화가 필요한 부서 조회 (기존 호환성)
   */
  async findOutdatedDepartments(
    manager?: EntityManager,
  ): Promise<Department[]> {
    return this.findOutdatedDepartmentsWithManager(manager);
  }

  /**
   * 마지막 동기화 시간 업데이트
   */
  async updateLastSyncAtWithManager(
    externalIds: string[],
    syncTime: Date,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.transactionManager.getRepository(
      Department,
      this.repository,
      manager,
    );
    await repository
      .createQueryBuilder()
      .update(Department)
      .set({ lastSyncAt: syncTime })
      .where('externalId IN (:...externalIds)', { externalIds })
      .execute();
  }

  /**
   * 마지막 동기화 시간 업데이트 (기존 호환성)
   */
  async updateLastSyncAt(
    externalIds: string[],
    syncTime: Date,
    manager?: EntityManager,
  ): Promise<void> {
    return this.updateLastSyncAtWithManager(externalIds, syncTime, manager);
  }
}
