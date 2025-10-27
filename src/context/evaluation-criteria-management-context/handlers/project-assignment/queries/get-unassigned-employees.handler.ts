import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EmployeeInfoDto } from '@interface/admin/evaluation-criteria/dto/project-assignment.dto';

/**
 * 할당되지 않은 직원 목록 조회 쿼리
 */
export class GetUnassignedEmployeesQuery {
  constructor(
    public readonly periodId: string,
    public readonly projectId?: string,
  ) {}
}

/**
 * 할당되지 않은 직원 목록 조회 쿼리 핸들러
 */
@QueryHandler(GetUnassignedEmployeesQuery)
@Injectable()
export class GetUnassignedEmployeesHandler
  implements IQueryHandler<GetUnassignedEmployeesQuery>
{
  constructor(
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async execute(
    query: GetUnassignedEmployeesQuery,
  ): Promise<{
    periodId: string;
    projectId?: string;
    employees: EmployeeInfoDto[];
  }> {
    const { periodId, projectId } = query;

    // 해당 평가기간에 할당된 직원 ID 조회
    const assignmentQueryBuilder = this.projectAssignmentRepository
      .createQueryBuilder('assignment')
      .select('assignment.employeeId')
      .where('assignment.deletedAt IS NULL')
      .andWhere('assignment.periodId = :periodId', { periodId });

    if (projectId) {
      assignmentQueryBuilder.andWhere('assignment.projectId = :projectId', {
        projectId,
      });
    }

    const assignedEmployeeIds = await assignmentQueryBuilder
      .getRawMany()
      .then((results) => results.map((result) => result.employeeId));

    // 전체 활성 직원 목록에서 할당된 직원을 제외하고 조회
    const unassignedEmployeesQuery = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoin(
        Department,
        'department',
        'department.externalId = employee.departmentId AND department.deletedAt IS NULL',
      )
      .select([
        'employee.id AS employee_id',
        'employee.employeeNumber AS employee_employeenumber',
        'employee.name AS employee_name',
        'employee.email AS employee_email',
        'employee.phoneNumber AS employee_phonenumber',
        'employee.status AS employee_status',
        'employee.departmentId AS employee_departmentid',
        'department.name AS department_name',
      ])
      .where('employee.deletedAt IS NULL')
      .andWhere('employee.status = :status', { status: '재직중' });

    if (assignedEmployeeIds.length > 0) {
      unassignedEmployeesQuery.andWhere(
        'employee.id NOT IN (:...assignedIds)',
        {
          assignedIds: assignedEmployeeIds,
        },
      );
    }

    const results = await unassignedEmployeesQuery
      .orderBy('employee.name', 'ASC')
      .getRawMany();

    const employees: EmployeeInfoDto[] = results.map((result) => ({
      id: result.employee_id,
      employeeNumber: result.employee_employeenumber,
      name: result.employee_name,
      email: result.employee_email,
      phoneNumber: result.employee_phonenumber,
      status: result.employee_status,
      departmentId: result.employee_departmentid,
      departmentName: result.department_name,
    }));

    return {
      periodId,
      projectId,
      employees,
    };
  }
}
