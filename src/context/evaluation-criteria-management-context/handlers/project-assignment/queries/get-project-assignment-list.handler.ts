import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { Project } from '@domain/common/project/project.entity';
import { EvaluationProjectAssignmentFilter } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';

/**
 * 프로젝트 할당 목록 조회 쿼리
 */
export class GetProjectAssignmentListQuery {
  constructor(public readonly filter: EvaluationProjectAssignmentFilter) {}
}

/**
 * 프로젝트 할당 목록 조회 결과
 */
export interface ProjectAssignmentListResult {
  assignments: Array<{
    id: string;
    periodId: string;
    employeeId: string;
    employeeName: string;
    departmentName: string;
    projectId: string;
    projectName: string;
    assignedDate: Date;
    assignedBy: string;
    assignedByName: string;
  }>;
  totalCount: number;
  page: number;
  limit: number;
}

/**
 * 프로젝트 할당 목록 조회 쿼리 핸들러
 */
@QueryHandler(GetProjectAssignmentListQuery)
@Injectable()
export class GetProjectAssignmentListHandler
  implements IQueryHandler<GetProjectAssignmentListQuery>
{
  constructor(
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
  ) {}

  async execute(
    query: GetProjectAssignmentListQuery,
  ): Promise<ProjectAssignmentListResult> {
    const { filter } = query;

    // 쿼리 빌더 생성
    const queryBuilder = this.createQueryBuilder(filter);

    // 총 개수 조회
    const totalCount = await queryBuilder.getCount();

    // 페이징 적용
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const offset = (page - 1) * limit;

    // JOIN 쿼리로 한 번에 모든 정보 조회
    const assignments = await queryBuilder
      .leftJoinAndSelect(
        Employee,
        'employee',
        'employee.id = assignment.employeeId AND employee.deletedAt IS NULL',
      )
      .leftJoinAndSelect(
        Department,
        'department',
        'department.externalId = employee.departmentId AND department.deletedAt IS NULL',
      )
      .leftJoinAndSelect(
        Employee,
        'assignedBy',
        'assignedBy.id = assignment.assignedBy AND assignedBy.deletedAt IS NULL',
      )
      .leftJoinAndSelect(
        Project,
        'project',
        'project.id = assignment.projectId AND project.deletedAt IS NULL',
      )
      .skip(offset)
      .take(limit)
      .getMany();

    // 조인된 정보를 포함한 결과 생성
    const assignmentsWithDetails = assignments.map((assignment) => {
      // 조인된 데이터에서 정보 추출
      const employee = (assignment as any).employee;
      const department = (assignment as any).department;
      const assignedByEmployee = (assignment as any).assignedBy;
      const project = (assignment as any).project;

      return {
        id: assignment.id,
        periodId: assignment.periodId,
        employeeId: assignment.employeeId,
        employeeName: employee?.name || '',
        departmentName: department?.name || '',
        projectId: assignment.projectId,
        projectName: project?.name || '',
        assignedDate: assignment.assignedDate,
        assignedBy: assignment.assignedBy,
        assignedByName: assignedByEmployee?.name || '',
      };
    });

    return {
      assignments: assignmentsWithDetails,
      totalCount,
      page,
      limit,
    };
  }

  private createQueryBuilder(
    filter: EvaluationProjectAssignmentFilter,
  ): SelectQueryBuilder<EvaluationProjectAssignment> {
    const queryBuilder = this.projectAssignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.deletedAt IS NULL');

    // 필터 조건 적용
    if (filter.periodId) {
      queryBuilder.andWhere('assignment.periodId = :periodId', {
        periodId: filter.periodId,
      });
    }

    if (filter.employeeId) {
      queryBuilder.andWhere('assignment.employeeId = :employeeId', {
        employeeId: filter.employeeId,
      });
    }

    if (filter.projectId) {
      queryBuilder.andWhere('assignment.projectId = :projectId', {
        projectId: filter.projectId,
      });
    }

    if (filter.assignedBy) {
      queryBuilder.andWhere('assignment.assignedBy = :assignedBy', {
        assignedBy: filter.assignedBy,
      });
    }

    if (filter.assignedDateFrom) {
      queryBuilder.andWhere('assignment.assignedDate >= :assignedDateFrom', {
        assignedDateFrom: filter.assignedDateFrom,
      });
    }

    if (filter.assignedDateTo) {
      queryBuilder.andWhere('assignment.assignedDate <= :assignedDateTo', {
        assignedDateTo: filter.assignedDateTo,
      });
    }

    // 정렬
    const orderBy = filter.orderBy || 'assignedDate';
    const orderDirection = filter.orderDirection || 'DESC';
    queryBuilder.orderBy(`assignment.${orderBy}`, orderDirection);

    return queryBuilder;
  }
}
