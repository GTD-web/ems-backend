import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { FinalEvaluation } from './final-evaluation.entity';
import {
  FinalEvaluationBusinessRuleViolationException,
  DuplicateFinalEvaluationException,
  FinalEvaluationRequiredDataMissingException,
  InvalidFinalEvaluationDataFormatException,
  InvalidEvaluationGradeException,
  InvalidJobGradeException,
  InvalidJobDetailedGradeException,
  ConfirmedEvaluationModificationException,
} from './final-evaluation.exceptions';
import {
  CreateFinalEvaluationData,
  UpdateFinalEvaluationData,
  JobGrade,
  JobDetailedGrade,
} from './final-evaluation.types';

/**
 * 최종평가 유효성 검증 서비스
 * 최종평가 관련 비즈니스 규칙과 데이터 유효성을 검증합니다.
 */
@Injectable()
export class FinalEvaluationValidationService {
  private readonly logger = new Logger(FinalEvaluationValidationService.name);

  constructor(
    @InjectRepository(FinalEvaluation)
    private readonly finalEvaluationRepository: Repository<FinalEvaluation>,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  /**
   * 최종평가 생성 데이터를 검증한다
   */
  async 생성데이터검증한다(
    createData: CreateFinalEvaluationData,
    manager?: EntityManager,
  ): Promise<void> {
    this.logger.debug('최종평가 생성 데이터 검증 시작');

    // 필수 데이터 검증
    this.필수데이터검증한다(createData);

    // 데이터 형식 검증
    this.데이터형식검증한다(createData);

    // 비즈니스 규칙 검증
    await this.비즈니스규칙검증한다(createData, manager);

    // 중복 검증
    await this.중복검증한다(createData, manager);

    this.logger.debug('최종평가 생성 데이터 검증 완료');
  }

  /**
   * 최종평가 업데이트 데이터를 검증한다
   */
  async 업데이트데이터검증한다(
    id: string,
    updateData: UpdateFinalEvaluationData,
    manager?: EntityManager,
  ): Promise<void> {
    this.logger.debug(`최종평가 업데이트 데이터 검증 시작 - ID: ${id}`);

    // 업데이트할 데이터가 있는지 확인
    if (Object.keys(updateData).length === 0) {
      throw new FinalEvaluationRequiredDataMissingException(
        '업데이트할 데이터가 없습니다.',
      );
    }

    // 데이터 형식 검증 (업데이트 데이터만)
    this.업데이트데이터형식검증한다(updateData);

    // 확정된 평가 수정 불가 검증
    await this.확정된평가수정불가검증한다(id, manager);

    this.logger.debug(`최종평가 업데이트 데이터 검증 완료 - ID: ${id}`);
  }

  /**
   * 필수 데이터를 검증한다
   */
  private 필수데이터검증한다(createData: CreateFinalEvaluationData): void {
    if (!createData.employeeId) {
      throw new FinalEvaluationRequiredDataMissingException(
        '직원 ID는 필수입니다.',
      );
    }

    if (!createData.periodId) {
      throw new FinalEvaluationRequiredDataMissingException(
        '평가기간 ID는 필수입니다.',
      );
    }

    if (!createData.evaluationGrade) {
      throw new FinalEvaluationRequiredDataMissingException(
        '평가등급은 필수입니다.',
      );
    }

    if (!createData.jobGrade) {
      throw new FinalEvaluationRequiredDataMissingException(
        '직무등급은 필수입니다.',
      );
    }

    if (!createData.jobDetailedGrade) {
      throw new FinalEvaluationRequiredDataMissingException(
        '직무 상세등급은 필수입니다.',
      );
    }
  }

  /**
   * 데이터 형식을 검증한다
   */
  private 데이터형식검증한다(createData: CreateFinalEvaluationData): void {
    // 평가등급 검증 (빈 문자열 체크)
    if (createData.evaluationGrade.trim().length === 0) {
      throw new InvalidEvaluationGradeException(createData.evaluationGrade);
    }

    // 직무등급 검증
    if (!Object.values(JobGrade).includes(createData.jobGrade)) {
      throw new InvalidJobGradeException(
        createData.jobGrade,
        Object.values(JobGrade),
      );
    }

    // 직무 상세등급 검증
    if (
      !Object.values(JobDetailedGrade).includes(createData.jobDetailedGrade)
    ) {
      throw new InvalidJobDetailedGradeException(
        createData.jobDetailedGrade,
        Object.values(JobDetailedGrade),
      );
    }
  }

  /**
   * 업데이트 데이터 형식을 검증한다
   */
  private 업데이트데이터형식검증한다(
    updateData: UpdateFinalEvaluationData,
  ): void {
    // 평가등급 검증
    if (
      updateData.evaluationGrade !== undefined &&
      updateData.evaluationGrade.trim().length === 0
    ) {
      throw new InvalidEvaluationGradeException(updateData.evaluationGrade);
    }

    // 직무등급 검증
    if (
      updateData.jobGrade !== undefined &&
      !Object.values(JobGrade).includes(updateData.jobGrade)
    ) {
      throw new InvalidJobGradeException(
        updateData.jobGrade,
        Object.values(JobGrade),
      );
    }

    // 직무 상세등급 검증
    if (
      updateData.jobDetailedGrade !== undefined &&
      !Object.values(JobDetailedGrade).includes(updateData.jobDetailedGrade)
    ) {
      throw new InvalidJobDetailedGradeException(
        updateData.jobDetailedGrade,
        Object.values(JobDetailedGrade),
      );
    }
  }

  /**
   * 비즈니스 규칙을 검증한다
   */
  private async 비즈니스규칙검증한다(
    createData: CreateFinalEvaluationData,
    manager?: EntityManager,
  ): Promise<void> {
    // 추가적인 비즈니스 규칙이 있다면 여기에 추가
    // 예: 특정 평가등급과 직무등급의 조합 검증 등
  }

  /**
   * 중복을 검증한다
   */
  private async 중복검증한다(
    createData: CreateFinalEvaluationData,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.transactionManager.getRepository(
      FinalEvaluation,
      this.finalEvaluationRepository,
      manager,
    );

    const existingEvaluation = await repository.findOne({
      where: {
        employeeId: createData.employeeId,
        periodId: createData.periodId,
      },
    });

    if (existingEvaluation) {
      throw new DuplicateFinalEvaluationException(
        createData.employeeId,
        createData.periodId,
      );
    }
  }

  /**
   * 확정된 평가 수정 불가를 검증한다
   */
  private async 확정된평가수정불가검증한다(
    id: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.transactionManager.getRepository(
      FinalEvaluation,
      this.finalEvaluationRepository,
      manager,
    );

    const evaluation = await repository.findOne({ where: { id } });

    if (evaluation?.isConfirmed) {
      throw new ConfirmedEvaluationModificationException(id);
    }
  }

  /**
   * 최종평가 존재 여부를 확인한다
   */
  async 최종평가존재확인한다(
    id: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repository = this.transactionManager.getRepository(
      FinalEvaluation,
      this.finalEvaluationRepository,
      manager,
    );

    const count = await repository.count({ where: { id } });
    return count > 0;
  }

  /**
   * 직원과 평가기간으로 최종평가 존재 여부를 확인한다
   */
  async 직원과평가기간으로존재확인한다(
    employeeId: string,
    periodId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repository = this.transactionManager.getRepository(
      FinalEvaluation,
      this.finalEvaluationRepository,
      manager,
    );

    const count = await repository.count({
      where: { employeeId, periodId },
    });
    return count > 0;
  }
}
