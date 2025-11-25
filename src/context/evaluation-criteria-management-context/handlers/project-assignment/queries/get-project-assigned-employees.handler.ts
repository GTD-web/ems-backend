import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EmployeeInfoDto } from '@interface/common/dto/evaluation-criteria/project-assignment.dto';

/**
 * 프로젝트별 할당된 직원 조회 쿼리
 */
export class GetProjectAssignedEmployeesQuery {
  constructor(
    public readonly projectId: string,
    public readonly periodId: string,
  ) {}
}

/**
 * 프로젝트별 할당된 직원 조회 쿼리 핸들러
 */
@QueryHandler(GetProjectAssignedEmployeesQuery)
@Injectable()
export class GetProjectAssignedEmployeesHandler
  implements IQueryHandler<GetProjectAssignedEmployeesQuery>
{
  constructor(
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
  ) {}

  async execute(
    query: GetProjectAssignedEmployeesQuery,
  ): Promise<{ employees: EmployeeInfoDto[] }> {
    const { projectId, periodId } = query;

    const results = await this.projectAssignmentRepository
      .createQueryBuilder('assignment')
      .leftJoin(
        Employee,
        'employee',
        'employee.id = assignment.employeeId AND employee.deletedAt IS NULL',
      )
      .leftJoin(
        Department,
        'department',
        'department.id::text = employee.departmentId AND department.deletedAt IS NULL',
      )
      .select([
        // 직원 정보만 선택
        'employee.id AS employee_id',
        'employee.employeeNumber AS employee_employeenumber',
        'employee.name AS employee_name',
        'employee.email AS employee_email',
        'employee.phoneNumber AS employee_phonenumber',
        'employee.status AS employee_status',
        'employee.departmentId AS employee_departmentid',
        'COALESCE(department.name, employee.departmentName) AS department_name',
      ])
      .where('assignment.deletedAt IS NULL')
      .andWhere('assignment.projectId = :projectId', { projectId })
      .andWhere('assignment.periodId = :periodId', { periodId })
      .orderBy('assignment.assignedDate', 'DESC')
      .getRawMany();

    const employees: EmployeeInfoDto[] = results
      .filter((result) => result.employee_id) // null 직원 제외
      .map((result) => ({
        id: result.employee_id,
        employeeNumber: result.employee_employeenumber,
        name: result.employee_name,
        email: result.employee_email,
        phoneNumber: result.employee_phonenumber,
        status: result.employee_status,
        departmentId: result.employee_departmentid,
        departmentName: result.department_name,
      }));

    return { employees };
  }
}
