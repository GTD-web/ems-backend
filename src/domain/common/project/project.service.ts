import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Project } from './project.entity';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectDto,
  ProjectFilter,
  ProjectListOptions,
  ProjectStatus,
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
        throw new Error(
          `프로젝트 코드 ${data.projectCode}는 이미 사용 중입니다.`,
        );
      }
    }

    const project = Project.생성한다(data, createdBy);
    const savedProject = await this.projectRepository.save(project);
    return savedProject.DTO로_변환한다();
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
      throw new Error(`ID ${id}에 해당하는 프로젝트를 찾을 수 없습니다.`);
    }

    // 프로젝트 코드 중복 검사 (코드가 변경되는 경우)
    if (data.projectCode && data.projectCode !== project.projectCode) {
      const existingProject = await this.projectRepository.findOne({
        where: { projectCode: data.projectCode, deletedAt: IsNull() },
      });

      if (existingProject && existingProject.id !== id) {
        throw new Error(
          `프로젝트 코드 ${data.projectCode}는 이미 사용 중입니다.`,
        );
      }
    }

    project.업데이트한다(data, updatedBy);
    const savedProject = await this.projectRepository.save(project);
    return savedProject.DTO로_변환한다();
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
      throw new Error(`ID ${id}에 해당하는 프로젝트를 찾을 수 없습니다.`);
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
    const project = await this.projectRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    return project ? project.DTO로_변환한다() : null;
  }

  /**
   * 프로젝트 코드로 프로젝트를 조회한다
   * @param projectCode 프로젝트 코드
   * @returns 프로젝트 정보 (없으면 null)
   */
  async 프로젝트코드로_조회한다(
    projectCode: string,
  ): Promise<ProjectDto | null> {
    const project = await this.projectRepository.findOne({
      where: { projectCode, deletedAt: IsNull() },
    });

    return project ? project.DTO로_변환한다() : null;
  }

  /**
   * 프로젝트명으로 프로젝트를 조회한다
   * @param name 프로젝트명
   * @returns 프로젝트 정보 (없으면 null)
   */
  async 프로젝트명으로_조회한다(name: string): Promise<ProjectDto | null> {
    const project = await this.projectRepository.findOne({
      where: { name, deletedAt: IsNull() },
    });

    return project ? project.DTO로_변환한다() : null;
  }

  /**
   * 필터 조건으로 프로젝트 목록을 조회한다
   * @param filter 필터 조건
   * @returns 프로젝트 목록
   */
  async 필터_조회한다(filter: ProjectFilter): Promise<ProjectDto[]> {
    const queryBuilder = this.projectRepository.createQueryBuilder('project');
    queryBuilder.where('project.deletedAt IS NULL');

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

    const projects = await queryBuilder.getMany();
    return projects.map((project) => project.DTO로_변환한다());
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

    const queryBuilder = this.projectRepository.createQueryBuilder('project');
    queryBuilder.where('project.deletedAt IS NULL');

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
    queryBuilder.skip(offset).take(limit);

    const [projects, total] = await queryBuilder.getManyAndCount();

    return {
      projects: projects.map((project) => project.DTO로_변환한다()),
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
    const projects = await this.projectRepository.find({
      where: { deletedAt: IsNull() },
      order: { name: 'ASC' },
    });

    return projects.map((project) => project.DTO로_변환한다());
  }

  /**
   * 활성 프로젝트 목록을 조회한다
   * @returns 활성 프로젝트 목록
   */
  async 활성_조회한다(): Promise<ProjectDto[]> {
    const projects = await this.projectRepository.find({
      where: { status: ProjectStatus.ACTIVE, deletedAt: IsNull() },
      order: { name: 'ASC' },
    });

    return projects.map((project) => project.DTO로_변환한다());
  }

  /**
   * 매니저별 프로젝트 목록을 조회한다
   * @param managerId 매니저 ID
   * @returns 매니저 프로젝트 목록
   */
  async 매니저별_조회한다(managerId: string): Promise<ProjectDto[]> {
    const projects = await this.projectRepository.find({
      where: { managerId, deletedAt: IsNull() },
      order: { name: 'ASC' },
    });

    return projects.map((project) => project.DTO로_변환한다());
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
      throw new Error(`ID ${id}에 해당하는 프로젝트를 찾을 수 없습니다.`);
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
}
