import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { CurrentUser } from '../../decorators';
import type { AuthenticatedUser } from '../../decorators';
import { ProjectService } from '../../../domain/common/project/project.service';
import type { ProjectDto } from '../../../domain/common/project/project.types';
import { EvaluationCriteriaManagementService } from '../../../context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { PerformanceEvaluationService } from '../../../context/performance-evaluation-context/performance-evaluation.service';
import {
  GetAllProjects,
  ResetAllWbsEvaluationCriteria,
  ResetAllDeliverables,
  ResetAllProjectAssignments,
  ResetAllEvaluationLines,
  ResetAllSelfEvaluations,
} from './decorators/admin-utils-api.decorators';
import type { BulkDeleteResultDto } from '../performance-evaluation/dto/deliverable.dto';

/**
 * 관리자 유틸리티 컨트롤러
 *
 * 시스템 전체 데이터를 조회하거나 초기화하는 관리자 전용 유틸 기능을 제공합니다.
 * 주로 개발/테스트 환경에서 데이터 관리 목적으로 사용됩니다.
 */
@ApiTags('Z. 관리자 - 유틸리티')
@ApiBearerAuth('Bearer')
@Controller('admin/utils')
export class AdminUtilsController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
    private readonly performanceEvaluationService: PerformanceEvaluationService,
  ) {}

  /**
   * 전체 프로젝트 목록 조회
   *
   * 평가기간이나 필터 없이 시스템에 등록된 모든 프로젝트를 조회합니다.
   */
  @GetAllProjects()
  async getAllProjects(): Promise<ProjectDto[]> {
    return await this.projectService.전체_조회한다();
  }

  /**
   * 모든 WBS 평가기준 리셋
   *
   * 시스템의 모든 WBS 평가기준을 소프트 삭제 방식으로 리셋합니다.
   * ⚠️ 주의: 이 작업은 되돌릴 수 없습니다 (소프트 삭제이지만 복구 기능 없음).
   */
  @ResetAllWbsEvaluationCriteria()
  async resetAllWbsEvaluationCriteria(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    const deletedBy = user.id;
    const success =
      await this.evaluationCriteriaManagementService.모든_WBS_평가기준을_삭제한다(
        deletedBy,
      );
    return { success };
  }

  /**
   * 모든 산출물 리셋
   *
   * 시스템의 모든 산출물을 소프트 삭제 방식으로 리셋하고 결과를 반환합니다.
   * ⚠️ 주의: 이 작업은 되돌릴 수 없습니다 (소프트 삭제이지만 복구 기능 없음).
   *
   * @returns 리셋 결과 (성공/실패 개수, 실패한 ID 목록)
   */
  @ResetAllDeliverables()
  async resetAllDeliverables(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BulkDeleteResultDto> {
    const deletedBy = user?.id || uuidv4();

    const result =
      await this.performanceEvaluationService.모든_산출물을_삭제한다(deletedBy);

    return {
      successCount: result.successCount,
      failedCount: result.failedCount,
      failedIds: result.failedIds,
    };
  }

  /**
   * 모든 프로젝트 할당 리셋
   *
   * 시스템의 모든 프로젝트 할당 및 관련 평가 데이터를 소프트 삭제 방식으로 리셋합니다.
   * ⚠️ 주의: 이 작업은 되돌릴 수 없습니다 (소프트 삭제이지만 복구 기능 없음).
   *
   * 리셋되는 데이터:
   * - 동료평가 질문 매핑
   * - 동료평가
   * - 하향평가
   * - 자기평가
   * - 산출물 매핑
   * - WBS 할당
   * - 평가라인 매핑
   * - 프로젝트 할당
   */
  @ResetAllProjectAssignments()
  async resetAllProjectAssignments(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const deletedBy = user.id;
    return await this.evaluationCriteriaManagementService.모든_프로젝트_할당을_삭제한다(
      deletedBy,
    );
  }

  /**
   * 모든 평가라인 리셋
   *
   * 시스템의 모든 평가라인 매핑 및 관련 평가 데이터를 소프트 삭제 방식으로 리셋합니다.
   * ⚠️ 주의: 이 작업은 되돌릴 수 없습니다 (소프트 삭제이지만 복구 기능 없음).
   *
   * 리셋되는 데이터:
   * - 동료평가 질문 매핑
   * - 동료평가
   * - 하향평가
   * - 평가라인 매핑
   */
  @ResetAllEvaluationLines()
  async resetAllEvaluationLines(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const deletedBy = user.id;
    return await this.evaluationCriteriaManagementService.모든_평가라인을_리셋한다(
      deletedBy,
    );
  }

  /**
   * 모든 자기평가 리셋
   *
   * 시스템의 모든 자기평가 및 관련 하향평가 데이터를 소프트 삭제 방식으로 리셋합니다.
   * ⚠️ 주의: 이 작업은 되돌릴 수 없습니다 (소프트 삭제이지만 복구 기능 없음).
   *
   * 리셋되는 데이터:
   * - 자기평가에 연결된 하향평가
   * - 자기평가
   */
  @ResetAllSelfEvaluations()
  async resetAllSelfEvaluations(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const deletedBy = user.id;
    return await this.evaluationCriteriaManagementService.모든_자기평가를_리셋한다(
      deletedBy,
    );
  }
}
