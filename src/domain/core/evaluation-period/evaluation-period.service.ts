import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { EvaluationPeriodValidationService } from './evaluation-period-validation.service';
import { EvaluationPeriod } from './evaluation-period.entity';
import {
  EvaluationPeriodBusinessRuleViolationException,
  EvaluationPeriodNotFoundException,
} from './evaluation-period.exceptions';
import {
  CreateEvaluationPeriodDto,
  EvaluationPeriodFilter,
  EvaluationPeriodPhase,
  EvaluationPeriodStatus,
  UpdateEvaluationPeriodDto,
  GradeRange,
  GradeType,
  ScoreGradeMapping,
  CreateGradeRangeDto,
} from './evaluation-period.types';
import { IEvaluationPeriod } from './interfaces/evaluation-period.interface';
import { IEvaluationPeriodService } from './interfaces/evaluation-period.service.interface';

/**
 * 평가 기간 서비스
 * 평가 기간의 CRUD 및 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class EvaluationPeriodService implements IEvaluationPeriodService {
  private readonly logger = new Logger(EvaluationPeriodService.name);

  constructor(
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly transactionManager: TransactionManagerService,
    private readonly validationService: EvaluationPeriodValidationService,
  ) {}

  /**
   * 안전한 도메인 작업을 실행한다
   */
  private async executeSafeDomainOperation<T>(
    operation: () => Promise<T>,
    context: string,
  ): Promise<T> {
    return this.transactionManager.executeSafeOperation(operation, context);
  }

  /**
   * ID로 평가 기간을 조회한다
   */
  async ID로_조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod | null> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationPeriod,
        this.evaluationPeriodRepository,
        manager,
      );

      const evaluationPeriod = await repository.findOne({ where: { id } });
      return evaluationPeriod || null;
    }, 'ID로_조회한다');
  }

  /**
   * 이름으로 평가 기간을 조회한다
   */
  async 이름으로_조회한다(
    name: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod | null> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationPeriod,
        this.evaluationPeriodRepository,
        manager,
      );

      const evaluationPeriod = await repository.findOne({ where: { name } });
      return evaluationPeriod || null;
    }, '이름으로_조회한다');
  }

  /**
   * 모든 평가 기간을 조회한다
   */
  async 전체_조회한다(manager?: EntityManager): Promise<IEvaluationPeriod[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationPeriod,
        this.evaluationPeriodRepository,
        manager,
      );

      return await repository.find({
        order: { startDate: 'DESC' },
      });
    }, '전체_조회한다');
  }

  /**
   * 상태별 평가 기간을 조회한다
   */
  async 상태별_조회한다(
    status: EvaluationPeriodStatus,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationPeriod,
        this.evaluationPeriodRepository,
        manager,
      );

      return await repository.find({
        where: { status },
        order: { startDate: 'DESC' },
      });
    }, '상태별_조회한다');
  }

  /**
   * 단계별 평가 기간을 조회한다
   */
  async 단계별_조회한다(
    phase: EvaluationPeriodPhase,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationPeriod,
        this.evaluationPeriodRepository,
        manager,
      );

      return await repository.find({
        where: { currentPhase: phase },
        order: { startDate: 'DESC' },
      });
    }, '단계별_조회한다');
  }

  /**
   * 활성화된 평가 기간을 조회한다
   */
  async 활성화된_평가기간_조회한다(
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationPeriod,
        this.evaluationPeriodRepository,
        manager,
      );

      return await repository.find({
        where: { status: EvaluationPeriodStatus.IN_PROGRESS },
        order: { startDate: 'DESC' },
      });
    }, '활성화된_평가기간_조회한다');
  }

  /**
   * 완료된 평가 기간을 조회한다
   */
  async 완료된_평가기간_조회한다(
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationPeriod,
        this.evaluationPeriodRepository,
        manager,
      );

      return await repository.find({
        where: { status: EvaluationPeriodStatus.COMPLETED },
        order: { completedDate: 'DESC' },
      });
    }, '완료된_평가기간_조회한다');
  }

  /**
   * 현재 진행중인 평가 기간을 조회한다
   */
  async 현재_진행중_평가기간_조회한다(
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod | null> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationPeriod,
        this.evaluationPeriodRepository,
        manager,
      );

      const now = new Date();
      const evaluationPeriod = await repository.findOne({
        where: {
          status: EvaluationPeriodStatus.IN_PROGRESS,
          startDate: LessThanOrEqual(now),
          endDate: MoreThanOrEqual(now),
        },
        order: { startDate: 'DESC' },
      });

      return evaluationPeriod || null;
    }, '현재_진행중_평가기간_조회한다');
  }

  /**
   * 필터 조건으로 평가 기간을 조회한다
   */
  async 필터_조회한다(
    filter: EvaluationPeriodFilter,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationPeriod,
        this.evaluationPeriodRepository,
        manager,
      );

      const queryBuilder = repository.createQueryBuilder('period');

      if (filter.status) {
        queryBuilder.andWhere('period.status = :status', {
          status: filter.status,
        });
      }

      if (filter.currentPhase) {
        queryBuilder.andWhere('period.currentPhase = :currentPhase', {
          currentPhase: filter.currentPhase,
        });
      }

      if (filter.startDateFrom) {
        queryBuilder.andWhere('period.startDate >= :startDateFrom', {
          startDateFrom: filter.startDateFrom,
        });
      }

      if (filter.endDateTo) {
        queryBuilder.andWhere('period.endDate <= :endDateTo', {
          endDateTo: filter.endDateTo,
        });
      }

      if (filter.activeOnly) {
        queryBuilder.andWhere('period.status = :activeStatus', {
          activeStatus: EvaluationPeriodStatus.IN_PROGRESS,
        });
      }

      if (filter.maxSelfEvaluationRateFrom) {
        queryBuilder.andWhere(
          'period.maxSelfEvaluationRate >= :maxSelfEvaluationRateFrom',
          {
            maxSelfEvaluationRateFrom: filter.maxSelfEvaluationRateFrom,
          },
        );
      }

      if (filter.maxSelfEvaluationRateTo) {
        queryBuilder.andWhere(
          'period.maxSelfEvaluationRate <= :maxSelfEvaluationRateTo',
          {
            maxSelfEvaluationRateTo: filter.maxSelfEvaluationRateTo,
          },
        );
      }

      return await queryBuilder.orderBy('period.startDate', 'DESC').getMany();
    }, '필터_조회한다');
  }

  /**
   * 평가 기간을 생성한다
   */
  async 생성한다(
    createDto: CreateEvaluationPeriodDto,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod> {
    return this.executeSafeDomainOperation(async () => {
      const entityManager = manager || this.dataSource.manager;

      // 엔티티 생성 (불변성 검증 자동 실행)
      // 비즈니스 규칙 검증은 컨텍스트 핸들러에서 수행됨
      const evaluationPeriod = new EvaluationPeriod();
      Object.assign(evaluationPeriod, {
        ...createDto,
        maxSelfEvaluationRate: createDto.maxSelfEvaluationRate ?? 120,
        gradeRanges: [], // 초기에는 빈 배열로 설정
        createdBy,
        updatedBy: createdBy,
      });

      // 등급 구간이 제공된 경우 설정
      if (createDto.gradeRanges && createDto.gradeRanges.length > 0) {
        evaluationPeriod.등급구간_설정한다(createDto.gradeRanges, createdBy);
      }

      const repository = this.transactionManager.getRepository(
        EvaluationPeriod,
        this.evaluationPeriodRepository,
        entityManager,
      );

      return await repository.save(evaluationPeriod);
    }, '생성한다');
  }

  /**
   * 평가 기간을 업데이트한다
   */
  async 업데이트한다(
    id: string,
    updateDto: UpdateEvaluationPeriodDto,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod> {
    return this.executeSafeDomainOperation(async () => {
      const entityManager = manager || this.dataSource.manager;
      const repository = this.transactionManager.getRepository(
        EvaluationPeriod,
        this.evaluationPeriodRepository,
        entityManager,
      );

      const evaluationPeriod = await repository.findOne({ where: { id } });
      if (!evaluationPeriod) {
        throw new EvaluationPeriodNotFoundException(id);
      }

      // 도메인 비즈니스 규칙 검증 (Domain Service 레벨)
      await this.validationService.평가기간업데이트비즈니스규칙검증한다(
        id,
        updateDto,
        entityManager,
      );

      // 엔티티 업데이트 (undefined 값 제외하고 실제 변경된 값만 할당)
      const filteredUpdateDto = Object.fromEntries(
        Object.entries(updateDto).filter(([_, value]) => value !== undefined),
      );
      Object.assign(evaluationPeriod, filteredUpdateDto, { updatedBy });
      return await repository.save(evaluationPeriod);
    }, '업데이트한다');
  }

  /**
   * 평가 기간을 삭제한다
   */
  async 삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationPeriod,
        this.evaluationPeriodRepository,
        manager,
      );

      const evaluationPeriod = await repository.findOne({ where: { id } });
      if (!evaluationPeriod) {
        throw new EvaluationPeriodNotFoundException(id);
      }

      // 도메인 비즈니스 규칙 검증 (Domain Service 레벨)
      await this.validationService.평가기간삭제비즈니스규칙검증한다(
        evaluationPeriod,
      );

      await repository.delete(id);
      this.logger.log(`평가 기간 삭제 완료 - ID: ${id}, 삭제자: ${deletedBy}`);
    }, '삭제한다');
  }

  /**
   * 평가 기간을 시작한다
   */
  async 시작한다(
    id: string,
    startedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod> {
    return this.executeSafeDomainOperation(async () => {
      const entityManager = manager || this.dataSource.manager;
      const repository = this.transactionManager.getRepository(
        EvaluationPeriod,
        this.evaluationPeriodRepository,
        entityManager,
      );

      const evaluationPeriod = await repository.findOne({ where: { id } });
      if (!evaluationPeriod) {
        throw new EvaluationPeriodNotFoundException(id);
      }

      // 도메인 비즈니스 규칙 검증 (Domain Service 레벨)
      await this.validationService.평가기간시작비즈니스규칙검증한다(
        id,
        entityManager,
      );

      // 엔티티 도메인 로직 실행 (Entity 레벨)
      evaluationPeriod.평가기간_시작한다(startedBy);
      return await repository.save(evaluationPeriod);
    }, '시작한다');
  }

  /**
   * 평가 기간을 완료한다
   */
  async 완료한다(
    id: string,
    completedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationPeriod,
        this.evaluationPeriodRepository,
        manager,
      );

      const evaluationPeriod = await repository.findOne({ where: { id } });
      if (!evaluationPeriod) {
        throw new EvaluationPeriodNotFoundException(id);
      }

      // 엔티티 도메인 로직 실행 (Entity 레벨)
      evaluationPeriod.평가기간_완료한다(completedBy);
      return await repository.save(evaluationPeriod);
    }, '완료한다');
  }

  /**
   * 평가 기간 단계를 변경한다
   */
  async 단계_변경한다(
    id: string,
    targetPhase: EvaluationPeriodPhase,
    changedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationPeriod,
        this.evaluationPeriodRepository,
        manager,
      );

      const evaluationPeriod = await repository.findOne({ where: { id } });
      if (!evaluationPeriod) {
        throw new EvaluationPeriodNotFoundException(id);
      }

      // 엔티티 도메인 로직 실행 (Entity 레벨)
      switch (targetPhase) {
        case EvaluationPeriodPhase.EVALUATION_SETUP:
          evaluationPeriod.평가설정_단계로_이동한다(changedBy);
          break;
        case EvaluationPeriodPhase.PERFORMANCE:
          evaluationPeriod.업무수행_단계로_이동한다(changedBy);
          break;
        case EvaluationPeriodPhase.SELF_EVALUATION:
          evaluationPeriod.자기평가_단계로_이동한다(changedBy);
          break;
        case EvaluationPeriodPhase.PEER_EVALUATION:
          evaluationPeriod.하향동료평가_단계로_이동한다(changedBy);
          break;
        case EvaluationPeriodPhase.CLOSURE:
          evaluationPeriod.종결_단계로_이동한다(changedBy);
          break;
        default:
          throw new EvaluationPeriodBusinessRuleViolationException(
            `지원하지 않는 단계입니다: ${targetPhase}`,
          );
      }

      return await repository.save(evaluationPeriod);
    }, '단계_변경한다');
  }

  /**
   * 수동 허용 설정을 변경한다
   */
  async 수동허용설정_변경한다(
    id: string,
    criteriaSettingEnabled?: boolean,
    selfEvaluationSettingEnabled?: boolean,
    finalEvaluationSettingEnabled?: boolean,
    changedBy?: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationPeriod,
        this.evaluationPeriodRepository,
        manager,
      );

      const evaluationPeriod = await repository.findOne({ where: { id } });
      if (!evaluationPeriod) {
        throw new EvaluationPeriodNotFoundException(id);
      }

      // 도메인 비즈니스 규칙 검증 (Domain Service 레벨)
      await this.validationService.수동허용설정변경비즈니스규칙검증한다(
        evaluationPeriod,
      );

      // 엔티티 도메인 로직 실행 (Entity 레벨)
      if (criteriaSettingEnabled !== undefined) {
        if (criteriaSettingEnabled) {
          evaluationPeriod.평가기준설정_수동허용_활성화한다(
            changedBy || 'system',
          );
        } else {
          evaluationPeriod.평가기준설정_수동허용_비활성화한다(
            changedBy || 'system',
          );
        }
      }

      if (selfEvaluationSettingEnabled !== undefined) {
        if (selfEvaluationSettingEnabled) {
          evaluationPeriod.자기평가설정_수동허용_활성화한다(
            changedBy || 'system',
          );
        } else {
          evaluationPeriod.자기평가설정_수동허용_비활성화한다(
            changedBy || 'system',
          );
        }
      }

      if (finalEvaluationSettingEnabled !== undefined) {
        if (finalEvaluationSettingEnabled) {
          evaluationPeriod.하향동료평가설정_수동허용_활성화한다(
            changedBy || 'system',
          );
        } else {
          evaluationPeriod.하향동료평가설정_수동허용_비활성화한다(
            changedBy || 'system',
          );
        }
      }

      if (changedBy) {
        evaluationPeriod.updatedBy = changedBy;
        evaluationPeriod.updatedAt = new Date();
      }

      return await repository.save(evaluationPeriod);
    }, '수동허용설정_변경한다');
  }

  /**
   * 현재 날짜 기준 활성 평가 기간이 있는지 확인한다
   */
  async 활성_평가기간_존재_확인한다(manager?: EntityManager): Promise<boolean> {
    return this.executeSafeDomainOperation(async () => {
      const activePeriod = await this.현재_진행중_평가기간_조회한다(manager);
      return activePeriod !== null;
    }, '활성_평가기간_존재_확인한다');
  }

  /**
   * 자기평가 달성률 최대값을 설정한다
   */
  async 자기평가_달성률최대값_설정한다(
    id: string,
    maxRate: number,
    setBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationPeriod,
        this.evaluationPeriodRepository,
        manager,
      );

      const evaluationPeriod = await repository.findOne({ where: { id } });
      if (!evaluationPeriod) {
        throw new EvaluationPeriodNotFoundException(id);
      }

      // 엔티티 도메인 로직 실행 (Entity 레벨)
      evaluationPeriod.자기평가_달성률최대값_설정한다(maxRate, setBy);
      return await repository.save(evaluationPeriod);
    }, '자기평가_달성률최대값_설정한다');
  }

  // ==================== 등급 구간 관리 ====================

  /**
   * 평가 기간의 등급 구간을 설정한다
   */
  async 등급구간_설정한다(
    id: string,
    gradeRanges: CreateGradeRangeDto[],
    setBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationPeriod,
        this.evaluationPeriodRepository,
        manager,
      );

      const evaluationPeriod = await repository.findOne({ where: { id } });
      if (!evaluationPeriod) {
        throw new EvaluationPeriodNotFoundException(id);
      }

      evaluationPeriod.등급구간_설정한다(gradeRanges, setBy);
      return await repository.save(evaluationPeriod);
    }, '등급구간_설정한다');
  }

  /**
   * 점수에 해당하는 등급을 조회한다
   */
  async 점수로_등급_조회한다(
    id: string,
    score: number,
    manager?: EntityManager,
  ): Promise<ScoreGradeMapping | null> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationPeriod,
        this.evaluationPeriodRepository,
        manager,
      );

      const evaluationPeriod = await repository.findOne({ where: { id } });
      if (!evaluationPeriod) {
        throw new EvaluationPeriodNotFoundException(id);
      }

      return evaluationPeriod.점수로_등급_조회한다(score);
    }, '점수로_등급_조회한다');
  }

  /**
   * 평가 기간의 등급 구간 목록을 조회한다
   */
  async 등급구간_목록_조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<GradeRange[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationPeriod,
        this.evaluationPeriodRepository,
        manager,
      );

      const evaluationPeriod = await repository.findOne({ where: { id } });
      if (!evaluationPeriod) {
        throw new EvaluationPeriodNotFoundException(id);
      }

      return evaluationPeriod.gradeRanges || [];
    }, '등급구간_목록_조회한다');
  }

  /**
   * 특정 등급의 구간 정보를 조회한다
   */
  async 등급구간_조회한다(
    id: string,
    grade: GradeType,
    manager?: EntityManager,
  ): Promise<GradeRange | null> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationPeriod,
        this.evaluationPeriodRepository,
        manager,
      );

      const evaluationPeriod = await repository.findOne({ where: { id } });
      if (!evaluationPeriod) {
        throw new EvaluationPeriodNotFoundException(id);
      }

      return evaluationPeriod.등급구간_조회한다(grade);
    }, '등급구간_조회한다');
  }
}
