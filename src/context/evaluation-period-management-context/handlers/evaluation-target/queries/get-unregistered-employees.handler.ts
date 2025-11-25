import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationPeriodEmployeeMapping } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { Employee } from '../../../../../domain/common/employee/employee.entity';
import { Department } from '../../../../../domain/common/department/department.entity';

/**
 * 등록되지 않은 직원 목록 조회 쿼리
 */
export class GetUnregisteredEmployeesQuery {
  constructor(
    public readonly evaluationPeriodId: string,
  ) {}
}

/**
 * 등록되지 않은 직원 정보 DTO
 */
export interface UnregisteredEmployeeInfoDto {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  phoneNumber?: string;
  status: string;
  departmentId?: string;
  departmentName?: string;
  rankName?: string;
}

/**
 * 등록되지 않은 직원 목록 조회 쿼리 핸들러
 *
 * 특정 평가기간에 평가 대상자로 등록되지 않은 활성 직원 목록을 조회한다
 */
@QueryHandler(GetUnregisteredEmployeesQuery)
@Injectable()
export class GetUnregisteredEmployeesHandler
  implements
    IQueryHandler<
      GetUnregisteredEmployeesQuery,
      {
        evaluationPeriodId: string;
        employees: UnregisteredEmployeeInfoDto[];
      }
    >
{
  constructor(
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly mappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async execute(query: GetUnregisteredEmployeesQuery): Promise<{
    evaluationPeriodId: string;
    employees: UnregisteredEmployeeInfoDto[];
  }> {
    const { evaluationPeriodId } = query;

    // 1. 해당 평가기간에 등록된 직원 ID 조회 (deletedAt IS NULL인 것만)
    const registeredEmployeeIds = await this.mappingRepository
      .createQueryBuilder('mapping')
      .select('mapping.employeeId', 'employeeId')
      .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
        evaluationPeriodId,
      })
      .andWhere('mapping.deletedAt IS NULL')
      .getRawMany()
      .then((results) => results.map((result) => result.employeeId));

    // 2. 전체 활성 직원 목록에서 등록된 직원을 제외하고 조회
    const unregisteredEmployeesQuery = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoin(
        Department,
        'department',
        'department.id::text = employee.departmentId AND department.deletedAt IS NULL',
      )
      .select([
        'employee.id AS employee_id',
        'employee.employeeNumber AS employee_employeenumber',
        'employee.name AS employee_name',
        'employee.email AS employee_email',
        'employee.phoneNumber AS employee_phonenumber',
        'employee.status AS employee_status',
        'employee.departmentId AS employee_departmentid',
        'COALESCE(department.name, employee.departmentName) AS department_name',
        'employee.rankName AS employee_rankname',
      ])
      .where('employee.deletedAt IS NULL')
      .andWhere('employee.status = :status', { status: '재직중' })
      .andWhere('employee.isExcludedFromList = :isExcludedFromList', {
        isExcludedFromList: false,
      });

    // 등록된 직원이 있으면 제외
    if (registeredEmployeeIds.length > 0) {
      unregisteredEmployeesQuery.andWhere(
        'employee.id NOT IN (:...registeredIds)',
        {
          registeredIds: registeredEmployeeIds,
        },
      );
    }

    const results = await unregisteredEmployeesQuery
      .orderBy('employee.name', 'ASC')
      .getRawMany();

    const employees: UnregisteredEmployeeInfoDto[] = results.map((result) => ({
      id: result.employee_id,
      employeeNumber: result.employee_employeenumber,
      name: result.employee_name,
      email: result.employee_email,
      phoneNumber: result.employee_phonenumber,
      status: result.employee_status,
      departmentId: result.employee_departmentid,
      departmentName: result.department_name,
      rankName: result.employee_rankname,
    }));

    return {
      evaluationPeriodId,
      employees,
    };
  }
}

