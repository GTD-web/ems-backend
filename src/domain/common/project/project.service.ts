import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { Project } from './project.entity';
import { ProjectSecondaryEvaluator } from './project-secondary-evaluator.entity';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectDto,
  ProjectFilter,
  ProjectListOptions,
  ProjectStatus,
  SelectableSecondaryEvaluatorInfo,
} from './project.types';

/**
 * 프로젝트 도메인 서비스
 *
 * 프로젝트 엔티티의 비즈니스 로직을 담당하는 서비스입니다.
 */
@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectSecondaryEvaluator)
    private readonly secondaryEvaluatorRepository: Repository<ProjectSecondaryEvaluator>,
  ) {}

  /**
   * 새로운 프로젝트를 생성한다
   * @param data 프로젝트 생성 데이터
   * @param createdBy 생성자 ID
   * @returns 생성된 프로젝트 정보
   */
  async 생성한다(
    data: CreateProjectDto,
    createdBy: string,
  ): Promise<ProjectDto> {
    // 프로젝트 코드 중복 검사 (코드가 있는 경우)
    if (data.projectCode) {
      const existingProject = await this.projectRepository.findOne({
        where: { projectCode: data.projectCode, deletedAt: IsNull() },
      });

      if (existingProject) {
        throw new BadRequestException(
          `프로젝트 코드 ${data.projectCode}는 이미 사용 중입니다.`,
        );
      }
    }

    const project = Project.생성한다(data, createdBy);
    const savedProject = await this.projectRepository.save(project);

    // 생성 후 manager 정보를 포함하여 다시 조회
    const result = await this.ID로_조회한다(savedProject.id);
    if (!result) {
      throw new NotFoundException(`생성된 프로젝트를 찾을 수 없습니다.`);
    }
    return result;
  }

  /**
   * 프로젝트 정보를 수정한다
   * @param id 프로젝트 ID
   * @param data 수정할 데이터
   * @param updatedBy 수정자 ID
   * @returns 수정된 프로젝트 정보
   */
  async 수정한다(
    id: string,
    data: UpdateProjectDto,
    updatedBy: string,
  ): Promise<ProjectDto> {
    const project = await this.projectRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!project) {
      throw new NotFoundException(
        `ID ${id}에 해당하는 프로젝트를 찾을 수 없습니다.`,
      );
    }

    // 프로젝트 코드 중복 검사 (코드가 변경되는 경우)
    if (data.projectCode && data.projectCode !== project.projectCode) {
      const existingProject = await this.projectRepository.findOne({
        where: { projectCode: data.projectCode, deletedAt: IsNull() },
      });

      if (existingProject && existingProject.id !== id) {
        throw new BadRequestException(
          `프로젝트 코드 ${data.projectCode}는 이미 사용 중입니다.`,
        );
      }
    }

    project.업데이트한다(data, updatedBy);
    await this.projectRepository.save(project);

    // 수정 후 manager 정보를 포함하여 다시 조회
    const result = await this.ID로_조회한다(id);
    if (!result) {
      throw new NotFoundException(`수정된 프로젝트를 찾을 수 없습니다.`);
    }
    return result;
  }

  /**
   * 프로젝트를 삭제한다 (소프트 삭제)
   * @param id 프로젝트 ID
   * @param deletedBy 삭제자 ID
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!project) {
      throw new NotFoundException(
        `ID ${id}에 해당하는 프로젝트를 찾을 수 없습니다.`,
      );
    }

    project.삭제한다(deletedBy);
    await this.projectRepository.save(project);
  }

  /**
   * ID로 프로젝트를 조회한다
   * @param id 프로젝트 ID
   * @returns 프로젝트 정보 (없으면 null)
   */
  async ID로_조회한다(id: string): Promise<ProjectDto | null> {
    const result = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin(
        'employee',
        'manager',
        'manager.externalId = project.managerId AND manager.deletedAt IS NULL',
      )
      .select([
        'project.id AS id',
        'project.name AS name',
        'project.projectCode AS "projectCode"',
        'project.status AS status',
        'project.startDate AS "startDate"',
        'project.endDate AS "endDate"',
        'project.createdAt AS "createdAt"',
        'project.updatedAt AS "updatedAt"',
        'project.deletedAt AS "deletedAt"',
        'project.managerId AS "managerId"',
        'manager.externalId AS manager_id',
        'manager.name AS manager_name',
        'manager.email AS manager_email',
        'manager.phoneNumber AS manager_phone_number',
        'manager.departmentName AS manager_department_name',
        'manager.rankName AS manager_rank_name',
      ])
      .where('project.id = :id', { id })
      .andWhere('project.deletedAt IS NULL')
      .getRawOne();

    if (!result) {
      return null;
    }

    // 선택 가능한 2차 평가자 목록 조회
    const selectableSecondaryEvaluators =
      await this.이차평가자_목록_조회한다(id);

    return {
      id: result.id,
      name: result.name,
      projectCode: result.projectCode,
      status: result.status,
      startDate: result.startDate,
      endDate: result.endDate,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      deletedAt: result.deletedAt,
      managerId: result.managerId,
      manager: result.manager_id
        ? {
            id: result.manager_id,
            name: result.manager_name,
            email: result.manager_email,
            phoneNumber: result.manager_phone_number,
            departmentName: result.manager_department_name,
            rankName: result.manager_rank_name,
          }
        : undefined,
      selectableSecondaryEvaluators,
      get isDeleted() {
        return result.deletedAt !== null && result.deletedAt !== undefined;
      },
      get isActive() {
        return result.status === 'ACTIVE';
      },
      get isCompleted() {
        return result.status === 'COMPLETED';
      },
      get isCancelled() {
        return result.status === 'CANCELLED';
      },
    };
  }

  /**
   * 프로젝트 코드로 프로젝트를 조회한다
   * @param projectCode 프로젝트 코드
   * @returns 프로젝트 정보 (없으면 null)
   */
  async 프로젝트코드로_조회한다(
    projectCode: string,
  ): Promise<ProjectDto | null> {
    const result = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin(
        'employee',
        'manager',
        'manager.externalId = project.managerId AND manager.deletedAt IS NULL',
      )
      .select([
        'project.id AS id',
        'project.name AS name',
        'project.projectCode AS "projectCode"',
        'project.status AS status',
        'project.startDate AS "startDate"',
        'project.endDate AS "endDate"',
        'project.createdAt AS "createdAt"',
        'project.updatedAt AS "updatedAt"',
        'project.deletedAt AS "deletedAt"',
        'manager.externalId AS manager_id',
        'manager.name AS manager_name',
        'manager.email AS manager_email',
        'manager.phoneNumber AS manager_phone_number',
        'manager.departmentName AS manager_department_name',
        'manager.rankName AS manager_rank_name',
      ])
      .where('project.projectCode = :projectCode', { projectCode })
      .andWhere('project.deletedAt IS NULL')
      .getRawOne();

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      name: result.name,
      projectCode: result.projectCode,
      status: result.status,
      startDate: result.startDate,
      endDate: result.endDate,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      deletedAt: result.deletedAt,
      manager: result.manager_id
        ? {
            id: result.manager_id,
            name: result.manager_name,
            email: result.manager_email,
            phoneNumber: result.manager_phone_number,
            departmentName: result.manager_department_name,
            rankName: result.manager_rank_name,
          }
        : undefined,
      get isDeleted() {
        return result.deletedAt !== null && result.deletedAt !== undefined;
      },
      get isActive() {
        return result.status === 'ACTIVE';
      },
      get isCompleted() {
        return result.status === 'COMPLETED';
      },
      get isCancelled() {
        return result.status === 'CANCELLED';
      },
    };
  }

  /**
   * 프로젝트명으로 프로젝트를 조회한다
   * @param name 프로젝트명
   * @returns 프로젝트 정보 (없으면 null)
   */
  async 프로젝트명으로_조회한다(name: string): Promise<ProjectDto | null> {
    const result = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin(
        'employee',
        'manager',
        'manager.externalId = project.managerId AND manager.deletedAt IS NULL',
      )
      .select([
        'project.id AS id',
        'project.name AS name',
        'project.projectCode AS "projectCode"',
        'project.status AS status',
        'project.startDate AS "startDate"',
        'project.endDate AS "endDate"',
        'project.createdAt AS "createdAt"',
        'project.updatedAt AS "updatedAt"',
        'project.deletedAt AS "deletedAt"',
        'manager.externalId AS manager_id',
        'manager.name AS manager_name',
        'manager.email AS manager_email',
        'manager.phoneNumber AS manager_phone_number',
        'manager.departmentName AS manager_department_name',
        'manager.rankName AS manager_rank_name',
      ])
      .where('project.name = :name', { name })
      .andWhere('project.deletedAt IS NULL')
      .getRawOne();

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      name: result.name,
      projectCode: result.projectCode,
      status: result.status,
      startDate: result.startDate,
      endDate: result.endDate,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      deletedAt: result.deletedAt,
      manager: result.manager_id
        ? {
            id: result.manager_id,
            name: result.manager_name,
            email: result.manager_email,
            phoneNumber: result.manager_phone_number,
            departmentName: result.manager_department_name,
            rankName: result.manager_rank_name,
          }
        : undefined,
      get isDeleted() {
        return result.deletedAt !== null && result.deletedAt !== undefined;
      },
      get isActive() {
        return result.status === 'ACTIVE';
      },
      get isCompleted() {
        return result.status === 'COMPLETED';
      },
      get isCancelled() {
        return result.status === 'CANCELLED';
      },
    };
  }

  /**
   * 필터 조건으로 프로젝트 목록을 조회한다
   * @param filter 필터 조건
   * @returns 프로젝트 목록
   */
  async 필터_조회한다(filter: ProjectFilter): Promise<ProjectDto[]> {
    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoin(
        'employee',
        'manager',
        'manager.externalId = project.managerId AND manager.deletedAt IS NULL',
      )
      .select([
        'project.id AS id',
        'project.name AS name',
        'project.projectCode AS "projectCode"',
        'project.status AS status',
        'project.startDate AS "startDate"',
        'project.endDate AS "endDate"',
        'project.createdAt AS "createdAt"',
        'project.updatedAt AS "updatedAt"',
        'project.deletedAt AS "deletedAt"',
        'manager.externalId AS manager_id',
        'manager.name AS manager_name',
        'manager.email AS manager_email',
        'manager.phoneNumber AS manager_phone_number',
        'manager.departmentName AS manager_department_name',
        'manager.rankName AS manager_rank_name',
      ])
      .where('project.deletedAt IS NULL');

    if (filter.status) {
      queryBuilder.andWhere('project.status = :status', {
        status: filter.status,
      });
    }

    if (filter.managerId) {
      queryBuilder.andWhere('project.managerId = :managerId', {
        managerId: filter.managerId,
      });
    }

    if (filter.startDateFrom) {
      queryBuilder.andWhere('project.startDate >= :startDateFrom', {
        startDateFrom: filter.startDateFrom,
      });
    }

    if (filter.startDateTo) {
      queryBuilder.andWhere('project.startDate <= :startDateTo', {
        startDateTo: filter.startDateTo,
      });
    }

    if (filter.endDateFrom) {
      queryBuilder.andWhere('project.endDate >= :endDateFrom', {
        endDateFrom: filter.endDateFrom,
      });
    }

    if (filter.endDateTo) {
      queryBuilder.andWhere('project.endDate <= :endDateTo', {
        endDateTo: filter.endDateTo,
      });
    }

    const results = await queryBuilder.getRawMany();

    return results.map((result) => ({
      id: result.id,
      name: result.name,
      projectCode: result.projectCode,
      status: result.status,
      startDate: result.startDate,
      endDate: result.endDate,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      deletedAt: result.deletedAt,
      manager: result.manager_id
        ? {
            id: result.manager_id,
            name: result.manager_name,
            email: result.manager_email,
            phoneNumber: result.manager_phone_number,
            departmentName: result.manager_department_name,
            rankName: result.manager_rank_name,
          }
        : undefined,
      get isDeleted() {
        return result.deletedAt !== null && result.deletedAt !== undefined;
      },
      get isActive() {
        return result.status === 'ACTIVE';
      },
      get isCompleted() {
        return result.status === 'COMPLETED';
      },
      get isCancelled() {
        return result.status === 'CANCELLED';
      },
    }));
  }

  /**
   * 옵션에 따라 프로젝트 목록을 조회한다 (페이징, 정렬 포함)
   * @param options 조회 옵션
   * @returns 프로젝트 목록과 총 개수
   */
  async 목록_조회한다(options: ProjectListOptions = {}): Promise<{
    projects: ProjectDto[];
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

    // 총 개수를 위한 쿼리
    const countQueryBuilder =
      this.projectRepository.createQueryBuilder('project');
    countQueryBuilder.where('project.deletedAt IS NULL');

    // 필터 적용 (총 개수용)
    if (filter.status) {
      countQueryBuilder.andWhere('project.status = :status', {
        status: filter.status,
      });
    }

    if (filter.managerId) {
      countQueryBuilder.andWhere('project.managerId = :managerId', {
        managerId: filter.managerId,
      });
    }

    if (filter.startDateFrom) {
      countQueryBuilder.andWhere('project.startDate >= :startDateFrom', {
        startDateFrom: filter.startDateFrom,
      });
    }

    if (filter.startDateTo) {
      countQueryBuilder.andWhere('project.startDate <= :startDateTo', {
        startDateTo: filter.startDateTo,
      });
    }

    if (filter.endDateFrom) {
      countQueryBuilder.andWhere('project.endDate >= :endDateFrom', {
        endDateFrom: filter.endDateFrom,
      });
    }

    if (filter.endDateTo) {
      countQueryBuilder.andWhere('project.endDate <= :endDateTo', {
        endDateTo: filter.endDateTo,
      });
    }

    const total = await countQueryBuilder.getCount();

    // 데이터 조회를 위한 쿼리 (manager join 포함)
    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoin(
        'employee',
        'manager',
        'manager.externalId = project.managerId AND manager.deletedAt IS NULL',
      )
      .select([
        'project.id AS id',
        'project.name AS name',
        'project.projectCode AS "projectCode"',
        'project.status AS status',
        'project.startDate AS "startDate"',
        'project.endDate AS "endDate"',
        'project.createdAt AS "createdAt"',
        'project.updatedAt AS "updatedAt"',
        'project.deletedAt AS "deletedAt"',
        'manager.externalId AS manager_id',
        'manager.name AS manager_name',
        'manager.email AS manager_email',
        'manager.phoneNumber AS manager_phone_number',
        'manager.departmentName AS manager_department_name',
        'manager.rankName AS manager_rank_name',
      ])
      .where('project.deletedAt IS NULL');

    // 필터 적용
    if (filter.status) {
      queryBuilder.andWhere('project.status = :status', {
        status: filter.status,
      });
    }

    if (filter.managerId) {
      queryBuilder.andWhere('project.managerId = :managerId', {
        managerId: filter.managerId,
      });
    }

    if (filter.startDateFrom) {
      queryBuilder.andWhere('project.startDate >= :startDateFrom', {
        startDateFrom: filter.startDateFrom,
      });
    }

    if (filter.startDateTo) {
      queryBuilder.andWhere('project.startDate <= :startDateTo', {
        startDateTo: filter.startDateTo,
      });
    }

    if (filter.endDateFrom) {
      queryBuilder.andWhere('project.endDate >= :endDateFrom', {
        endDateFrom: filter.endDateFrom,
      });
    }

    if (filter.endDateTo) {
      queryBuilder.andWhere('project.endDate <= :endDateTo', {
        endDateTo: filter.endDateTo,
      });
    }

    // 정렬
    queryBuilder.orderBy(`project.${sortBy}`, sortOrder);

    // 페이징
    const offset = (page - 1) * limit;
    queryBuilder.offset(offset).limit(limit);

    const results = await queryBuilder.getRawMany();

    // 각 프로젝트의 2차 평가자 목록을 조회
    const projectIds = results.map((result) => result.id);
    const secondaryEvaluatorsMap = new Map<
      string,
      SelectableSecondaryEvaluatorInfo[]
    >();

    if (projectIds.length > 0) {
      const allEvaluators = await this.secondaryEvaluatorRepository
        .createQueryBuilder('pse')
        .leftJoin(
          'employee',
          'evaluator',
          'evaluator.id = pse.evaluatorId AND evaluator.deletedAt IS NULL',
        )
        .select([
          'pse.projectId AS project_id',
          'evaluator.id AS id',
          'evaluator.name AS name',
          'evaluator.email AS email',
          'evaluator.phoneNumber AS phone_number',
          'evaluator.departmentName AS department_name',
          'evaluator.rankName AS rank_name',
        ])
        .where('pse.projectId IN (:...projectIds)', { projectIds })
        .andWhere('pse.deletedAt IS NULL')
        .orderBy('evaluator.name', 'ASC')
        .getRawMany();

      // 프로젝트별로 그룹화
      for (const evaluator of allEvaluators) {
        if (!secondaryEvaluatorsMap.has(evaluator.project_id)) {
          secondaryEvaluatorsMap.set(evaluator.project_id, []);
        }
        secondaryEvaluatorsMap.get(evaluator.project_id)!.push({
          id: evaluator.id,
          name: evaluator.name,
          email: evaluator.email,
          phoneNumber: evaluator.phone_number,
          departmentName: evaluator.department_name,
          rankName: evaluator.rank_name,
        });
      }
    }

    const projects: ProjectDto[] = results.map((result) => ({
      id: result.id,
      name: result.name,
      projectCode: result.projectCode,
      status: result.status,
      startDate: result.startDate,
      endDate: result.endDate,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      deletedAt: result.deletedAt,
      manager: result.manager_id
        ? {
            id: result.manager_id,
            name: result.manager_name,
            email: result.manager_email,
            phoneNumber: result.manager_phone_number,
            departmentName: result.manager_department_name,
            rankName: result.manager_rank_name,
          }
        : undefined,
      selectableSecondaryEvaluators:
        secondaryEvaluatorsMap.get(result.id) || [],
      get isDeleted() {
        return result.deletedAt !== null && result.deletedAt !== undefined;
      },
      get isActive() {
        return result.status === 'ACTIVE';
      },
      get isCompleted() {
        return result.status === 'COMPLETED';
      },
      get isCancelled() {
        return result.status === 'CANCELLED';
      },
    }));

    return {
      projects,
      total,
      page,
      limit,
    };
  }

  /**
   * 전체 프로젝트 목록을 조회한다
   * @returns 전체 프로젝트 목록
   */
  async 전체_조회한다(): Promise<ProjectDto[]> {
    const results = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin(
        'employee',
        'manager',
        'manager.externalId = project.managerId AND manager.deletedAt IS NULL',
      )
      .select([
        'project.id AS id',
        'project.name AS name',
        'project.projectCode AS "projectCode"',
        'project.status AS status',
        'project.startDate AS "startDate"',
        'project.endDate AS "endDate"',
        'project.createdAt AS "createdAt"',
        'project.updatedAt AS "updatedAt"',
        'project.deletedAt AS "deletedAt"',
        'manager.externalId AS manager_id',
        'manager.name AS manager_name',
        'manager.email AS manager_email',
        'manager.phoneNumber AS manager_phone_number',
        'manager.departmentName AS manager_department_name',
        'manager.rankName AS manager_rank_name',
      ])
      .where('project.deletedAt IS NULL')
      .orderBy('project.name', 'ASC')
      .getRawMany();

    return results.map((result) => ({
      id: result.id,
      name: result.name,
      projectCode: result.projectCode,
      status: result.status,
      startDate: result.startDate,
      endDate: result.endDate,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      deletedAt: result.deletedAt,
      manager: result.manager_id
        ? {
            id: result.manager_id,
            name: result.manager_name,
            email: result.manager_email,
            phoneNumber: result.manager_phone_number,
            departmentName: result.manager_department_name,
            rankName: result.manager_rank_name,
          }
        : undefined,
      get isDeleted() {
        return result.deletedAt !== null && result.deletedAt !== undefined;
      },
      get isActive() {
        return result.status === 'ACTIVE';
      },
      get isCompleted() {
        return result.status === 'COMPLETED';
      },
      get isCancelled() {
        return result.status === 'CANCELLED';
      },
    }));
  }

  /**
   * 활성 프로젝트 목록을 조회한다
   * @returns 활성 프로젝트 목록
   */
  async 활성_조회한다(): Promise<ProjectDto[]> {
    const results = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin(
        'employee',
        'manager',
        'manager.externalId = project.managerId AND manager.deletedAt IS NULL',
      )
      .select([
        'project.id AS id',
        'project.name AS name',
        'project.projectCode AS "projectCode"',
        'project.status AS status',
        'project.startDate AS "startDate"',
        'project.endDate AS "endDate"',
        'project.createdAt AS "createdAt"',
        'project.updatedAt AS "updatedAt"',
        'project.deletedAt AS "deletedAt"',
        'manager.externalId AS manager_id',
        'manager.name AS manager_name',
        'manager.email AS manager_email',
        'manager.phoneNumber AS manager_phone_number',
        'manager.departmentName AS manager_department_name',
        'manager.rankName AS manager_rank_name',
      ])
      .where('project.deletedAt IS NULL')
      .andWhere('project.status = :status', { status: ProjectStatus.ACTIVE })
      .orderBy('project.name', 'ASC')
      .getRawMany();

    return results.map((result) => ({
      id: result.id,
      name: result.name,
      projectCode: result.projectCode,
      status: result.status,
      startDate: result.startDate,
      endDate: result.endDate,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      deletedAt: result.deletedAt,
      manager: result.manager_id
        ? {
            id: result.manager_id,
            name: result.manager_name,
            email: result.manager_email,
            phoneNumber: result.manager_phone_number,
            departmentName: result.manager_department_name,
            rankName: result.manager_rank_name,
          }
        : undefined,
      get isDeleted() {
        return result.deletedAt !== null && result.deletedAt !== undefined;
      },
      get isActive() {
        return result.status === 'ACTIVE';
      },
      get isCompleted() {
        return result.status === 'COMPLETED';
      },
      get isCancelled() {
        return result.status === 'CANCELLED';
      },
    }));
  }

  /**
   * 매니저별 프로젝트 목록을 조회한다
   * @param managerId 매니저 ID
   * @returns 매니저 프로젝트 목록
   */
  async 매니저별_조회한다(managerId: string): Promise<ProjectDto[]> {
    const results = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin(
        'employee',
        'manager',
        'manager.externalId = project.managerId AND manager.deletedAt IS NULL',
      )
      .select([
        'project.id AS id',
        'project.name AS name',
        'project.projectCode AS "projectCode"',
        'project.status AS status',
        'project.startDate AS "startDate"',
        'project.endDate AS "endDate"',
        'project.createdAt AS "createdAt"',
        'project.updatedAt AS "updatedAt"',
        'project.deletedAt AS "deletedAt"',
        'manager.externalId AS manager_id',
        'manager.name AS manager_name',
        'manager.email AS manager_email',
        'manager.phoneNumber AS manager_phone_number',
        'manager.departmentName AS manager_department_name',
        'manager.rankName AS manager_rank_name',
      ])
      .where('project.deletedAt IS NULL')
      .andWhere('project.managerId = :managerId', { managerId })
      .orderBy('project.name', 'ASC')
      .getRawMany();

    return results.map((result) => ({
      id: result.id,
      name: result.name,
      projectCode: result.projectCode,
      status: result.status,
      startDate: result.startDate,
      endDate: result.endDate,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      deletedAt: result.deletedAt,
      manager: result.manager_id
        ? {
            id: result.manager_id,
            name: result.manager_name,
            email: result.manager_email,
            phoneNumber: result.manager_phone_number,
            departmentName: result.manager_department_name,
            rankName: result.manager_rank_name,
          }
        : undefined,
      get isDeleted() {
        return result.deletedAt !== null && result.deletedAt !== undefined;
      },
      get isActive() {
        return result.status === 'ACTIVE';
      },
      get isCompleted() {
        return result.status === 'COMPLETED';
      },
      get isCancelled() {
        return result.status === 'CANCELLED';
      },
    }));
  }

  /**
   * 프로젝트가 존재하는지 확인한다
   * @param id 프로젝트 ID
   * @returns 존재 여부
   */
  async 존재하는가(id: string): Promise<boolean> {
    const count = await this.projectRepository.count({
      where: { id, deletedAt: IsNull() },
    });
    return count > 0;
  }

  /**
   * 프로젝트 코드가 존재하는지 확인한다
   * @param projectCode 프로젝트 코드
   * @param excludeId 제외할 프로젝트 ID (수정 시 자신 제외용)
   * @returns 존재 여부
   */
  async 프로젝트코드가_존재하는가(
    projectCode: string,
    excludeId?: string,
  ): Promise<boolean> {
    const queryBuilder = this.projectRepository.createQueryBuilder('project');
    queryBuilder.where('project.projectCode = :projectCode', { projectCode });
    queryBuilder.andWhere('project.deletedAt IS NULL');

    if (excludeId) {
      queryBuilder.andWhere('project.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  /**
   * 프로젝트 상태를 변경한다
   * @param id 프로젝트 ID
   * @param status 새로운 상태
   * @param updatedBy 수정자 ID
   * @returns 수정된 프로젝트 정보
   */
  async 상태_변경한다(
    id: string,
    status: ProjectStatus,
    updatedBy: string,
  ): Promise<ProjectDto> {
    const project = await this.projectRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!project) {
      throw new NotFoundException(
        `ID ${id}에 해당하는 프로젝트를 찾을 수 없습니다.`,
      );
    }

    project.status = status;
    project.수정자를_설정한다(updatedBy);

    const savedProject = await this.projectRepository.save(project);
    return savedProject.DTO로_변환한다();
  }

  /**
   * 프로젝트를 완료 처리한다
   * @param id 프로젝트 ID
   * @param updatedBy 수정자 ID
   * @returns 수정된 프로젝트 정보
   */
  async 완료_처리한다(id: string, updatedBy: string): Promise<ProjectDto> {
    return this.상태_변경한다(id, ProjectStatus.COMPLETED, updatedBy);
  }

  /**
   * 프로젝트를 취소 처리한다
   * @param id 프로젝트 ID
   * @param updatedBy 수정자 ID
   * @returns 수정된 프로젝트 정보
   */
  async 취소_처리한다(id: string, updatedBy: string): Promise<ProjectDto> {
    return this.상태_변경한다(id, ProjectStatus.CANCELLED, updatedBy);
  }

  /**
   * 프로젝트의 2차 평가자를 설정한다 (기존 목록을 대체)
   * @param projectId 프로젝트 ID
   * @param evaluatorIds 2차 평가자 ID 목록
   * @param updatedBy 설정자 ID
   */
  async 이차평가자_설정한다(
    projectId: string,
    evaluatorIds: string[],
    updatedBy: string,
  ): Promise<void> {
    // 프로젝트 존재 확인
    const exists = await this.존재하는가(projectId);
    if (!exists) {
      throw new NotFoundException(
        `ID ${projectId}에 해당하는 프로젝트를 찾을 수 없습니다.`,
      );
    }

    // 기존 2차 평가자 전체 삭제 (소프트 삭제)
    await this.secondaryEvaluatorRepository
      .createQueryBuilder()
      .softDelete()
      .where('projectId = :projectId', { projectId })
      .andWhere('deletedAt IS NULL')
      .execute();

    // 새로운 2차 평가자 추가
    if (evaluatorIds.length > 0) {
      const newEvaluators = evaluatorIds.map((evaluatorId) =>
        ProjectSecondaryEvaluator.생성한다(projectId, evaluatorId, updatedBy),
      );
      await this.secondaryEvaluatorRepository.save(newEvaluators);
    }
  }

  /**
   * 프로젝트의 선택 가능한 2차 평가자 목록을 조회한다
   * @param projectId 프로젝트 ID
   * @returns 선택 가능한 2차 평가자 정보 목록
   */
  async 이차평가자_목록_조회한다(
    projectId: string,
  ): Promise<SelectableSecondaryEvaluatorInfo[]> {
    const results = await this.secondaryEvaluatorRepository
      .createQueryBuilder('pse')
      .leftJoin(
        'employee',
        'evaluator',
        'evaluator.id = pse.evaluatorId AND evaluator.deletedAt IS NULL',
      )
      .select([
        'evaluator.id AS id',
        'evaluator.name AS name',
        'evaluator.email AS email',
        'evaluator.phoneNumber AS phone_number',
        'evaluator.departmentName AS department_name',
        'evaluator.rankName AS rank_name',
      ])
      .where('pse.projectId = :projectId', { projectId })
      .andWhere('pse.deletedAt IS NULL')
      .orderBy('evaluator.name', 'ASC')
      .getRawMany();

    return results.map((result) => ({
      id: result.id,
      name: result.name,
      email: result.email,
      phoneNumber: result.phone_number,
      departmentName: result.department_name,
      rankName: result.rank_name,
    }));
  }
}
