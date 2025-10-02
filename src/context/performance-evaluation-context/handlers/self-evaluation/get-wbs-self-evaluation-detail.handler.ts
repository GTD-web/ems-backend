import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WbsSelfEvaluationMapping } from '@domain/core/wbs-self-evaluation-mapping/wbs-self-evaluation-mapping.entity';
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
    @InjectRepository(WbsSelfEvaluationMapping)
    private readonly wbsSelfEvaluationMappingRepository: Repository<WbsSelfEvaluationMapping>,
  ) {}

  async execute(query: GetWbsSelfEvaluationDetailQuery): Promise<any> {
    const { evaluationId } = query;

    this.logger.log('WBS 자기평가 상세정보 조회 핸들러 실행', { evaluationId });

    // 매핑 테이블을 통해 관련 데이터들을 조인하여 조회
    const result = await this.wbsSelfEvaluationMappingRepository
      .createQueryBuilder('mapping')
      .leftJoin(
        WbsSelfEvaluation,
        'evaluation',
        'evaluation.id = mapping.selfEvaluationId AND evaluation.deletedAt IS NULL',
      )
      .leftJoin(
        EvaluationPeriod,
        'period',
        'period.id = mapping.periodId AND period.deletedAt IS NULL',
      )
      .leftJoin(
        Employee,
        'employee',
        'employee.id = mapping.employeeId AND employee.deletedAt IS NULL',
      )
      .leftJoin(
        WbsItem,
        'wbsItem',
        'wbsItem.id = mapping.wbsItemId AND wbsItem.deletedAt IS NULL',
      )
      .select([
        // 자기평가 정보
        'evaluation.id AS evaluation_id',
        'evaluation.evaluationDate AS evaluation_evaluationdate',
        'evaluation.selfEvaluationContent AS evaluation_selfevaluationcontent',
        'evaluation.selfEvaluationScore AS evaluation_selfevaluationscore',
        'evaluation.additionalComments AS evaluation_additionalcomments',
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
        'wbsItem.id AS wbsitem_id',
        'wbsItem.name AS wbsitem_name',
        'wbsItem.description AS wbsitem_description',
        'wbsItem.plannedHours AS wbsitem_plannedhours',
        'wbsItem.startDate AS wbsitem_startdate',
        'wbsItem.endDate AS wbsitem_enddate',
        'wbsItem.status AS wbsitem_status',
      ])
      .where('mapping.selfEvaluationId = :evaluationId', { evaluationId })
      .andWhere('mapping.deletedAt IS NULL')
      .getRawOne();

    if (!result || !result.evaluation_id) {
      throw new BadRequestException('존재하지 않는 자기평가입니다.');
    }

    this.logger.log('WBS 자기평가 상세정보 조회 완료', { evaluationId });

    // DTO 형태로 변환하여 반환 (관련 데이터 포함)
    return {
      // 자기평가 기본 정보
      id: result.evaluation_id,
      evaluationDate: result.evaluation_evaluationdate,
      selfEvaluationContent: result.evaluation_selfevaluationcontent,
      selfEvaluationScore: result.evaluation_selfevaluationscore,
      additionalComments: result.evaluation_additionalcomments,
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
            name: result.wbsitem_name,
            description: result.wbsitem_description,
            plannedHours: result.wbsitem_plannedhours,
            startDate: result.wbsitem_startdate,
            endDate: result.wbsitem_enddate,
            status: result.wbsitem_status,
          }
        : null,
    };
  }
}
