import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  EntityManager,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';
import { EvaluationPeriod } from './evaluation-period.entity';
import { IEvaluationPeriodService } from './interfaces/evaluation-period.service.interface';
import { IEvaluationPeriod } from './interfaces/evaluation-period.interface';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
  EvaluationPeriodFilter,
  EvaluationPeriodStatistics,
  CreateEvaluationPeriodDto,
  UpdateEvaluationPeriodDto,
} from './evaluation-period.types';
import {
  EvaluationPeriodNotFoundException,
  DuplicateEvaluationPeriodNameException,
  EvaluationPeriodDateOverlapException,
  ActiveEvaluationPeriodAlreadyExistsException,
  EvaluationPeriodBusinessRuleViolationException,
} from './evaluation-period.exceptions';

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
  ) {}

  /**
   * ID로 평가 기간을 조회한다
   */
  async ID로조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod | null> {
    const repository =
      manager?.getRepository(EvaluationPeriod) ??
      this.evaluationPeriodRepository;

    try {
      const evaluationPeriod = await repository.findOne({ where: { id } });
      return evaluationPeriod || null;
    } catch (error) {
      this.logger.error(`평가 기간 조회 실패 - ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * 이름으로 평가 기간을 조회한다
   */
  async 이름으로조회한다(
    name: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod | null> {
    const repository =
      manager?.getRepository(EvaluationPeriod) ??
      this.evaluationPeriodRepository;

    try {
      const evaluationPeriod = await repository.findOne({ where: { name } });
      return evaluationPeriod || null;
    } catch (error) {
      this.logger.error(`평가 기간 조회 실패 - 이름: ${name}`, error);
      throw error;
    }
  }

  /**
   * 모든 평가 기간을 조회한다
   */
  async 전체조회한다(manager?: EntityManager): Promise<IEvaluationPeriod[]> {
    const repository =
      manager?.getRepository(EvaluationPeriod) ??
      this.evaluationPeriodRepository;

    try {
      return await repository.find({
        order: { startDate: 'DESC' },
      });
    } catch (error) {
      this.logger.error('전체 평가 기간 조회 실패', error);
      throw error;
    }
  }

  /**
   * 상태별 평가 기간을 조회한다
   */
  async 상태별조회한다(
    status: EvaluationPeriodStatus,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod[]> {
    const repository =
      manager?.getRepository(EvaluationPeriod) ??
      this.evaluationPeriodRepository;

    try {
      return await repository.find({
        where: { status },
        order: { startDate: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`상태별 평가 기간 조회 실패 - 상태: ${status}`, error);
      throw error;
    }
  }

  /**
   * 단계별 평가 기간을 조회한다
   */
  async 단계별조회한다(
    phase: EvaluationPeriodPhase,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod[]> {
    const repository =
      manager?.getRepository(EvaluationPeriod) ??
      this.evaluationPeriodRepository;

    try {
      return await repository.find({
        where: { currentPhase: phase },
        order: { startDate: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`단계별 평가 기간 조회 실패 - 단계: ${phase}`, error);
      throw error;
    }
  }

  /**
   * 활성 평가 기간을 조회한다
   */
  async 활성평가기간조회한다(
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod[]> {
    const repository =
      manager?.getRepository(EvaluationPeriod) ??
      this.evaluationPeriodRepository;

    try {
      return await repository.find({
        where: [
          { status: EvaluationPeriodStatus.ACTIVE },
          { status: EvaluationPeriodStatus.CRITERIA_SETTING },
          { status: EvaluationPeriodStatus.PERFORMANCE_INPUT },
          { status: EvaluationPeriodStatus.FINAL_EVALUATION },
        ],
        order: { startDate: 'DESC' },
      });
    } catch (error) {
      this.logger.error('활성 평가 기간 조회 실패', error);
      throw error;
    }
  }

  /**
   * 완료된 평가 기간을 조회한다
   */
  async 완료평가기간조회한다(
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod[]> {
    const repository =
      manager?.getRepository(EvaluationPeriod) ??
      this.evaluationPeriodRepository;

    try {
      return await repository.find({
        where: { status: EvaluationPeriodStatus.COMPLETED },
        order: { completedDate: 'DESC' },
      });
    } catch (error) {
      this.logger.error('완료된 평가 기간 조회 실패', error);
      throw error;
    }
  }

  /**
   * 현재 진행중인 평가 기간을 조회한다
   */
  async 현재진행중평가기간조회한다(
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod | null> {
    const repository =
      manager?.getRepository(EvaluationPeriod) ??
      this.evaluationPeriodRepository;

    try {
      const now = new Date();
      const evaluationPeriod = await repository.findOne({
        where: [
          {
            status: EvaluationPeriodStatus.ACTIVE,
            startDate: LessThanOrEqual(now),
            endDate: MoreThanOrEqual(now),
          },
          {
            status: EvaluationPeriodStatus.CRITERIA_SETTING,
            startDate: LessThanOrEqual(now),
            endDate: MoreThanOrEqual(now),
          },
          {
            status: EvaluationPeriodStatus.PERFORMANCE_INPUT,
            startDate: LessThanOrEqual(now),
            endDate: MoreThanOrEqual(now),
          },
          {
            status: EvaluationPeriodStatus.FINAL_EVALUATION,
            startDate: LessThanOrEqual(now),
            endDate: MoreThanOrEqual(now),
          },
        ],
        order: { startDate: 'DESC' },
      });

      return evaluationPeriod || null;
    } catch (error) {
      this.logger.error('현재 진행중인 평가 기간 조회 실패', error);
      throw error;
    }
  }

  /**
   * 필터 조건으로 평가 기간을 조회한다
   */
  async 필터조회한다(
    filter: EvaluationPeriodFilter,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod[]> {
    const repository =
      manager?.getRepository(EvaluationPeriod) ??
      this.evaluationPeriodRepository;

    try {
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
        queryBuilder.andWhere('period.status IN (:...activeStatuses)', {
          activeStatuses: [
            EvaluationPeriodStatus.ACTIVE,
            EvaluationPeriodStatus.CRITERIA_SETTING,
            EvaluationPeriodStatus.PERFORMANCE_INPUT,
            EvaluationPeriodStatus.FINAL_EVALUATION,
          ],
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
    } catch (error) {
      this.logger.error('필터 조건 평가 기간 조회 실패', error);
      throw error;
    }
  }

  /**
   * 평가 기간을 생성한다
   */
  async 생성한다(
    createDto: CreateEvaluationPeriodDto,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod> {
    const repository =
      manager?.getRepository(EvaluationPeriod) ??
      this.evaluationPeriodRepository;

    try {
      // 이름 중복 확인
      const existingPeriod = await this.이름중복확인한다(
        createDto.name,
        undefined,
        manager,
      );
      if (existingPeriod) {
        throw new DuplicateEvaluationPeriodNameException(createDto.name);
      }

      // 기간 겹침 확인
      const hasOverlap = await this.기간겹침확인한다(
        createDto.startDate,
        createDto.endDate,
        undefined,
        manager,
      );
      if (hasOverlap) {
        throw new EvaluationPeriodDateOverlapException(
          createDto.startDate,
          createDto.endDate,
        );
      }

      const evaluationPeriod = repository.create({
        ...createDto,
        maxSelfEvaluationRate: createDto.maxSelfEvaluationRate ?? 120,
        createdBy,
        updatedBy: createdBy,
      });

      return await repository.save(evaluationPeriod);
    } catch (error) {
      this.logger.error('평가 기간 생성 실패', error);
      throw error;
    }
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
    const repository =
      manager?.getRepository(EvaluationPeriod) ??
      this.evaluationPeriodRepository;

    try {
      const evaluationPeriod = await repository.findOne({ where: { id } });
      if (!evaluationPeriod) {
        throw new EvaluationPeriodNotFoundException(id);
      }

      // 이름 중복 확인 (변경하는 경우)
      if (updateDto.name && updateDto.name !== evaluationPeriod.name) {
        const existingPeriod = await this.이름중복확인한다(
          updateDto.name,
          id,
          manager,
        );
        if (existingPeriod) {
          throw new DuplicateEvaluationPeriodNameException(updateDto.name);
        }
      }

      // 기간 겹침 확인 (날짜를 변경하는 경우)
      if (updateDto.startDate || updateDto.endDate) {
        const newStartDate = updateDto.startDate || evaluationPeriod.startDate;
        const newEndDate = updateDto.endDate || evaluationPeriod.endDate;

        const hasOverlap = await this.기간겹침확인한다(
          newStartDate,
          newEndDate,
          id,
          manager,
        );
        if (hasOverlap) {
          throw new EvaluationPeriodDateOverlapException(
            newStartDate,
            newEndDate,
          );
        }
      }

      Object.assign(evaluationPeriod, updateDto, { updatedBy });
      return await repository.save(evaluationPeriod);
    } catch (error) {
      this.logger.error(`평가 기간 업데이트 실패 - ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * 평가 기간을 삭제한다
   */
  async 삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository =
      manager?.getRepository(EvaluationPeriod) ??
      this.evaluationPeriodRepository;

    try {
      const evaluationPeriod = await repository.findOne({ where: { id } });
      if (!evaluationPeriod) {
        throw new EvaluationPeriodNotFoundException(id);
      }

      // 활성 상태인 평가 기간은 삭제할 수 없음
      if (evaluationPeriod.활성화됨()) {
        throw new EvaluationPeriodBusinessRuleViolationException(
          '활성 상태인 평가 기간은 삭제할 수 없습니다.',
        );
      }

      await repository.delete(id);
      this.logger.log(`평가 기간 삭제 완료 - ID: ${id}, 삭제자: ${deletedBy}`);
    } catch (error) {
      this.logger.error(`평가 기간 삭제 실패 - ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * 평가 기간을 시작한다
   */
  async 시작한다(
    id: string,
    startedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod> {
    const repository =
      manager?.getRepository(EvaluationPeriod) ??
      this.evaluationPeriodRepository;

    try {
      const evaluationPeriod = await repository.findOne({ where: { id } });
      if (!evaluationPeriod) {
        throw new EvaluationPeriodNotFoundException(id);
      }

      // 이미 활성 평가 기간이 있는지 확인
      const activePeriod = await this.현재진행중평가기간조회한다(manager);
      if (activePeriod && activePeriod.id !== id) {
        throw new ActiveEvaluationPeriodAlreadyExistsException(
          activePeriod.name,
        );
      }

      evaluationPeriod.평가기간시작한다(startedBy);
      return await repository.save(evaluationPeriod);
    } catch (error) {
      this.logger.error(`평가 기간 시작 실패 - ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * 평가 기간을 완료한다
   */
  async 완료한다(
    id: string,
    completedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod> {
    const repository =
      manager?.getRepository(EvaluationPeriod) ??
      this.evaluationPeriodRepository;

    try {
      const evaluationPeriod = await repository.findOne({ where: { id } });
      if (!evaluationPeriod) {
        throw new EvaluationPeriodNotFoundException(id);
      }

      evaluationPeriod.평가기간완료한다(completedBy);
      return await repository.save(evaluationPeriod);
    } catch (error) {
      this.logger.error(`평가 기간 완료 실패 - ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * 평가 기간 통계를 조회한다
   */
  async 통계조회한다(
    filter?: EvaluationPeriodFilter,
    manager?: EntityManager,
  ): Promise<EvaluationPeriodStatistics> {
    const repository =
      manager?.getRepository(EvaluationPeriod) ??
      this.evaluationPeriodRepository;

    try {
      let queryBuilder = repository.createQueryBuilder('period');

      // 필터 적용
      if (filter?.status) {
        queryBuilder.andWhere('period.status = :status', {
          status: filter.status,
        });
      }
      if (filter?.startDateFrom) {
        queryBuilder.andWhere('period.startDate >= :startDateFrom', {
          startDateFrom: filter.startDateFrom,
        });
      }
      if (filter?.endDateTo) {
        queryBuilder.andWhere('period.endDate <= :endDateTo', {
          endDateTo: filter.endDateTo,
        });
      }

      const periods = await queryBuilder.getMany();

      // 상태별 카운트
      const statusCounts = periods.reduce(
        (acc, period) => {
          acc[period.status] = (acc[period.status] || 0) + 1;
          return acc;
        },
        {} as Record<EvaluationPeriodStatus, number>,
      );

      // 자기평가 달성률 통계
      const rates = periods
        .map((p) => p.maxSelfEvaluationRate)
        .filter((rate) => rate > 0);
      const averageMaxSelfEvaluationRate =
        rates.length > 0
          ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length
          : 0;
      const highestMaxSelfEvaluationRate =
        rates.length > 0 ? Math.max(...rates) : 0;
      const lowestMaxSelfEvaluationRate =
        rates.length > 0 ? Math.min(...rates) : 0;

      return {
        totalPeriods: periods.length,
        statusCounts,
        activePeriods: periods.filter((p) => p.활성화됨()).length,
        completedPeriods: periods.filter((p) => p.완료됨()).length,
        inProgressPeriods: periods.filter((p) => p.활성화됨() && !p.완료됨())
          .length,
        averageMaxSelfEvaluationRate,
        highestMaxSelfEvaluationRate,
        lowestMaxSelfEvaluationRate,
      };
    } catch (error) {
      this.logger.error('평가 기간 통계 조회 실패', error);
      throw error;
    }
  }

  /**
   * 평가 기간 이름 중복을 확인한다
   */
  async 이름중복확인한다(
    name: string,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repository =
      manager?.getRepository(EvaluationPeriod) ??
      this.evaluationPeriodRepository;

    try {
      const queryBuilder = repository
        .createQueryBuilder('period')
        .where('period.name = :name', { name });

      if (excludeId) {
        queryBuilder.andWhere('period.id != :excludeId', { excludeId });
      }

      const count = await queryBuilder.getCount();
      return count > 0;
    } catch (error) {
      this.logger.error(`평가 기간 이름 중복 확인 실패 - 이름: ${name}`, error);
      throw error;
    }
  }

  /**
   * 기간 겹침을 확인한다
   */
  async 기간겹침확인한다(
    startDate: Date,
    endDate: Date,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repository =
      manager?.getRepository(EvaluationPeriod) ??
      this.evaluationPeriodRepository;

    try {
      const queryBuilder = repository
        .createQueryBuilder('period')
        .where(
          '(period.startDate <= :endDate AND period.endDate >= :startDate)',
          { startDate, endDate },
        );

      if (excludeId) {
        queryBuilder.andWhere('period.id != :excludeId', { excludeId });
      }

      const count = await queryBuilder.getCount();
      return count > 0;
    } catch (error) {
      this.logger.error('평가 기간 겹침 확인 실패', error);
      throw error;
    }
  }

  /**
   * 현재 날짜 기준 활성 평가 기간이 있는지 확인한다
   */
  async 활성평가기간존재확인한다(manager?: EntityManager): Promise<boolean> {
    try {
      const activePeriod = await this.현재진행중평가기간조회한다(manager);
      return activePeriod !== null;
    } catch (error) {
      this.logger.error('활성 평가 기간 존재 확인 실패', error);
      throw error;
    }
  }

  /**
   * 자기평가 달성률 최대값을 설정한다
   */
  async 자기평가달성률최대값설정한다(
    id: string,
    maxRate: number,
    setBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod> {
    const repository =
      manager?.getRepository(EvaluationPeriod) ??
      this.evaluationPeriodRepository;

    try {
      const evaluationPeriod = await repository.findOne({ where: { id } });
      if (!evaluationPeriod) {
        throw new EvaluationPeriodNotFoundException(id);
      }

      evaluationPeriod.자기평가달성률최대값설정한다(maxRate, setBy);
      return await repository.save(evaluationPeriod);
    } catch (error) {
      this.logger.error(`자기평가 달성률 최대값 설정 실패 - ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * 자기평가 달성률 최대값으로 평가 기간을 조회한다
   */
  async 자기평가달성률최대값별조회한다(
    minRate?: number,
    maxRate?: number,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod[]> {
    const repository =
      manager?.getRepository(EvaluationPeriod) ??
      this.evaluationPeriodRepository;

    try {
      const queryBuilder = repository.createQueryBuilder('period');

      if (minRate !== undefined) {
        queryBuilder.andWhere('period.maxSelfEvaluationRate >= :minRate', {
          minRate,
        });
      }

      if (maxRate !== undefined) {
        queryBuilder.andWhere('period.maxSelfEvaluationRate <= :maxRate', {
          maxRate,
        });
      }

      return await queryBuilder.orderBy('period.startDate', 'DESC').getMany();
    } catch (error) {
      this.logger.error('자기평가 달성률 최대값별 평가 기간 조회 실패', error);
      throw error;
    }
  }
}
