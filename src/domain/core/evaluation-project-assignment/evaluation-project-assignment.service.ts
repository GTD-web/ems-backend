import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { EvaluationProjectAssignmentValidationService } from './evaluation-project-assignment-validation.service';
import { EvaluationProjectAssignment } from './evaluation-project-assignment.entity';
import { EvaluationProjectAssignmentNotFoundException } from './evaluation-project-assignment.exceptions';
import {
  CreateEvaluationProjectAssignmentData,
  UpdateEvaluationProjectAssignmentData,
  EvaluationProjectAssignmentFilter,
  EvaluationProjectAssignmentStatistics,
} from './evaluation-project-assignment.types';
import { IEvaluationProjectAssignment } from './interfaces/evaluation-project-assignment.interface';
import { IEvaluationProjectAssignmentService } from './interfaces/evaluation-project-assignment.service.interface';

/**
 * 평가 프로젝트 할당 서비스
 * 평가 프로젝트 할당의 CRUD 및 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class EvaluationProjectAssignmentService
  implements IEvaluationProjectAssignmentService
{
  private readonly logger = new Logger(EvaluationProjectAssignmentService.name);

  constructor(
    @InjectRepository(EvaluationProjectAssignment)
    private readonly evaluationProjectAssignmentRepository: Repository<EvaluationProjectAssignment>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly transactionManager: TransactionManagerService,
    private readonly validationService: EvaluationProjectAssignmentValidationService,
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
   * ID로 평가 프로젝트 할당을 조회한다
   */
  async ID로_조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment | null> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
        manager,
      );

      const assignment = await repository.findOne({ where: { id } });
      return assignment || null;
    }, 'ID로_조회한다');
  }

  /**
   * 모든 평가 프로젝트 할당을 조회한다
   */
  async 전체_조회한다(
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
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
  ): Promise<IEvaluationProjectAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
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
  ): Promise<IEvaluationProjectAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
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
  ): Promise<IEvaluationProjectAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
        manager,
      );

      return await repository.find({
        where: { projectId },
        order: { assignedDate: 'DESC' },
      });
    }, '프로젝트별_조회한다');
  }

  /**
   * 특정 평가기간의 직원별 할당을 조회한다
   */
  async 평가기간_직원별_조회한다(
    periodId: string,
    employeeId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
        manager,
      );

      return await repository.find({
        where: { periodId, employeeId },
        order: { assignedDate: 'DESC' },
      });
    }, '평가기간_직원별_조회한다');
  }

  /**
   * 필터 조건으로 할당을 조회한다
   */
  async 필터_조회한다(
    filter: EvaluationProjectAssignmentFilter,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
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
   * 평가 프로젝트 할당을 생성한다
   */
  async 생성한다(
    createData: CreateEvaluationProjectAssignmentData,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment> {
    return this.executeSafeDomainOperation(async () => {
      const entityManager = manager || this.dataSource.manager;

      // 도메인 비즈니스 규칙 검증 (Domain Service 레벨)
      await this.validationService.할당생성비즈니스규칙검증한다(
        createData,
        entityManager,
      );

      // 엔티티 생성 (불변성 검증 자동 실행)
      const assignment = new EvaluationProjectAssignment(createData);

      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
        entityManager,
      );

      const savedAssignment = await repository.save(assignment);
      this.logger.log(
        `평가 프로젝트 할당 생성 완료 - ID: ${savedAssignment.id}`,
      );

      return savedAssignment;
    }, '생성한다');
  }

  /**
   * 평가 프로젝트 할당을 업데이트한다
   */
  async 업데이트한다(
    id: string,
    updateData: UpdateEvaluationProjectAssignmentData,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment> {
    return this.executeSafeDomainOperation(async () => {
      const entityManager = manager || this.dataSource.manager;
      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
        entityManager,
      );

      const assignment = await repository.findOne({ where: { id } });
      if (!assignment) {
        throw new EvaluationProjectAssignmentNotFoundException(id);
      }

      // 도메인 비즈니스 규칙 검증 (Domain Service 레벨)
      await this.validationService.할당업데이트비즈니스규칙검증한다(
        id,
        updateData,
        entityManager,
      );

      // 엔티티 업데이트 (undefined 값 제외하고 실제 변경된 값만 할당)
      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined),
      );
      Object.assign(assignment, filteredUpdateData, {
        updatedBy,
        updatedAt: new Date(),
      });

      const savedAssignment = await repository.save(assignment);
      this.logger.log(
        `평가 프로젝트 할당 업데이트 완료 - ID: ${id}, 업데이트자: ${updatedBy}`,
      );

      return savedAssignment;
    }, '업데이트한다');
  }

  /**
   * 평가 프로젝트 할당을 삭제한다
   */
  async 삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
        manager,
      );

      const assignment = await repository.findOne({ where: { id } });
      if (!assignment) {
        throw new EvaluationProjectAssignmentNotFoundException(id);
      }

      // 도메인 비즈니스 규칙 검증 (Domain Service 레벨)
      await this.validationService.할당삭제비즈니스규칙검증한다(assignment);

      await repository.delete(id);
      this.logger.log(
        `평가 프로젝트 할당 삭제 완료 - ID: ${id}, 삭제자: ${deletedBy}`,
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
    manager?: EntityManager,
  ): Promise<boolean> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
        manager,
      );

      const count = await repository.count({
        where: { periodId, employeeId, projectId },
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
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
        manager,
      );

      const assignments = await repository.find({ where: { periodId } });

      // 각 할당에 대해 비즈니스 규칙 검증
      for (const assignment of assignments) {
        await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
      }

      await repository.delete({ periodId });
      this.logger.log(
        `평가기간 할당 전체 삭제 완료 - 평가기간 ID: ${periodId}, 삭제자: ${deletedBy}`,
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
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
        manager,
      );

      const assignments = await repository.find({ where: { employeeId } });

      // 각 할당에 대해 비즈니스 규칙 검증
      for (const assignment of assignments) {
        await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
      }

      await repository.delete({ employeeId });
      this.logger.log(
        `직원 할당 전체 삭제 완료 - 직원 ID: ${employeeId}, 삭제자: ${deletedBy}`,
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
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
        manager,
      );

      const assignments = await repository.find({ where: { projectId } });

      // 각 할당에 대해 비즈니스 규칙 검증
      for (const assignment of assignments) {
        await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
      }

      await repository.delete({ projectId });
      this.logger.log(
        `프로젝트 할당 전체 삭제 완료 - 프로젝트 ID: ${projectId}, 삭제자: ${deletedBy}`,
      );
    }, '프로젝트_할당_전체삭제한다');
  }

  /**
   * 할당 통계를 조회한다
   */
  async 통계_조회한다(
    filter?: EvaluationProjectAssignmentFilter,
    manager?: EntityManager,
  ): Promise<EvaluationProjectAssignmentStatistics> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
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
}
