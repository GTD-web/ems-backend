import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';

/**
 * WBS 할당 가중치 계산 서비스
 *
 * 직원별 WBS 할당의 가중치를 중요도 기반으로 자동 계산합니다.
 * - 총 가중치 합계: 100
 * - 계산 기준: WBS 평가기준의 중요도 (1~10)
 */
@Injectable()
export class WbsAssignmentWeightCalculationService {
  private readonly logger = new Logger(
    WbsAssignmentWeightCalculationService.name,
  );

  constructor(
    @InjectRepository(EvaluationWbsAssignment)
    private readonly assignmentRepository: Repository<EvaluationWbsAssignment>,
    @InjectRepository(WbsEvaluationCriteria)
    private readonly criteriaRepository: Repository<WbsEvaluationCriteria>,
  ) {}

  /**
   * 직원의 특정 평가기간 WBS 할당 가중치를 재계산한다
   * - 중요도 기반으로 가중치를 자동 계산 (총합 100)
   * - 평가기준이 없거나 중요도가 0인 경우 제외
   * - 모든 WBS의 평가기준이 없으면 가중치는 0으로 설정
   */
  async 직원_평가기간_가중치를_재계산한다(
    employeeId: string,
    periodId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = manager
      ? manager.getRepository(EvaluationWbsAssignment)
      : this.assignmentRepository;

    const criteriaRepository = manager
      ? manager.getRepository(WbsEvaluationCriteria)
      : this.criteriaRepository;

    // 1. 해당 직원의 평가기간 WBS 할당 조회
    const assignments = await repository.find({
      where: {
        employeeId,
        periodId,
      },
    });

    if (assignments.length === 0) {
      this.logger.log(
        `가중치 재계산: 할당이 없습니다 - 직원: ${employeeId}, 기간: ${periodId}`,
      );
      return;
    }

    // 2. 각 WBS의 평가기준 중요도 조회
    const wbsItemIds = assignments.map((a) => a.wbsItemId);
    const criteriaList = await criteriaRepository
      .createQueryBuilder('criteria')
      .where('criteria.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
      .andWhere('criteria.deletedAt IS NULL')
      .getMany();

    console.log(
      `[DEBUG 가중치 계산] 직원: ${employeeId}, WBS 수: ${assignments.length}, 평가기준 수: ${criteriaList.length}`,
    );
    if (criteriaList.length > 0) {
      console.log(
        `[DEBUG 평가기준 샘플]`,
        criteriaList.slice(0, 3).map((c) => ({
          wbsItemId: c.wbsItemId,
          importance: c.importance,
        })),
      );
    }

    // 3. WBS별 중요도 맵 생성 (여러 평가기준의 중요도 합계)
    const importanceMap = new Map<string, number>();
    criteriaList.forEach((criteria) => {
      const currentImportance = importanceMap.get(criteria.wbsItemId) || 0;
      importanceMap.set(
        criteria.wbsItemId,
        currentImportance + criteria.importance,
      );
    });

    // 4. 총 중요도 합계 계산 (중요도가 있는 WBS만)
    let totalImportance = 0;
    const assignmentsWithImportance: {
      assignment: EvaluationWbsAssignment;
      importance: number;
    }[] = [];

    assignments.forEach((assignment) => {
      const importance = importanceMap.get(assignment.wbsItemId) || 0;
      if (importance > 0) {
        totalImportance += importance;
        assignmentsWithImportance.push({ assignment, importance });
      }
    });

    // 5. 가중치 계산 및 업데이트
    if (totalImportance === 0) {
      // 모든 WBS의 평가기준이 없거나 중요도가 0이면 모든 가중치를 0으로 설정
      this.logger.warn(
        `가중치 재계산: 총 중요도가 0입니다 - 직원: ${employeeId}, 기간: ${periodId}`,
      );
      for (const assignment of assignments) {
        assignment.가중치를_설정한다(0);
      }
    } else {
      // 중요도 기반 가중치 계산
      const weights: number[] = [];
      let sumWeights = 0;

      for (let i = 0; i < assignmentsWithImportance.length; i++) {
        const { importance } = assignmentsWithImportance[i];
        const weight =
          i === assignmentsWithImportance.length - 1
            ? 100 - sumWeights // 마지막 항목은 100에서 나머지를 뺀 값 (반올림 오차 보정)
            : Math.round((importance / totalImportance) * 100 * 100) / 100; // 소수점 2자리
        weights.push(weight);
        sumWeights += weight;
      }

      // 가중치 설정
      for (let i = 0; i < assignmentsWithImportance.length; i++) {
        const { assignment } = assignmentsWithImportance[i];
        assignment.가중치를_설정한다(weights[i]);
      }

      // 중요도가 0인 할당은 가중치 0으로 설정
      for (const assignment of assignments) {
        const importance = importanceMap.get(assignment.wbsItemId) || 0;
        if (importance === 0) {
          assignment.가중치를_설정한다(0);
        }
      }
    }

    // 6. 저장 - 각 할당마다 개별 업데이트
    for (const assignment of assignments) {
      const result = await repository
        .createQueryBuilder()
        .update()
        .set({ weight: assignment.weight })
        .where('id = :id', { id: assignment.id })
        .execute();
      
      console.log(
        `[DEBUG 가중치 저장] ID: ${assignment.id}, weight: ${assignment.weight}, affected: ${result.affected}`,
      );
    }

    // 저장 후 DB에서 다시 조회하여 확인
    const savedAssignments = await repository.find({
      where: {
        employeeId,
        periodId,
      },
    });
    const savedWeights = savedAssignments.map((a) => a.weight);
    console.log(`[DEBUG DB 조회 후 가중치] [${savedWeights.join(', ')}]`);

    // 저장 후 weight 값 로그
    const weights = assignments.map((a) => a.weight);
    this.logger.log(
      `가중치 재계산 완료 - 직원: ${employeeId}, 기간: ${periodId}, ` +
        `할당 수: ${assignments.length}, 총 중요도: ${totalImportance}, ` +
        `가중치: [${weights.join(', ')}]`,
    );
  }

  /**
   * 특정 WBS가 할당된 모든 직원의 가중치를 재계산한다
   * - WBS 평가기준 생성/수정/삭제 시 호출
   */
  async WBS별_할당된_직원_가중치를_재계산한다(
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = manager
      ? manager.getRepository(EvaluationWbsAssignment)
      : this.assignmentRepository;

    // 해당 WBS가 할당된 모든 직원-기간 조합 조회
    const assignments = await repository
      .createQueryBuilder('assignment')
      .select('assignment.employeeId', 'employeeId')
      .addSelect('assignment.periodId', 'periodId')
      .where('assignment.wbsItemId = :wbsItemId', { wbsItemId })
      .andWhere('assignment.deletedAt IS NULL')
      .distinct(true)
      .getRawMany();

    this.logger.log(
      `WBS별 가중치 재계산 시작 - WBS: ${wbsItemId}, ` +
        `영향받는 직원-기간 조합: ${assignments.length}`,
    );

    // 각 직원-기간 조합에 대해 가중치 재계산
    for (const { employeeId, periodId } of assignments) {
      await this.직원_평가기간_가중치를_재계산한다(
        employeeId,
        periodId,
        manager,
      );
    }

    this.logger.log(`WBS별 가중치 재계산 완료 - WBS: ${wbsItemId}`);
  }
}
