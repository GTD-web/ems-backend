import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { EvaluationWbsAssignmentValidationService } from './evaluation-wbs-assignment-validation.service';
import { EvaluationWbsAssignment } from './evaluation-wbs-assignment.entity';
import {
  EvaluationWbsAssignmentNotFoundException,
  EvaluationWbsAssignmentBusinessRuleViolationException,
} from './evaluation-wbs-assignment.exceptions';
import {
  CreateEvaluationWbsAssignmentData,
  UpdateEvaluationWbsAssignmentData,
  EvaluationWbsAssignmentFilter,
  EvaluationWbsAssignmentStatistics,
  EmployeeWbsAssignmentSummary,
  ProjectWbsAssignmentSummary,
} from './evaluation-wbs-assignment.types';
import { IEvaluationWbsAssignment } from './interfaces/evaluation-wbs-assignment.interface';
import { IEvaluationWbsAssignmentService } from './interfaces/evaluation-wbs-assignment.service.interface';

/**
 * 평가 WBS 할당 서비스
 * 평가 WBS 할당의 CRUD 및 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class EvaluationWbsAssignmentService
  implements IEvaluationWbsAssignmentService
{
  private readonly logger = new Logger(EvaluationWbsAssignmentService.name);

  constructor(
    @InjectRepository(EvaluationWbsAssignment)
    private readonly evaluationWbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly transactionManager: TransactionManagerService,
    private readonly validationService: EvaluationWbsAssignmentValidationService,
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
   * ID로 평가 WBS 할당을 조회한다
   */
  async ID로_조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment | null> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      const assignment = await repository.findOne({ where: { id } });
      return assignment || null;
    }, 'ID로_조회한다');
  }

  /**
   * 모든 평가 WBS 할당을 조회한다
   */
  async 전체_조회한다(
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      return await repository.find({
        order: { assignedDate: 'DESC' },
      });
    }, '전체_조회한다');
  }

  /**
   * 평가기간별 할당을 조회한다
   */
  async 평가기간별_조회한다(
    periodId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      return await repository.find({
        where: { periodId },
        order: { assignedDate: 'DESC' },
      });
    }, '평가기간별_조회한다');
  }

  /**
   * 직원별 할당을 조회한다
   */
  async 직원별_조회한다(
    employeeId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      return await repository.find({
        where: { employeeId },
        order: { assignedDate: 'DESC' },
      });
    }, '직원별_조회한다');
  }

  /**
   * 프로젝트별 할당을 조회한다
   */
  async 프로젝트별_조회한다(
    projectId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      return await repository.find({
        where: { projectId },
        order: { assignedDate: 'DESC' },
      });
    }, '프로젝트별_조회한다');
  }

  /**
   * WBS 항목별 할당을 조회한다
   */
  async WBS항목별_조회한다(
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      return await repository.find({
        where: { wbsItemId },
        order: { assignedDate: 'DESC' },
      });
    }, 'WBS항목별_조회한다');
  }

  /**
   * 특정 평가기간의 직원별 할당을 조회한다
   */
  async 평가기간_직원별_조회한다(
    periodId: string,
    employeeId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      return await repository.find({
        where: { periodId, employeeId },
        order: { assignedDate: 'DESC' },
      });
    }, '평가기간_직원별_조회한다');
  }

  /**
   * 특정 프로젝트의 WBS 할당을 조회한다
   */
  async 프로젝트_WBS별_조회한다(
    projectId: string,
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      return await repository.find({
        where: { projectId, wbsItemId },
        order: { assignedDate: 'DESC' },
      });
    }, '프로젝트_WBS별_조회한다');
  }

  /**
   * 필터 조건으로 할당을 조회한다
   */
  async 필터_조회한다(
    filter: EvaluationWbsAssignmentFilter,
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      const queryBuilder = repository.createQueryBuilder('assignment');

      if (filter.periodId) {
        queryBuilder.andWhere('assignment.periodId = :periodId', {
          periodId: filter.periodId,
        });
      }

      if (filter.employeeId) {
        queryBuilder.andWhere('assignment.employeeId = :employeeId', {
          employeeId: filter.employeeId,
        });
      }

      if (filter.projectId) {
        queryBuilder.andWhere('assignment.projectId = :projectId', {
          projectId: filter.projectId,
        });
      }

      if (filter.wbsItemId) {
        queryBuilder.andWhere('assignment.wbsItemId = :wbsItemId', {
          wbsItemId: filter.wbsItemId,
        });
      }

      if (filter.assignedBy) {
        queryBuilder.andWhere('assignment.assignedBy = :assignedBy', {
          assignedBy: filter.assignedBy,
        });
      }

      if (filter.assignedDateFrom) {
        queryBuilder.andWhere('assignment.assignedDate >= :assignedDateFrom', {
          assignedDateFrom: filter.assignedDateFrom,
        });
      }

      if (filter.assignedDateTo) {
        queryBuilder.andWhere('assignment.assignedDate <= :assignedDateTo', {
          assignedDateTo: filter.assignedDateTo,
        });
      }

      return await queryBuilder
        .orderBy('assignment.assignedDate', 'DESC')
        .getMany();
    }, '필터_조회한다');
  }

  /**
   * 평가 WBS 할당을 생성한다
   */
  async 생성한다(
    createData: CreateEvaluationWbsAssignmentData,
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment> {
    return this.executeSafeDomainOperation(async () => {
      const entityManager = manager || this.dataSource.manager;

      // 도메인 비즈니스 규칙 검증 (Domain Service 레벨)
      await this.validationService.할당생성비즈니스규칙검증한다(
        createData,
        entityManager,
      );

      // 엔티티 생성 (불변성 검증 자동 실행)
      const assignment = new EvaluationWbsAssignment(createData);

      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        entityManager,
      );

      const savedAssignment = await repository.save(assignment);
      this.logger.log(`평가 WBS 할당 생성 완료 - ID: ${savedAssignment.id}`);

      return savedAssignment;
    }, '생성한다');
  }

  /**
   * 평가 WBS 할당을 업데이트한다
   */
  async 업데이트한다(
    id: string,
    updateData: UpdateEvaluationWbsAssignmentData,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment> {
    return this.executeSafeDomainOperation(async () => {
      const entityManager = manager || this.dataSource.manager;
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        entityManager,
      );

      const assignment = await repository.findOne({ where: { id } });
      if (!assignment) {
        throw new EvaluationWbsAssignmentNotFoundException(id);
      }

      // 도메인 비즈니스 규칙 검증 (Domain Service 레벨)
      await this.validationService.할당업데이트비즈니스규칙검증한다(
        id,
        updateData,
        entityManager,
      );

      // 엔티티 업데이트 (불변성 검증 자동 실행)
      Object.assign(assignment, updateData, {
        updatedBy,
        updatedAt: new Date(),
      });

      const savedAssignment = await repository.save(assignment);
      this.logger.log(
        `평가 WBS 할당 업데이트 완료 - ID: ${id}, 업데이트자: ${updatedBy}`,
      );

      return savedAssignment;
    }, '업데이트한다');
  }

  /**
   * 평가 WBS 할당을 삭제한다
   */
  async 삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      const assignment = await repository.findOne({ where: { id } });
      if (!assignment) {
        throw new EvaluationWbsAssignmentNotFoundException(id);
      }

      // 도메인 비즈니스 규칙 검증 (Domain Service 레벨)
      await this.validationService.할당삭제비즈니스규칙검증한다(assignment);

      await repository.delete(id);
      this.logger.log(
        `평가 WBS 할당 삭제 완료 - ID: ${id}, 삭제자: ${deletedBy}`,
      );
    }, '삭제한다');
  }

  /**
   * 특정 할당이 존재하는지 확인한다
   */
  async 할당_존재_확인한다(
    periodId: string,
    employeeId: string,
    projectId: string,
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      const count = await repository.count({
        where: { periodId, employeeId, projectId, wbsItemId },
      });

      return count > 0;
    }, '할당_존재_확인한다');
  }

  /**
   * 평가기간의 모든 할당을 삭제한다
   */
  async 평가기간_할당_전체삭제한다(
    periodId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      const assignments = await repository.find({ where: { periodId } });

      // 각 할당에 대해 비즈니스 규칙 검증
      for (const assignment of assignments) {
        await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
      }

      await repository.delete({ periodId });
      this.logger.log(
        `평가기간 WBS 할당 전체 삭제 완료 - 평가기간 ID: ${periodId}, 삭제자: ${deletedBy}`,
      );
    }, '평가기간_할당_전체삭제한다');
  }

  /**
   * 직원의 모든 할당을 삭제한다
   */
  async 직원_할당_전체삭제한다(
    employeeId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      const assignments = await repository.find({ where: { employeeId } });

      // 각 할당에 대해 비즈니스 규칙 검증
      for (const assignment of assignments) {
        await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
      }

      await repository.delete({ employeeId });
      this.logger.log(
        `직원 WBS 할당 전체 삭제 완료 - 직원 ID: ${employeeId}, 삭제자: ${deletedBy}`,
      );
    }, '직원_할당_전체삭제한다');
  }

  /**
   * 프로젝트의 모든 할당을 삭제한다
   */
  async 프로젝트_할당_전체삭제한다(
    projectId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      const assignments = await repository.find({ where: { projectId } });

      // 각 할당에 대해 비즈니스 규칙 검증
      for (const assignment of assignments) {
        await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
      }

      await repository.delete({ projectId });
      this.logger.log(
        `프로젝트 WBS 할당 전체 삭제 완료 - 프로젝트 ID: ${projectId}, 삭제자: ${deletedBy}`,
      );
    }, '프로젝트_할당_전체삭제한다');
  }

  /**
   * WBS 항목의 모든 할당을 삭제한다
   */
  async WBS항목_할당_전체삭제한다(
    wbsItemId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      const assignments = await repository.find({ where: { wbsItemId } });

      // 각 할당에 대해 비즈니스 규칙 검증
      for (const assignment of assignments) {
        await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
      }

      await repository.delete({ wbsItemId });
      this.logger.log(
        `WBS 항목 할당 전체 삭제 완료 - WBS 항목 ID: ${wbsItemId}, 삭제자: ${deletedBy}`,
      );
    }, 'WBS항목_할당_전체삭제한다');
  }

  /**
   * 할당 통계를 조회한다
   */
  async 통계_조회한다(
    filter?: EvaluationWbsAssignmentFilter,
    manager?: EntityManager,
  ): Promise<EvaluationWbsAssignmentStatistics> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      let queryBuilder = repository.createQueryBuilder('assignment');

      // 필터 적용
      if (filter) {
        if (filter.periodId) {
          queryBuilder.andWhere('assignment.periodId = :periodId', {
            periodId: filter.periodId,
          });
        }

        if (filter.employeeId) {
          queryBuilder.andWhere('assignment.employeeId = :employeeId', {
            employeeId: filter.employeeId,
          });
        }

        if (filter.projectId) {
          queryBuilder.andWhere('assignment.projectId = :projectId', {
            projectId: filter.projectId,
          });
        }

        if (filter.wbsItemId) {
          queryBuilder.andWhere('assignment.wbsItemId = :wbsItemId', {
            wbsItemId: filter.wbsItemId,
          });
        }

        if (filter.assignedDateFrom) {
          queryBuilder.andWhere(
            'assignment.assignedDate >= :assignedDateFrom',
            {
              assignedDateFrom: filter.assignedDateFrom,
            },
          );
        }

        if (filter.assignedDateTo) {
          queryBuilder.andWhere('assignment.assignedDate <= :assignedDateTo', {
            assignedDateTo: filter.assignedDateTo,
          });
        }
      }

      // 전체 할당 수
      const totalAssignments = await queryBuilder.getCount();

      // 평가기간별 할당 수
      const periodStats = await repository
        .createQueryBuilder('assignment')
        .select('assignment.periodId', 'periodId')
        .addSelect('COUNT(*)', 'count')
        .groupBy('assignment.periodId')
        .getRawMany();

      const assignmentsByPeriod: Record<string, number> = {};
      periodStats.forEach((stat) => {
        assignmentsByPeriod[stat.periodId] = parseInt(stat.count, 10);
      });

      // 직원별 할당 수
      const employeeStats = await repository
        .createQueryBuilder('assignment')
        .select('assignment.employeeId', 'employeeId')
        .addSelect('COUNT(*)', 'count')
        .groupBy('assignment.employeeId')
        .getRawMany();

      const assignmentsByEmployee: Record<string, number> = {};
      employeeStats.forEach((stat) => {
        assignmentsByEmployee[stat.employeeId] = parseInt(stat.count, 10);
      });

      // 프로젝트별 할당 수
      const projectStats = await repository
        .createQueryBuilder('assignment')
        .select('assignment.projectId', 'projectId')
        .addSelect('COUNT(*)', 'count')
        .groupBy('assignment.projectId')
        .getRawMany();

      const assignmentsByProject: Record<string, number> = {};
      projectStats.forEach((stat) => {
        assignmentsByProject[stat.projectId] = parseInt(stat.count, 10);
      });

      return {
        totalAssignments,
        assignmentsByPeriod,
        assignmentsByEmployee,
        assignmentsByProject,
      };
    }, '통계_조회한다');
  }

  /**
   * 직원별 WBS 할당 요약을 조회한다
   */
  async 직원별_할당요약_조회한다(
    periodId?: string,
    manager?: EntityManager,
  ): Promise<EmployeeWbsAssignmentSummary[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      let queryBuilder = repository
        .createQueryBuilder('assignment')
        .select('assignment.employeeId', 'employeeId')
        .addSelect('COUNT(*)', 'totalAssignments')
        .groupBy('assignment.employeeId');

      if (periodId) {
        queryBuilder.andWhere('assignment.periodId = :periodId', { periodId });
      }

      const results = await queryBuilder.getRawMany();

      return results.map((result) => ({
        employeeId: result.employeeId,
        totalAssignments: parseInt(result.totalAssignments, 10),
      }));
    }, '직원별_할당요약_조회한다');
  }

  /**
   * 프로젝트별 WBS 할당 요약을 조회한다
   */
  async 프로젝트별_할당요약_조회한다(
    periodId?: string,
    manager?: EntityManager,
  ): Promise<ProjectWbsAssignmentSummary[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      let queryBuilder = repository
        .createQueryBuilder('assignment')
        .select('assignment.projectId', 'projectId')
        .addSelect('COUNT(*)', 'totalAssignments')
        .addSelect('COUNT(DISTINCT assignment.employeeId)', 'participantCount')
        .groupBy('assignment.projectId');

      if (periodId) {
        queryBuilder.andWhere('assignment.periodId = :periodId', { periodId });
      }

      const results = await queryBuilder.getRawMany();

      return results.map((result) => ({
        projectId: result.projectId,
        totalAssignments: parseInt(result.totalAssignments, 10),
        participantCount: parseInt(result.participantCount, 10),
      }));
    }, '프로젝트별_할당요약_조회한다');
  }
}
