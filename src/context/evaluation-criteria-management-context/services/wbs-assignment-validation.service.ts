import {
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, IsNull } from 'typeorm';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import type { CreateEvaluationWbsAssignmentData } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

/**
 * WBS 할당 검증 서비스 (Context 레벨)
 *
 * 비즈니스 로직 검증 및 예외 처리를 수행합니다.
 * 도메인 예외를 HTTP 예외로 변환하는 역할을 담당합니다.
 */
@Injectable()
export class WbsAssignmentValidationService {
  constructor(
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    private readonly transactionManager: TransactionManagerService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  /**
   * WBS 할당 생성 비즈니스 규칙을 검증한다
   * Context 레벨에서 비즈니스 로직 검증 및 예외 처리를 수행
   */
  async 할당생성비즈니스규칙검증한다(
    data: CreateEvaluationWbsAssignmentData,
    manager?: EntityManager,
  ): Promise<void> {
    // 1. 직원 존재 검증 (먼저 실행하여 404를 명확히 반환)
    const employeeRepository = this.transactionManager.getRepository(
      Employee,
      this.employeeRepository,
      manager,
    );
    const employee = await employeeRepository.findOne({
      where: { id: data.employeeId },
    });
    if (!employee) {
      throw new NotFoundException(
        `직원 ID ${data.employeeId}에 해당하는 직원을 찾을 수 없습니다.`,
      );
    }

    // 2. 프로젝트 할당 선행 조건 검증
    const projectAssignmentRepository = this.transactionManager.getRepository(
      EvaluationProjectAssignment,
      this.projectAssignmentRepository,
      manager,
    );
    const projectAssignment = await projectAssignmentRepository.findOne({
      where: {
        periodId: data.periodId,
        employeeId: data.employeeId,
        projectId: data.projectId,
        deletedAt: IsNull(),
      },
    });
    if (!projectAssignment) {
      throw new UnprocessableEntityException(
        `프로젝트 할당이 먼저 필요합니다. 평가기간: ${data.periodId}, 직원: ${data.employeeId}, 프로젝트: ${data.projectId}`,
      );
    }

    // 3. 평가기간 상태 검증
    if (!data.periodId?.trim()) {
      throw new UnprocessableEntityException(
        '평가기간 상태를 확인할 수 없습니다.',
      );
    }
    const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(
      data.periodId,
      manager,
    );
    if (!evaluationPeriod) {
      throw new NotFoundException(
        `평가기간 ID ${data.periodId}에 해당하는 평가기간을 찾을 수 없습니다.`,
      );
    }
    if (evaluationPeriod.완료된_상태인가()) {
      throw new UnprocessableEntityException(
        `완료된 평가기간에는 WBS 할당을 생성할 수 없습니다. 평가기간: ${data.periodId}`,
      );
    }

    // 4. 중복 할당 검증
    const wbsAssignmentRepository = this.transactionManager.getRepository(
      EvaluationWbsAssignment,
      this.wbsAssignmentRepository,
      manager,
    );
    const duplicateCount = await wbsAssignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.periodId = :periodId', { periodId: data.periodId })
      .andWhere('assignment.employeeId = :employeeId', {
        employeeId: data.employeeId,
      })
      .andWhere('assignment.projectId = :projectId', {
        projectId: data.projectId,
      })
      .andWhere('assignment.wbsItemId = :wbsItemId', {
        wbsItemId: data.wbsItemId,
      })
      .andWhere('assignment.deletedAt IS NULL')
      .getCount();
    if (duplicateCount > 0) {
      throw new ConflictException(
        `이미 할당된 WBS입니다. 평가기간: ${data.periodId}, 직원: ${data.employeeId}, 프로젝트: ${data.projectId}, WBS 항목: ${data.wbsItemId}`,
      );
    }
  }
}
