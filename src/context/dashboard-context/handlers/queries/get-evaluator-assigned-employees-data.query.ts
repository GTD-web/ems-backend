import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import {
  GetEmployeeAssignedDataHandler,
  EmployeeAssignedDataResult,
  EvaluationPeriodInfo,
  EmployeeInfo,
} from './get-employee-assigned-data';

/**
 * 담당자의 피평가자 할당 정보 조회 쿼리
 */
export class GetEvaluatorAssignedEmployeesDataQuery {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly evaluatorId: string,
    public readonly employeeId: string,
  ) {}
}

/**
 * 담당자의 피평가자 할당 정보 조회 결과
 */
export interface EvaluatorAssignedEmployeesDataResult {
  evaluationPeriod: EvaluationPeriodInfo;
  evaluator: EmployeeInfo;
  evaluatee: Omit<EmployeeAssignedDataResult, 'evaluationPeriod'>;
}

/**
 * 담당자의 피평가자 할당 정보 조회 쿼리 핸들러
 *
 * 평가자가 담당하는 모든 피평가자의 정보를 조회합니다.
 * 각 피평가자의 데이터 구조는 일반 사용자 조회와 동일합니다.
 */
@Injectable()
@QueryHandler(GetEvaluatorAssignedEmployeesDataQuery)
export class GetEvaluatorAssignedEmployeesDataHandler
  implements
    IQueryHandler<
      GetEvaluatorAssignedEmployeesDataQuery,
      EvaluatorAssignedEmployeesDataResult
    >
{
  private readonly logger = new Logger(
    GetEvaluatorAssignedEmployeesDataHandler.name,
  );

  constructor(
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(EvaluationLineMapping)
    private readonly lineMappingRepository: Repository<EvaluationLineMapping>,
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly periodEmployeeMappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
    private readonly employeeAssignedDataHandler: GetEmployeeAssignedDataHandler,
  ) {}

  async execute(
    query: GetEvaluatorAssignedEmployeesDataQuery,
  ): Promise<EvaluatorAssignedEmployeesDataResult> {
    const { evaluationPeriodId, evaluatorId, employeeId } = query;

    this.logger.log('담당자의 피평가자 할당 정보 조회 시작', {
      evaluationPeriodId,
      evaluatorId,
      employeeId,
    });

    // 1. 평가기간 조회
    const evaluationPeriod = await this.evaluationPeriodRepository.findOne({
      where: { id: evaluationPeriodId },
    });

    if (!evaluationPeriod) {
      throw new NotFoundException(
        `평가기간을 찾을 수 없습니다. (evaluationPeriodId: ${evaluationPeriodId})`,
      );
    }

    // 2. 평가자 조회
    const evaluator = await this.employeeRepository.findOne({
      where: { id: evaluatorId },
    });

    if (!evaluator) {
      throw new NotFoundException(
        `평가자를 찾을 수 없습니다. (evaluatorId: ${evaluatorId})`,
      );
    }

    // 3. 평가자 부서명 조회
    let evaluatorDepartmentName: string | undefined;
    if (evaluator.departmentId) {
      // departmentId가 UUID인지 확인하고 code로 조회 시도
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          evaluator.departmentId,
        );

      const department = await this.departmentRepository.findOne({
        where: isUUID
          ? { id: evaluator.departmentId }
          : { code: evaluator.departmentId },
      });
      evaluatorDepartmentName = department?.name;
    }

    // 4. 평가기간에 피평가자가 등록되어 있는지 확인
    const employeeMapping = await this.periodEmployeeMappingRepository.findOne({
      where: {
        evaluationPeriodId,
        employeeId,
      },
    });

    if (!employeeMapping) {
      throw new NotFoundException(
        `평가기간에 등록되지 않은 직원입니다. (employeeId: ${employeeId})`,
      );
    }

    // 5. 평가자-피평가자 관계 확인 (EvaluationLineMapping에서 조회)
    const hasEvaluationRelation = await this.lineMappingRepository
      .createQueryBuilder('mapping')
      .where('mapping.evaluatorId = :evaluatorId', { evaluatorId })
      .andWhere('mapping.employeeId = :employeeId', { employeeId })
      .andWhere('mapping.deletedAt IS NULL')
      .getCount();

    if (hasEvaluationRelation === 0) {
      throw new NotFoundException(
        `평가자가 해당 피평가자를 담당하지 않습니다. (evaluatorId: ${evaluatorId}, employeeId: ${employeeId})`,
      );
    }

    this.logger.log('평가자-피평가자 관계 확인 완료', {
      evaluatorId,
      employeeId,
      mappingCount: hasEvaluationRelation,
    });

    // 6. 피평가자의 할당 정보 조회 (일반 사용자 조회 핸들러 재사용)
    const evaluateeData = await this.employeeAssignedDataHandler.execute({
      evaluationPeriodId,
      employeeId,
    });

    // evaluationPeriod 제거 (최상위에 이미 존재하므로 중복 방지)
    const { evaluationPeriod: _, ...evaluateeWithoutPeriod } = evaluateeData;

    this.logger.log('담당자의 피평가자 할당 정보 조회 완료', {
      evaluatorId,
      employeeId,
    });

    return {
      evaluationPeriod: {
        id: evaluationPeriod.id,
        name: evaluationPeriod.name,
        startDate: evaluationPeriod.startDate,
        endDate: evaluationPeriod.endDate,
        status: evaluationPeriod.status,
        description: evaluationPeriod.description,
        criteriaSettingEnabled: evaluationPeriod.criteriaSettingEnabled,
        selfEvaluationSettingEnabled:
          evaluationPeriod.selfEvaluationSettingEnabled,
        finalEvaluationSettingEnabled:
          evaluationPeriod.finalEvaluationSettingEnabled,
        maxSelfEvaluationRate: evaluationPeriod.maxSelfEvaluationRate,
      },
      evaluator: {
        id: evaluator.id,
        employeeNumber: evaluator.employeeNumber,
        name: evaluator.name,
        email: evaluator.email,
        phoneNumber: evaluator.phoneNumber,
        departmentId: evaluator.departmentId || '',
        departmentName: evaluatorDepartmentName,
        status: evaluator.status,
      },
      evaluatee: evaluateeWithoutPeriod,
    };
  }
}
