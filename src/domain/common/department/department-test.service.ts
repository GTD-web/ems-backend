import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Department } from './department.entity';
import { DepartmentDto } from './department.types';

/**
 * 부서 테스트용 서비스
 *
 * 테스트 시 사용할 목데이터를 생성하고 관리하는 서비스입니다.
 * 실제 운영 환경에서는 사용하지 않습니다.
 */
@Injectable()
export class DepartmentTestService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  /**
   * 테스트용 부서 목데이터를 생성한다
   * @returns 생성된 부서 목록
   */
  async 테스트용_목데이터를_생성한다(): Promise<DepartmentDto[]> {
    // 기존 테스트 데이터 정리
    await this.테스트_데이터를_정리한다();

    const testDepartments = [
      // 최상위 부서들
      {
        name: '경영진',
        code: 'EXEC',
        externalId: 'exec-001',
        order: 1,
        managerId: 'manager-001',
        parentDepartmentId: null,
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      },
      {
        name: '기술개발본부',
        code: 'TECH',
        externalId: 'tech-001',
        order: 2,
        managerId: 'manager-002',
        parentDepartmentId: null,
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      },
      {
        name: '영업본부',
        code: 'SALES',
        externalId: 'sales-001',
        order: 3,
        managerId: 'manager-003',
        parentDepartmentId: null,
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      },
      {
        name: '인사관리부',
        code: 'HR',
        externalId: 'hr-001',
        order: 4,
        managerId: 'manager-004',
        parentDepartmentId: null,
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      },

      // 기술개발본부 하위 부서들
      {
        name: '백엔드개발팀',
        code: 'BACKEND',
        externalId: 'backend-001',
        order: 1,
        managerId: 'manager-005',
        parentDepartmentId: 'tech-001',
        externalCreatedAt: new Date('2024-01-02'),
        externalUpdatedAt: new Date('2024-01-02'),
      },
      {
        name: '프론트엔드개발팀',
        code: 'FRONTEND',
        externalId: 'frontend-001',
        order: 2,
        managerId: 'manager-006',
        parentDepartmentId: 'tech-001',
        externalCreatedAt: new Date('2024-01-02'),
        externalUpdatedAt: new Date('2024-01-02'),
      },
      {
        name: '데이터팀',
        code: 'DATA',
        externalId: 'data-001',
        order: 3,
        managerId: 'manager-007',
        parentDepartmentId: 'tech-001',
        externalCreatedAt: new Date('2024-01-02'),
        externalUpdatedAt: new Date('2024-01-02'),
      },
      {
        name: 'DevOps팀',
        code: 'DEVOPS',
        externalId: 'devops-001',
        order: 4,
        managerId: 'manager-008',
        parentDepartmentId: 'tech-001',
        externalCreatedAt: new Date('2024-01-02'),
        externalUpdatedAt: new Date('2024-01-02'),
      },

      // 영업본부 하위 부서들
      {
        name: '국내영업팀',
        code: 'DOMESTIC',
        externalId: 'domestic-001',
        order: 1,
        managerId: 'manager-009',
        parentDepartmentId: 'sales-001',
        externalCreatedAt: new Date('2024-01-03'),
        externalUpdatedAt: new Date('2024-01-03'),
      },
      {
        name: '해외영업팀',
        code: 'GLOBAL',
        externalId: 'global-001',
        order: 2,
        managerId: 'manager-010',
        parentDepartmentId: 'sales-001',
        externalCreatedAt: new Date('2024-01-03'),
        externalUpdatedAt: new Date('2024-01-03'),
      },
      {
        name: '마케팅팀',
        code: 'MARKETING',
        externalId: 'marketing-001',
        order: 3,
        managerId: 'manager-011',
        parentDepartmentId: 'sales-001',
        externalCreatedAt: new Date('2024-01-03'),
        externalUpdatedAt: new Date('2024-01-03'),
      },

      // 인사관리부 하위 부서들
      {
        name: '채용팀',
        code: 'RECRUIT',
        externalId: 'recruit-001',
        order: 1,
        managerId: 'manager-012',
        parentDepartmentId: 'hr-001',
        externalCreatedAt: new Date('2024-01-04'),
        externalUpdatedAt: new Date('2024-01-04'),
      },
      {
        name: '교육팀',
        code: 'TRAINING',
        externalId: 'training-001',
        order: 2,
        managerId: 'manager-013',
        parentDepartmentId: 'hr-001',
        externalCreatedAt: new Date('2024-01-04'),
        externalUpdatedAt: new Date('2024-01-04'),
      },
      {
        name: '급여팀',
        code: 'PAYROLL',
        externalId: 'payroll-001',
        order: 3,
        managerId: 'manager-014',
        parentDepartmentId: 'hr-001',
        externalCreatedAt: new Date('2024-01-04'),
        externalUpdatedAt: new Date('2024-01-04'),
      },

      // 3단계 하위 부서들 (백엔드개발팀 하위)
      {
        name: 'API개발팀',
        code: 'API',
        externalId: 'api-001',
        order: 1,
        managerId: 'manager-015',
        parentDepartmentId: 'backend-001',
        externalCreatedAt: new Date('2024-01-05'),
        externalUpdatedAt: new Date('2024-01-05'),
      },
      {
        name: '마이크로서비스팀',
        code: 'MICROSERVICE',
        externalId: 'microservice-001',
        order: 2,
        managerId: 'manager-016',
        parentDepartmentId: 'backend-001',
        externalCreatedAt: new Date('2024-01-05'),
        externalUpdatedAt: new Date('2024-01-05'),
      },

      // 프론트엔드개발팀 하위
      {
        name: '웹개발팀',
        code: 'WEB',
        externalId: 'web-001',
        order: 1,
        managerId: 'manager-017',
        parentDepartmentId: 'frontend-001',
        externalCreatedAt: new Date('2024-01-05'),
        externalUpdatedAt: new Date('2024-01-05'),
      },
      {
        name: '모바일개발팀',
        code: 'MOBILE',
        externalId: 'mobile-001',
        order: 2,
        managerId: 'manager-018',
        parentDepartmentId: 'frontend-001',
        externalCreatedAt: new Date('2024-01-05'),
        externalUpdatedAt: new Date('2024-01-05'),
      },
    ];

    // 부서 엔티티 생성 및 저장
    const departments = testDepartments.map((dept) => {
      const department = new Department(
        dept.name,
        dept.code,
        dept.externalId,
        dept.order,
        dept.managerId,
        dept.parentDepartmentId || undefined,
        dept.externalCreatedAt,
        dept.externalUpdatedAt,
      );
      return department;
    });

    const savedDepartments = await this.departmentRepository.save(departments);

    return savedDepartments.map((department) => department.DTO로_변환한다());
  }

  /**
   * 특정 부서의 테스트 데이터를 생성한다
   * @param departmentData 부서 데이터
   * @returns 생성된 부서 정보
   */
  async 특정_부서_테스트데이터를_생성한다(departmentData: {
    name: string;
    code: string;
    externalId: string;
    order?: number;
    managerId?: string;
    parentDepartmentId?: string;
    externalCreatedAt?: Date;
    externalUpdatedAt?: Date;
  }): Promise<DepartmentDto> {
    const department = new Department(
      departmentData.name,
      departmentData.code,
      departmentData.externalId,
      departmentData.order || 0,
      departmentData.managerId,
      departmentData.parentDepartmentId,
      departmentData.externalCreatedAt || new Date(),
      departmentData.externalUpdatedAt || new Date(),
    );

    const savedDepartment = await this.departmentRepository.save(department);
    return savedDepartment.DTO로_변환한다();
  }

  /**
   * 테스트용 랜덤 부서 데이터를 생성한다
   * @param count 생성할 부서 수
   * @returns 생성된 부서 목록
   */
  async 랜덤_테스트데이터를_생성한다(
    count: number = 10,
  ): Promise<DepartmentDto[]> {
    const departments: Department[] = [];

    for (let i = 0; i < count; i++) {
      const department = new Department(
        `테스트부서${i + 1}`,
        `TEST${String(i + 1).padStart(3, '0')}`,
        `test-${i + 1}`,
        i + 1,
        `manager-${i + 1}`,
        undefined, // 최상위 부서로 생성
        new Date(),
        new Date(),
      );
      departments.push(department);
    }

    const savedDepartments = await this.departmentRepository.save(departments);
    return savedDepartments.map((department) => department.DTO로_변환한다());
  }

  /**
   * 테스트 데이터를 정리한다
   * @returns 삭제된 부서 수
   */
  async 테스트_데이터를_정리한다(): Promise<number> {
    // 테스트용 부서들을 삭제 (externalId가 test-로 시작하거나 특정 패턴을 가진 것들)
    const result = await this.departmentRepository
      .createQueryBuilder()
      .delete()
      .where(
        'externalId LIKE :pattern1 OR externalId LIKE :pattern2 OR externalId LIKE :pattern3',
        {
          pattern1: 'test-%',
          pattern2: 'exec-%',
          pattern3: 'tech-%',
        },
      )
      .execute();

    return result.affected || 0;
  }

  /**
   * 모든 테스트 데이터를 삭제한다
   * @returns 삭제된 부서 수
   */
  async 모든_테스트데이터를_삭제한다(): Promise<number> {
    const result = await this.departmentRepository
      .createQueryBuilder()
      .delete()
      .execute();

    return result.affected || 0;
  }

  /**
   * 테스트용 부서 계층 구조를 생성한다
   * @param depth 최대 깊이
   * @param maxChildrenPerLevel 각 레벨당 최대 자식 수
   * @returns 생성된 부서 목록
   */
  async 계층구조_테스트데이터를_생성한다(
    depth: number = 3,
    maxChildrenPerLevel: number = 3,
  ): Promise<DepartmentDto[]> {
    await this.테스트_데이터를_정리한다();

    const departments: Department[] = [];
    let currentLevel = 0;
    let parentIds: string[] = [];
    let orderCounter = 1;

    // 루트 부서 생성
    const rootDepartment = new Department(
      '테스트루트부서',
      'ROOT',
      'test-root',
      orderCounter++,
      'root-manager',
      undefined,
      new Date(),
      new Date(),
    );
    const savedRoot = await this.departmentRepository.save(rootDepartment);
    departments.push(savedRoot);
    parentIds = [savedRoot.externalId];

    // 각 레벨별로 부서 생성
    for (let level = 1; level <= depth; level++) {
      const newParentIds: string[] = [];

      for (const parentId of parentIds) {
        const childrenCount =
          Math.floor(Math.random() * maxChildrenPerLevel) + 1;

        for (let i = 0; i < childrenCount; i++) {
          const department = new Department(
            `레벨${level}부서${i + 1}`,
            `L${level}D${i + 1}`,
            `test-l${level}-d${i + 1}`,
            orderCounter++,
            `manager-l${level}-d${i + 1}`,
            parentId,
            new Date(),
            new Date(),
          );

          const savedDepartment =
            await this.departmentRepository.save(department);
          departments.push(savedDepartment);
          newParentIds.push(savedDepartment.externalId);
        }
      }

      parentIds = newParentIds;
    }

    return departments.map((department) => department.DTO로_변환한다());
  }
}
