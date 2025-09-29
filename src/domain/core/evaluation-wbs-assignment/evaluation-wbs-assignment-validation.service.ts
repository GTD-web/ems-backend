import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { EvaluationWbsAssignment } from './evaluation-wbs-assignment.entity';
import {
  EvaluationWbsAssignmentBusinessRuleViolationException,
  EvaluationWbsAssignmentDuplicateException,
  EvaluationWbsAssignmentRequiredDataMissingException,
  InvalidEvaluationWbsAssignmentDataFormatException,
} from './evaluation-wbs-assignment.exceptions';
import {
  CreateEvaluationWbsAssignmentData,
  UpdateEvaluationWbsAssignmentData,
} from './evaluation-wbs-assignment.types';

/**
 * 평가 WBS 할당 유효성 검증 서비스
 * 평가 WBS 할당 관련 비즈니스 규칙과 데이터 유효성을 검증합니다.
 */
@Injectable()
export class EvaluationWbsAssignmentValidationService {
  private readonly logger = new Logger(
    EvaluationWbsAssignmentValidationService.name,
  );

  constructor(
    @InjectRepository(EvaluationWbsAssignment)
    private readonly evaluationWbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  /**
   * 할당 생성 데이터를 검증한다
   */
  async 생성데이터검증한다(
    createData: CreateEvaluationWbsAssignmentData,
    manager?: EntityManager,
  ): Promise<void> {
    // 필수 데이터 검증
    this.필수데이터검증한다(createData);

    // 데이터 형식 검증
    this.데이터형식검증한다(createData);

    // 비즈니스 규칙 검증
    await this.생성비즈니스규칙검증한다(createData, manager);
  }

  /**
   * 할당 업데이트 데이터를 검증한다
   */
  async 업데이트데이터검증한다(
    id: string,
    updateData: UpdateEvaluationWbsAssignmentData,
    manager?: EntityManager,
  ): Promise<void> {
    // 기존 할당 조회
    const repository = this.transactionManager.getRepository(
      EvaluationWbsAssignment,
      this.evaluationWbsAssignmentRepository,
      manager,
    );
    const existingAssignment = await repository.findOne({ where: { id } });
    if (!existingAssignment) {
      throw new EvaluationWbsAssignmentRequiredDataMissingException(
        '존재하지 않는 평가 WBS 할당입니다.',
      );
    }

    // 데이터 형식 검증
    if (updateData.assignedBy !== undefined) {
      this.할당자형식검증한다(updateData.assignedBy);
    }

    // 비즈니스 규칙 검증
    await this.업데이트비즈니스규칙검증한다(
      id,
      updateData,
      existingAssignment,
      manager,
    );
  }

  /**
   * 필수 데이터를 검증한다
   */
  private 필수데이터검증한다(
    createData: CreateEvaluationWbsAssignmentData,
  ): void {
    if (!createData.periodId?.trim()) {
      throw new EvaluationWbsAssignmentRequiredDataMissingException(
        '평가 기간 ID는 필수입니다.',
      );
    }

    if (!createData.employeeId?.trim()) {
      throw new EvaluationWbsAssignmentRequiredDataMissingException(
        '직원 ID는 필수입니다.',
      );
    }

    if (!createData.projectId?.trim()) {
      throw new EvaluationWbsAssignmentRequiredDataMissingException(
        '프로젝트 ID는 필수입니다.',
      );
    }

    if (!createData.wbsItemId?.trim()) {
      throw new EvaluationWbsAssignmentRequiredDataMissingException(
        'WBS 항목 ID는 필수입니다.',
      );
    }

    if (!createData.assignedBy?.trim()) {
      throw new EvaluationWbsAssignmentRequiredDataMissingException(
        '할당자 ID는 필수입니다.',
      );
    }
  }

  /**
   * 데이터 형식을 검증한다
   */
  private 데이터형식검증한다(
    data: CreateEvaluationWbsAssignmentData | UpdateEvaluationWbsAssignmentData,
  ): void {
    if ('periodId' in data && data.periodId !== undefined) {
      this.ID형식검증한다(data.periodId, 'periodId');
    }

    if ('employeeId' in data && data.employeeId !== undefined) {
      this.ID형식검증한다(data.employeeId, 'employeeId');
    }

    if ('projectId' in data && data.projectId !== undefined) {
      this.ID형식검증한다(data.projectId, 'projectId');
    }

    if ('wbsItemId' in data && data.wbsItemId !== undefined) {
      this.ID형식검증한다(data.wbsItemId, 'wbsItemId');
    }

    if (data.assignedBy !== undefined) {
      this.할당자형식검증한다(data.assignedBy);
    }
  }

  /**
   * ID 형식을 검증한다
   */
  private ID형식검증한다(id: string, fieldName: string): void {
    if (!id?.trim()) {
      throw new InvalidEvaluationWbsAssignmentDataFormatException(
        fieldName,
        '공백이 아닌 문자열',
        id,
      );
    }

    if (id.length > 255) {
      throw new InvalidEvaluationWbsAssignmentDataFormatException(
        fieldName,
        '255자 이하',
        id,
      );
    }

    // UUID 형식 검증 (선택적)
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(id)) {
      throw new InvalidEvaluationWbsAssignmentDataFormatException(
        fieldName,
        'UUID 형식',
        id,
      );
    }
  }

  /**
   * 할당자 형식을 검증한다
   */
  private 할당자형식검증한다(assignedBy: string): void {
    if (!assignedBy?.trim()) {
      throw new InvalidEvaluationWbsAssignmentDataFormatException(
        'assignedBy',
        '공백이 아닌 문자열',
        assignedBy,
      );
    }

    if (assignedBy.length > 255) {
      throw new InvalidEvaluationWbsAssignmentDataFormatException(
        'assignedBy',
        '255자 이하',
        assignedBy,
      );
    }
  }

  /**
   * 생성 시 비즈니스 규칙을 검증한다
   */
  private async 생성비즈니스규칙검증한다(
    createData: CreateEvaluationWbsAssignmentData,
    manager?: EntityManager,
  ): Promise<void> {
    // 중복 할당 검증
    await this.중복할당검증한다(
      createData.periodId,
      createData.employeeId,
      createData.projectId,
      createData.wbsItemId,
      undefined,
      manager,
    );

    // 평가기간 유효성 검증 (실제 구현에서는 평가기간 서비스를 주입받아 검증)
    await this.평가기간유효성검증한다(createData.periodId, manager);

    // 직원 유효성 검증 (실제 구현에서는 직원 서비스를 주입받아 검증)
    await this.직원유효성검증한다(createData.employeeId, manager);

    // 프로젝트 유효성 검증 (실제 구현에서는 프로젝트 서비스를 주입받아 검증)
    await this.프로젝트유효성검증한다(createData.projectId, manager);

    // WBS 항목 유효성 검증 (실제 구현에서는 WBS 서비스를 주입받아 검증)
    await this.WBS항목유효성검증한다(createData.wbsItemId, manager);

    // 프로젝트-WBS 항목 연관성 검증
    await this.프로젝트WBS연관성검증한다(
      createData.projectId,
      createData.wbsItemId,
      manager,
    );
  }

  /**
   * 업데이트 시 비즈니스 규칙을 검증한다
   */
  private async 업데이트비즈니스규칙검증한다(
    id: string,
    updateData: UpdateEvaluationWbsAssignmentData,
    existingAssignment: any,
    manager?: EntityManager,
  ): Promise<void> {
    // 현재는 할당자만 업데이트 가능하므로 특별한 비즈니스 규칙 없음
    // 향후 다른 필드 업데이트가 추가되면 해당 규칙 추가

    // 할당자 유효성 검증 (실제 구현에서는 사용자 서비스를 주입받아 검증)
    if (updateData.assignedBy) {
      await this.할당자유효성검증한다(updateData.assignedBy, manager);
    }
  }

  /**
   * 할당 생성 비즈니스 규칙을 검증한다
   */
  async 할당생성비즈니스규칙검증한다(
    createData: CreateEvaluationWbsAssignmentData,
    manager?: EntityManager,
  ): Promise<void> {
    // 중복 할당 검증
    await this.중복할당검증한다(
      createData.periodId,
      createData.employeeId,
      createData.projectId,
      createData.wbsItemId,
      undefined,
      manager,
    );

    // 평가기간 상태 검증
    await this.평가기간상태검증한다(createData.periodId, manager);

    // 프로젝트-WBS 항목 연관성 검증
    await this.프로젝트WBS연관성검증한다(
      createData.projectId,
      createData.wbsItemId,
      manager,
    );
  }

  /**
   * 할당 업데이트 비즈니스 규칙을 검증한다
   */
  async 할당업데이트비즈니스규칙검증한다(
    id: string,
    updateData: UpdateEvaluationWbsAssignmentData,
    manager?: EntityManager,
  ): Promise<void> {
    // 기존 할당 조회
    const repository = this.transactionManager.getRepository(
      EvaluationWbsAssignment,
      this.evaluationWbsAssignmentRepository,
      manager,
    );
    const existingAssignment = await repository.findOne({ where: { id } });
    if (!existingAssignment) {
      throw new EvaluationWbsAssignmentRequiredDataMissingException(
        '존재하지 않는 평가 WBS 할당입니다.',
      );
    }

    // 평가기간 상태 검증
    await this.평가기간상태검증한다(existingAssignment.periodId, manager);

    // 기존 업데이트 비즈니스 규칙 검증
    await this.업데이트비즈니스규칙검증한다(
      id,
      updateData,
      existingAssignment,
      manager,
    );
  }

  /**
   * 할당 삭제 비즈니스 규칙을 검증한다
   */
  async 할당삭제비즈니스규칙검증한다(assignment: any): Promise<void> {
    // 평가기간 상태 검증 - 완료된 평가기간의 할당은 삭제할 수 없음
    // 실제 구현에서는 평가기간 서비스를 주입받아 상태 확인
    // 현재는 기본적인 검증만 수행

    // 할당 후 일정 시간이 지난 경우 삭제 제한 (예: 24시간)
    const now = new Date();
    const assignedDate = new Date(assignment.assignedDate);
    const hoursDiff =
      (now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      throw new EvaluationWbsAssignmentBusinessRuleViolationException(
        '할당 후 24시간이 지난 할당은 삭제할 수 없습니다.',
      );
    }
  }

  /**
   * 중복 할당을 검증한다
   */
  private async 중복할당검증한다(
    periodId: string,
    employeeId: string,
    projectId: string,
    wbsItemId: string,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.transactionManager.getRepository(
      EvaluationWbsAssignment,
      this.evaluationWbsAssignmentRepository,
      manager,
    );

    const queryBuilder = repository
      .createQueryBuilder('assignment')
      .where('assignment.periodId = :periodId', { periodId })
      .andWhere('assignment.employeeId = :employeeId', { employeeId })
      .andWhere('assignment.projectId = :projectId', { projectId })
      .andWhere('assignment.wbsItemId = :wbsItemId', { wbsItemId });

    if (excludeId) {
      queryBuilder.andWhere('assignment.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    if (count > 0) {
      throw new EvaluationWbsAssignmentDuplicateException(
        periodId,
        employeeId,
        projectId,
        wbsItemId,
      );
    }
  }

  /**
   * 평가기간 유효성을 검증한다
   */
  private async 평가기간유효성검증한다(
    periodId: string,
    manager?: EntityManager,
  ): Promise<void> {
    // 실제 구현에서는 평가기간 서비스를 주입받아 검증
    // 현재는 기본적인 형식 검증만 수행
    if (!periodId?.trim()) {
      throw new EvaluationWbsAssignmentBusinessRuleViolationException(
        '유효하지 않은 평가기간 ID입니다.',
      );
    }
  }

  /**
   * 직원 유효성을 검증한다
   */
  private async 직원유효성검증한다(
    employeeId: string,
    manager?: EntityManager,
  ): Promise<void> {
    // 실제 구현에서는 직원 서비스를 주입받아 검증
    // 현재는 기본적인 형식 검증만 수행
    if (!employeeId?.trim()) {
      throw new EvaluationWbsAssignmentBusinessRuleViolationException(
        '유효하지 않은 직원 ID입니다.',
      );
    }
  }

  /**
   * 프로젝트 유효성을 검증한다
   */
  private async 프로젝트유효성검증한다(
    projectId: string,
    manager?: EntityManager,
  ): Promise<void> {
    // 실제 구현에서는 프로젝트 서비스를 주입받아 검증
    // 현재는 기본적인 형식 검증만 수행
    if (!projectId?.trim()) {
      throw new EvaluationWbsAssignmentBusinessRuleViolationException(
        '유효하지 않은 프로젝트 ID입니다.',
      );
    }
  }

  /**
   * WBS 항목 유효성을 검증한다
   */
  private async WBS항목유효성검증한다(
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<void> {
    // 실제 구현에서는 WBS 서비스를 주입받아 검증
    // 현재는 기본적인 형식 검증만 수행
    if (!wbsItemId?.trim()) {
      throw new EvaluationWbsAssignmentBusinessRuleViolationException(
        '유효하지 않은 WBS 항목 ID입니다.',
      );
    }
  }

  /**
   * 할당자 유효성을 검증한다
   */
  private async 할당자유효성검증한다(
    assignedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    // 실제 구현에서는 사용자 서비스를 주입받아 검증
    // 현재는 기본적인 형식 검증만 수행
    if (!assignedBy?.trim()) {
      throw new EvaluationWbsAssignmentBusinessRuleViolationException(
        '유효하지 않은 할당자 ID입니다.',
      );
    }
  }

  /**
   * 평가기간 상태를 검증한다
   */
  private async 평가기간상태검증한다(
    periodId: string,
    manager?: EntityManager,
  ): Promise<void> {
    // 실제 구현에서는 평가기간 서비스를 주입받아 상태 확인
    // 완료된 평가기간에는 할당을 생성/수정할 수 없음
    // 현재는 기본적인 검증만 수행

    if (!periodId?.trim()) {
      throw new EvaluationWbsAssignmentBusinessRuleViolationException(
        '평가기간 상태를 확인할 수 없습니다.',
      );
    }
  }

  /**
   * 프로젝트-WBS 항목 연관성을 검증한다
   */
  private async 프로젝트WBS연관성검증한다(
    projectId: string,
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<void> {
    // 실제 구현에서는 프로젝트 서비스와 WBS 서비스를 주입받아 연관성 확인
    // WBS 항목이 해당 프로젝트에 속하는지 검증
    // 현재는 기본적인 검증만 수행

    if (!projectId?.trim() || !wbsItemId?.trim()) {
      throw new EvaluationWbsAssignmentBusinessRuleViolationException(
        '프로젝트와 WBS 항목의 연관성을 확인할 수 없습니다.',
      );
    }
  }
}
