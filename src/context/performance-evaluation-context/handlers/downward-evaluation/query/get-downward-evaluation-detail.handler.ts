import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluationNotFoundException } from '@domain/core/downward-evaluation/downward-evaluation.exceptions';

/**
 * 하향평가 상세정보 조회 쿼리
 */
export class GetDownwardEvaluationDetailQuery {
  constructor(public readonly evaluationId: string) {}
}

/**
 * 하향평가 상세정보 조회 결과
 */
export interface DownwardEvaluationDetailResult {
  // 평가 기본 정보
  id: string;
  evaluationDate: Date;
  downwardEvaluationContent: string | null;
  downwardEvaluationScore: number | null;
  evaluationType: string;
  isCompleted: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
  version: number;

  // 관련 엔티티 정보
  employee: {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentId: string;
    status: string;
  } | null;

  evaluator: {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentId: string;
    status: string;
  } | null;

  wbsItem: {
    id: string;
    title: string;
    wbsCode: string;
  } | null;

  period: {
    id: string;
    name: string;
    startDate: Date;
    status: string;
  } | null;

  selfEvaluation: {
    id: string;
    wbsItemId: string;
    performanceResult: string | null;
    selfEvaluationContent: string | null;
    selfEvaluationScore: number | null;
    isCompleted: boolean;
    completedAt: Date | null;
    evaluationDate: Date;
  } | null;
}

/**
 * 하향평가 상세정보 조회 핸들러
 */
@Injectable()
@QueryHandler(GetDownwardEvaluationDetailQuery)
export class GetDownwardEvaluationDetailHandler
  implements IQueryHandler<GetDownwardEvaluationDetailQuery>
{
  private readonly logger = new Logger(GetDownwardEvaluationDetailHandler.name);

  constructor(
    @InjectRepository(DownwardEvaluation)
    private readonly downwardEvaluationRepository: Repository<DownwardEvaluation>,
  ) {}

  async execute(
    query: GetDownwardEvaluationDetailQuery,
  ): Promise<DownwardEvaluationDetailResult> {
    const { evaluationId } = query;

    this.logger.log('하향평가 상세정보 조회 핸들러 실행', { evaluationId });

    // 하향평가 상세정보 조회 (관련 엔티티 JOIN)
    const result = await this.downwardEvaluationRepository
      .createQueryBuilder('evaluation')
      .leftJoin(
        Employee,
        'employee',
        'employee.id = evaluation.employeeId AND employee.deletedAt IS NULL',
      )
      .leftJoin(
        Employee,
        'evaluator',
        'evaluator.id = evaluation.evaluatorId AND evaluator.deletedAt IS NULL',
      )
      .leftJoin(
        WbsItem,
        'wbsItem',
        'wbsItem.id = evaluation.wbsId AND wbsItem.deletedAt IS NULL',
      )
      .leftJoin(
        EvaluationPeriod,
        'period',
        'period.id = evaluation.periodId AND period.deletedAt IS NULL',
      )
      .leftJoin(
        WbsSelfEvaluation,
        'selfEvaluation',
        'selfEvaluation.id = evaluation.selfEvaluationId AND selfEvaluation.deletedAt IS NULL',
      )
      .select([
        // 평가 정보
        'evaluation.id AS evaluation_id',
        'evaluation.employeeId AS evaluation_employeeid',
        'evaluation.evaluatorId AS evaluation_evaluatorid',
        'evaluation.wbsId AS evaluation_wbsid',
        'evaluation.periodId AS evaluation_periodid',
        'evaluation.selfEvaluationId AS evaluation_selfevaluationid',
        'evaluation.evaluationDate AS evaluation_evaluationdate',
        'evaluation.downwardEvaluationContent AS evaluation_downwardevaluationcontent',
        'evaluation.downwardEvaluationScore AS evaluation_downwardevaluationscore',
        'evaluation.evaluationType AS evaluation_evaluationtype',
        'evaluation.isCompleted AS evaluation_iscompleted',
        'evaluation.completedAt AS evaluation_completedat',
        'evaluation.createdAt AS evaluation_createdat',
        'evaluation.updatedAt AS evaluation_updatedat',
        'evaluation.deletedAt AS evaluation_deletedat',
        'evaluation.createdBy AS evaluation_createdby',
        'evaluation.updatedBy AS evaluation_updatedby',
        'evaluation.version AS evaluation_version',
        // 피평가자 정보
        'employee.id AS employee_id',
        'employee.name AS employee_name',
        'employee.employeeNumber AS employee_employeenumber',
        'employee.email AS employee_email',
        'employee.departmentId AS employee_departmentid',
        'employee.status AS employee_status',
        // 평가자 정보
        'evaluator.id AS evaluator_id',
        'evaluator.name AS evaluator_name',
        'evaluator.employeeNumber AS evaluator_employeenumber',
        'evaluator.email AS evaluator_email',
        'evaluator.departmentId AS evaluator_departmentid',
        'evaluator.status AS evaluator_status',
        // WBS 정보
        'wbsItem.id AS wbsitem_id',
        'wbsItem.title AS wbsitem_title',
        'wbsItem.wbsCode AS wbsitem_wbscode',
        // 평가기간 정보
        'period.id AS period_id',
        'period.name AS period_name',
        'period.startDate AS period_startdate',
        'period.status AS period_status',
        // 자기평가 정보
        'selfEvaluation.id AS selfevaluation_id',
        'selfEvaluation.wbsItemId AS selfevaluation_wbsitemid',
        'selfEvaluation.performanceResult AS selfevaluation_performanceresult',
        'selfEvaluation.selfEvaluationContent AS selfevaluation_selfevaluationcontent',
        'selfEvaluation.selfEvaluationScore AS selfevaluation_selfevaluationscore',
        'selfEvaluation.isCompleted AS selfevaluation_iscompleted',
        'selfEvaluation.completedAt AS selfevaluation_completedat',
        'selfEvaluation.evaluationDate AS selfevaluation_evaluationdate',
      ])
      .where('evaluation.id = :evaluationId', { evaluationId })
      .andWhere('evaluation.deletedAt IS NULL')
      .getRawOne();

    if (!result) {
      throw new DownwardEvaluationNotFoundException(evaluationId);
    }

    this.logger.log('하향평가 상세정보 조회 완료', { evaluationId });

    return {
      id: result.evaluation_id,
      evaluationDate: result.evaluation_evaluationdate,
      downwardEvaluationContent: result.evaluation_downwardevaluationcontent,
      downwardEvaluationScore: result.evaluation_downwardevaluationscore,
      evaluationType: result.evaluation_evaluationtype,
      isCompleted: result.evaluation_iscompleted,
      completedAt: result.evaluation_completedat,
      createdAt: result.evaluation_createdat,
      updatedAt: result.evaluation_updatedat,
      deletedAt: result.evaluation_deletedat,
      createdBy: result.evaluation_createdby,
      updatedBy: result.evaluation_updatedby,
      version: result.evaluation_version,

      employee: result.employee_id
        ? {
            id: result.employee_id,
            name: result.employee_name,
            employeeNumber: result.employee_employeenumber,
            email: result.employee_email,
            departmentId: result.employee_departmentid,
            status: result.employee_status,
          }
        : null,

      evaluator: result.evaluator_id
        ? {
            id: result.evaluator_id,
            name: result.evaluator_name,
            employeeNumber: result.evaluator_employeenumber,
            email: result.evaluator_email,
            departmentId: result.evaluator_departmentid,
            status: result.evaluator_status,
          }
        : null,

      wbsItem: result.wbsitem_id
        ? {
            id: result.wbsitem_id,
            title: result.wbsitem_title,
            wbsCode: result.wbsitem_wbscode,
          }
        : null,

      period: result.period_id
        ? {
            id: result.period_id,
            name: result.period_name,
            startDate: result.period_startdate,
            status: result.period_status,
          }
        : null,

      selfEvaluation: result.selfevaluation_id
        ? {
            id: result.selfevaluation_id,
            wbsItemId: result.selfevaluation_wbsitemid,
            performanceResult: result.selfevaluation_performanceresult,
            selfEvaluationContent: result.selfevaluation_selfevaluationcontent,
            selfEvaluationScore: result.selfevaluation_selfevaluationscore,
            isCompleted: result.selfevaluation_iscompleted,
            completedAt: result.selfevaluation_completedat,
            evaluationDate: result.selfevaluation_evaluationdate,
          }
        : null,
    };
  }
}
