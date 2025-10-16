import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';

/**
 * WBS 자기평가 상세정보 조회 쿼리
 */
export class GetWbsSelfEvaluationDetailQuery {
  constructor(public readonly evaluationId: string) {}
}

/**
 * WBS 자기평가 상세정보 조회 핸들러
 */
@Injectable()
@QueryHandler(GetWbsSelfEvaluationDetailQuery)
export class GetWbsSelfEvaluationDetailHandler
  implements IQueryHandler<GetWbsSelfEvaluationDetailQuery>
{
  private readonly logger = new Logger(GetWbsSelfEvaluationDetailHandler.name);

  constructor(
    @InjectRepository(WbsSelfEvaluation)
    private readonly wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>,
  ) {}

  async execute(query: GetWbsSelfEvaluationDetailQuery): Promise<any> {
    const { evaluationId } = query;

    this.logger.log('WBS 자기평가 상세정보 조회 핸들러 실행', { evaluationId });

    // 자기평가를 관련 데이터들과 조인하여 조회
    const result = await this.wbsSelfEvaluationRepository
      .createQueryBuilder('evaluation')
      .leftJoin(
        EvaluationPeriod,
        'period',
        'period.id = evaluation.periodId AND period.deletedAt IS NULL',
      )
      .leftJoin(
        Employee,
        'employee',
        'employee.id = evaluation.employeeId AND employee.deletedAt IS NULL',
      )
      .leftJoin(
        WbsItem,
        'wbsitem',
        'wbsitem.id = evaluation.wbsItemId AND wbsitem.deletedAt IS NULL',
      )
      .select([
        // 자기평가 정보
        'evaluation.id AS evaluation_id',
        'evaluation.periodId AS evaluation_periodid',
        'evaluation.employeeId AS evaluation_employeeid',
        'evaluation.wbsItemId AS evaluation_wbsitemid',
        'evaluation.assignedBy AS evaluation_assignedby',
        'evaluation.assignedDate AS evaluation_assigneddate',
        'evaluation.isCompleted AS evaluation_iscompleted',
        'evaluation.completedAt AS evaluation_completedat',
        'evaluation.evaluationDate AS evaluation_evaluationdate',
        'evaluation.performanceResult AS evaluation_performanceresult',
        'evaluation.selfEvaluationContent AS evaluation_selfevaluationcontent',
        'evaluation.selfEvaluationScore AS evaluation_selfevaluationscore',
        'evaluation.createdAt AS evaluation_createdat',
        'evaluation.updatedAt AS evaluation_updatedat',
        'evaluation.deletedAt AS evaluation_deletedat',
        'evaluation.createdBy AS evaluation_createdby',
        'evaluation.updatedBy AS evaluation_updatedby',
        'evaluation.version AS evaluation_version',
        // 평가기간 정보
        'period.id AS period_id',
        'period.name AS period_name',
        'period.startDate AS period_startdate',
        'period.endDate AS period_enddate',
        'period.status AS period_status',
        'period.description AS period_description',
        // 직원 정보
        'employee.id AS employee_id',
        'employee.employeeNumber AS employee_employeenumber',
        'employee.name AS employee_name',
        'employee.email AS employee_email',
        'employee.departmentId AS employee_departmentid',
        // WBS 항목 정보
        'wbsitem.id AS wbsitem_id',
        'wbsitem.wbsCode AS wbsitem_wbscode',
        'wbsitem.title AS wbsitem_title',
        'wbsitem.startDate AS wbsitem_startdate',
        'wbsitem.endDate AS wbsitem_enddate',
        'wbsitem.status AS wbsitem_status',
        'wbsitem.progressPercentage AS wbsitem_progresspercentage',
        'wbsitem.projectId AS wbsitem_projectid',
      ])
      .where('evaluation.id = :evaluationId', { evaluationId })
      .andWhere('evaluation.deletedAt IS NULL')
      .getRawOne();

    if (!result || !result.evaluation_id) {
      throw new NotFoundException('존재하지 않는 자기평가입니다.');
    }

    this.logger.log('WBS 자기평가 상세정보 조회 완료', { evaluationId });

    // DTO 형태로 변환하여 반환 (관련 데이터 포함)
    return {
      // 자기평가 기본 정보
      id: result.evaluation_id,
      periodId: result.evaluation_periodid,
      employeeId: result.evaluation_employeeid,
      wbsItemId: result.evaluation_wbsitemid,
      assignedBy: result.evaluation_assignedby,
      assignedDate: result.evaluation_assigneddate,
      isCompleted: result.evaluation_iscompleted,
      completedAt: result.evaluation_completedat,
      evaluationDate: result.evaluation_evaluationdate,
      performanceResult: result.evaluation_performanceresult,
      selfEvaluationContent: result.evaluation_selfevaluationcontent,
      selfEvaluationScore: result.evaluation_selfevaluationscore,
      createdAt: result.evaluation_createdat,
      updatedAt: result.evaluation_updatedat,
      deletedAt: result.evaluation_deletedat,
      createdBy: result.evaluation_createdby,
      updatedBy: result.evaluation_updatedby,
      version: result.evaluation_version,
      // 관련 데이터들
      evaluationPeriod: result.period_id
        ? {
            id: result.period_id,
            name: result.period_name,
            startDate: result.period_startdate,
            endDate: result.period_enddate,
            status: result.period_status,
            description: result.period_description,
          }
        : null,
      employee: result.employee_id
        ? {
            id: result.employee_id,
            employeeNumber: result.employee_employeenumber,
            name: result.employee_name,
            email: result.employee_email,
            departmentId: result.employee_departmentid,
          }
        : null,
      wbsItem: result.wbsitem_id
        ? {
            id: result.wbsitem_id,
            wbsCode: result.wbsitem_wbscode,
            title: result.wbsitem_title,
            startDate: result.wbsitem_startdate,
            endDate: result.wbsitem_enddate,
            status: result.wbsitem_status,
            progressPercentage: result.wbsitem_progresspercentage,
            projectId: result.wbsitem_projectid,
          }
        : null,
    };
  }
}
