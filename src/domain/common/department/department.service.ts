import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Department } from './department.entity';
import {
  DepartmentDto,
  DepartmentFilter,
  DepartmentListOptions,
} from './department.types';

/**
 * 부서 도메인 서비스
 *
 * 부서 엔티티의 비즈니스 로직을 담당하는 서비스입니다.
 * 외부 시스템에서 동기화되는 데이터이므로 Repository 패턴을 사용합니다.
 */
@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  /**
   * ID로 부서를 조회한다
   * @param id 부서 ID
   * @returns 부서 정보 (없으면 null)
   */
  async ID로_조회한다(id: string): Promise<DepartmentDto | null> {
    const department = await this.departmentRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    return department ? department.DTO로_변환한다() : null;
  }

  /**
   * 부서 코드로 부서를 조회한다
   * @param code 부서 코드
   * @returns 부서 정보 (없으면 null)
   */
  async 부서코드로_조회한다(code: string): Promise<DepartmentDto | null> {
    const department = await this.departmentRepository.findOne({
      where: { code, deletedAt: IsNull() },
    });

    return department ? department.DTO로_변환한다() : null;
  }

  /**
   * 외부 ID로 부서를 조회한다
   * @param externalId 외부 시스템 ID
   * @returns 부서 정보 (없으면 null)
   */
  async 외부ID로_조회한다(externalId: string): Promise<DepartmentDto | null> {
    const department = await this.departmentRepository.findOne({
      where: { externalId, deletedAt: IsNull() },
    });

    return department ? department.DTO로_변환한다() : null;
  }

  /**
   * 부서명으로 부서를 조회한다
   * @param name 부서명
   * @returns 부서 정보 (없으면 null)
   */
  async 부서명으로_조회한다(name: string): Promise<DepartmentDto | null> {
    const department = await this.departmentRepository.findOne({
      where: { name, deletedAt: IsNull() },
    });

    return department ? department.DTO로_변환한다() : null;
  }

  /**
   * 필터 조건으로 부서 목록을 조회한다
   * @param filter 필터 조건
   * @returns 부서 목록
   */
  async 필터_조회한다(filter: DepartmentFilter): Promise<DepartmentDto[]> {
    const queryBuilder =
      this.departmentRepository.createQueryBuilder('department');
    queryBuilder.where('department.deletedAt IS NULL');

    if (filter.name) {
      queryBuilder.andWhere('department.name LIKE :name', {
        name: `%${filter.name}%`,
      });
    }

    if (filter.code) {
      queryBuilder.andWhere('department.code = :code', {
        code: filter.code,
      });
    }

    if (filter.managerId) {
      queryBuilder.andWhere('department.managerId = :managerId', {
        managerId: filter.managerId,
      });
    }

    if (filter.parentDepartmentId) {
      queryBuilder.andWhere(
        'department.parentDepartmentId = :parentDepartmentId',
        {
          parentDepartmentId: filter.parentDepartmentId,
        },
      );
    }

    if (filter.externalId) {
      queryBuilder.andWhere('department.externalId = :externalId', {
        externalId: filter.externalId,
      });
    }

    const departments = await queryBuilder.getMany();
    return departments.map((department) => department.DTO로_변환한다());
  }

  /**
   * 옵션에 따라 부서 목록을 조회한다 (페이징, 정렬 포함)
   * @param options 조회 옵션
   * @returns 부서 목록과 총 개수
   */
  async 목록_조회한다(options: DepartmentListOptions = {}): Promise<{
    departments: DepartmentDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'order',
      sortOrder = 'ASC',
      filter = {},
    } = options;

    const queryBuilder =
      this.departmentRepository.createQueryBuilder('department');
    queryBuilder.where('department.deletedAt IS NULL');

    // 필터 적용
    if (filter.name) {
      queryBuilder.andWhere('department.name LIKE :name', {
        name: `%${filter.name}%`,
      });
    }

    if (filter.code) {
      queryBuilder.andWhere('department.code = :code', {
        code: filter.code,
      });
    }

    if (filter.managerId) {
      queryBuilder.andWhere('department.managerId = :managerId', {
        managerId: filter.managerId,
      });
    }

    if (filter.parentDepartmentId) {
      queryBuilder.andWhere(
        'department.parentDepartmentId = :parentDepartmentId',
        {
          parentDepartmentId: filter.parentDepartmentId,
        },
      );
    }

    if (filter.externalId) {
      queryBuilder.andWhere('department.externalId = :externalId', {
        externalId: filter.externalId,
      });
    }

    // 정렬
    queryBuilder.orderBy(`department.${sortBy}`, sortOrder);

    // 페이징
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [departments, total] = await queryBuilder.getManyAndCount();

    return {
      departments: departments.map((department) => department.DTO로_변환한다()),
      total,
      page,
      limit,
    };
  }

  /**
   * 전체 부서 목록을 조회한다
   * @returns 전체 부서 목록
   */
  async 전체_조회한다(): Promise<DepartmentDto[]> {
    const departments = await this.departmentRepository.find({
      where: { deletedAt: IsNull() },
      order: { order: 'ASC', name: 'ASC' },
    });

    return departments.map((department) => department.DTO로_변환한다());
  }

  /**
   * 최상위 부서 목록을 조회한다
   * @returns 최상위 부서 목록
   */
  async 최상위_부서_조회한다(): Promise<DepartmentDto[]> {
    const departments = await this.departmentRepository.find({
      where: { parentDepartmentId: IsNull(), deletedAt: IsNull() },
      order: { order: 'ASC', name: 'ASC' },
    });

    return departments.map((department) => department.DTO로_변환한다());
  }

  /**
   * 하위 부서 목록을 조회한다
   * @param parentDepartmentId 상위 부서 ID
   * @returns 하위 부서 목록
   */
  async 하위_부서_조회한다(
    parentDepartmentId: string,
  ): Promise<DepartmentDto[]> {
    const departments = await this.departmentRepository.find({
      where: { parentDepartmentId, deletedAt: IsNull() },
      order: { order: 'ASC', name: 'ASC' },
    });

    return departments.map((department) => department.DTO로_변환한다());
  }

  /**
   * 매니저별 부서 목록을 조회한다
   * @param managerId 매니저 ID
   * @returns 매니저 부서 목록
   */
  async 매니저별_조회한다(managerId: string): Promise<DepartmentDto[]> {
    const departments = await this.departmentRepository.find({
      where: { managerId, deletedAt: IsNull() },
      order: { order: 'ASC', name: 'ASC' },
    });

    return departments.map((department) => department.DTO로_변환한다());
  }

  /**
   * 부서가 존재하는지 확인한다
   * @param id 부서 ID
   * @returns 존재 여부
   */
  async 존재하는가(id: string): Promise<boolean> {
    const count = await this.departmentRepository.count({
      where: { id, deletedAt: IsNull() },
    });
    return count > 0;
  }

  /**
   * 부서 코드가 존재하는지 확인한다
   * @param code 부서 코드
   * @returns 존재 여부
   */
  async 부서코드가_존재하는가(code: string): Promise<boolean> {
    const count = await this.departmentRepository.count({
      where: { code, deletedAt: IsNull() },
    });
    return count > 0;
  }

  /**
   * 외부 ID가 존재하는지 확인한다
   * @param externalId 외부 시스템 ID
   * @returns 존재 여부
   */
  async 외부ID가_존재하는가(externalId: string): Promise<boolean> {
    const count = await this.departmentRepository.count({
      where: { externalId, deletedAt: IsNull() },
    });
    return count > 0;
  }
}
