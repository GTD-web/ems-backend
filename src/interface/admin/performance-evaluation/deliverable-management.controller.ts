import { Body, Controller, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { ParseUUID, CurrentUser } from '@interface/decorators';
import type { AuthenticatedUser } from '@interface/decorators';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import {
  CreateDeliverable,
  UpdateDeliverable,
  DeleteDeliverable,
  BulkCreateDeliverables,
  BulkDeleteDeliverables,
  GetEmployeeDeliverables,
  GetWbsDeliverables,
  GetDeliverableDetail,
} from './decorators/deliverable-api.decorators';
import {
  CreateDeliverableDto,
  UpdateDeliverableDto,
  BulkCreateDeliverablesDto,
  BulkDeleteDeliverablesDto,
  DeliverableResponseDto,
  DeliverableListResponseDto,
  BulkCreateResultDto,
  BulkDeleteResultDto,
  GetDeliverablesQueryDto,
} from './dto/deliverable.dto';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';

/**
 * 산출물 관리 컨트롤러
 *
 * 산출물의 생성, 수정, 삭제, 조회 기능을 제공합니다.
 */
@ApiTags('C-2. 관리자 - 성과평가 - 산출물')
@ApiBearerAuth('Bearer')
@Controller('admin/performance-evaluation/deliverables')
export class DeliverableManagementController {
  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
  ) {}

  /**
   * 산출물 생성
   */
  @CreateDeliverable()
  async createDeliverable(
    @Body() dto: CreateDeliverableDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DeliverableResponseDto> {
    const createdBy = user?.id || dto.createdBy || uuidv4(); // TODO: 추후 사용자 인증 구현 시 수정

    const deliverable =
      await this.performanceEvaluationService.산출물을_생성한다({
        name: dto.name,
        type: dto.type,
        employeeId: dto.employeeId,
        wbsItemId: dto.wbsItemId,
        description: dto.description,
        filePath: dto.filePath,
        createdBy,
      });

    return this.toResponseDto(deliverable);
  }

  /**
   * 산출물 수정
   */
  @UpdateDeliverable()
  async updateDeliverable(
    @ParseUUID('id') id: string,
    @Body() dto: UpdateDeliverableDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DeliverableResponseDto> {
    const updatedBy = user?.id || dto.updatedBy || uuidv4(); // TODO: 추후 사용자 인증 구현 시 수정

    const deliverable =
      await this.performanceEvaluationService.산출물을_수정한다({
        id,
        updatedBy,
        name: dto.name,
        type: dto.type,
        description: dto.description,
        filePath: dto.filePath,
        employeeId: dto.employeeId,
        wbsItemId: dto.wbsItemId,
        isActive: dto.isActive,
      });

    return this.toResponseDto(deliverable);
  }

  /**
   * 산출물 삭제
   */
  @DeleteDeliverable()
  async deleteDeliverable(
    @ParseUUID('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const deletedBy = user?.id || uuidv4(); // TODO: 추후 사용자 인증 구현 시 수정

    await this.performanceEvaluationService.산출물을_삭제한다(id, deletedBy);
  }

  /**
   * 벌크 산출물 생성
   */
  @BulkCreateDeliverables()
  async bulkCreateDeliverables(
    @Body() dto: BulkCreateDeliverablesDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BulkCreateResultDto> {
    const createdBy = user?.id || uuidv4(); // TODO: 추후 사용자 인증 구현 시 수정

    const result =
      await this.performanceEvaluationService.산출물을_벌크_생성한다({
        deliverables: dto.deliverables.map((d) => ({
          name: d.name,
          description: d.description,
          type: d.type,
          filePath: d.filePath,
          employeeId: d.employeeId,
          wbsItemId: d.wbsItemId,
        })),
        createdBy,
      });

    return {
      successCount: result.successCount,
      failedCount: result.failedCount,
      createdIds: result.createdIds,
      failedItems: result.failedItems,
    };
  }

  /**
   * 벌크 산출물 삭제
   */
  @BulkDeleteDeliverables()
  async bulkDeleteDeliverables(
    @Body() dto: BulkDeleteDeliverablesDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BulkDeleteResultDto> {
    const deletedBy = user?.id || uuidv4(); // TODO: 추후 사용자 인증 구현 시 수정

    const result =
      await this.performanceEvaluationService.산출물을_벌크_삭제한다({
        ids: dto.deliverableIds,
        deletedBy,
      });

    return {
      successCount: result.successCount,
      failedCount: result.failedCount,
      failedIds: result.failedIds,
    };
  }

  /**
   * 직원별 산출물 조회
   */
  @GetEmployeeDeliverables()
  async getEmployeeDeliverables(
    @ParseUUID('employeeId') employeeId: string,
    @Query() query: GetDeliverablesQueryDto,
  ): Promise<DeliverableListResponseDto> {
    const activeOnly = query.activeOnly ?? true;

    const deliverables =
      await this.performanceEvaluationService.직원별_산출물을_조회한다(
        employeeId,
        activeOnly,
      );

    return {
      deliverables: deliverables.map((d) => this.toResponseDto(d)),
      total: deliverables.length,
    };
  }

  /**
   * WBS 항목별 산출물 조회
   */
  @GetWbsDeliverables()
  async getWbsDeliverables(
    @ParseUUID('wbsItemId') wbsItemId: string,
    @Query() query: GetDeliverablesQueryDto,
  ): Promise<DeliverableListResponseDto> {
    const activeOnly = query.activeOnly ?? true;

    const deliverables =
      await this.performanceEvaluationService.WBS항목별_산출물을_조회한다(
        wbsItemId,
        activeOnly,
      );

    return {
      deliverables: deliverables.map((d) => this.toResponseDto(d)),
      total: deliverables.length,
    };
  }

  /**
   * 산출물 상세 조회
   */
  @GetDeliverableDetail()
  async getDeliverableDetail(
    @ParseUUID('id') id: string,
  ): Promise<DeliverableResponseDto> {
    const deliverable =
      await this.performanceEvaluationService.산출물_상세를_조회한다(id);

    return this.toResponseDto(deliverable);
  }

  /**
   * Deliverable 엔티티를 응답 DTO로 변환
   */
  private toResponseDto(deliverable: Deliverable): DeliverableResponseDto {
    return {
      id: deliverable.id,
      name: deliverable.name,
      description: deliverable.description,
      type: deliverable.type,
      filePath: deliverable.filePath,
      employeeId: deliverable.employeeId,
      wbsItemId: deliverable.wbsItemId,
      mappedDate: deliverable.mappedDate,
      mappedBy: deliverable.mappedBy,
      isActive: deliverable.isActive,
      createdAt: deliverable.createdAt,
      updatedAt: deliverable.updatedAt,
      deletedAt: deliverable.deletedAt,
      createdBy: deliverable.createdBy,
      updatedBy: deliverable.updatedBy,
      version: deliverable.version,
    };
  }
}
