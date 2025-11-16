import { Body, Controller, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EvaluationQuestionManagementService } from '@context/evaluation-question-management-context/evaluation-question-management.service';
import { CurrentUser } from '@interface/decorators';
import type { AuthenticatedUser } from '@interface/decorators';
import {
  CreateQuestionGroup,
  UpdateQuestionGroup,
  DeleteQuestionGroup,
  GetQuestionGroup,
  GetQuestionGroups,
  GetDefaultQuestionGroup,
  CreateEvaluationQuestion,
  UpdateEvaluationQuestion,
  DeleteEvaluationQuestion,
  GetEvaluationQuestion,
  GetEvaluationQuestions,
  CopyEvaluationQuestion,
  AddQuestionToGroup,
  AddMultipleQuestionsToGroup,
  ReorderGroupQuestions,
  RemoveQuestionFromGroup,
  MoveQuestionUp,
  MoveQuestionDown,
  GetGroupQuestions,
  GetQuestionGroupsByQuestion,
  GetPartLeaderQuestionSettings,
  UpdatePartLeaderQuestionSettings,
} from './decorators/evaluation-question-api.decorators';
import {
  CreateQuestionGroupDto,
  UpdateQuestionGroupDto,
  QuestionGroupResponseDto,
  CreateEvaluationQuestionDto,
  UpdateEvaluationQuestionDto,
  EvaluationQuestionResponseDto,
  AddQuestionToGroupDto,
  AddMultipleQuestionsToGroupDto,
  ReorderGroupQuestionsDto,
  QuestionGroupMappingResponseDto,
  SuccessResponseDto,
  BatchSuccessResponseDto,
  PartLeaderQuestionSettingsResponseDto,
  UpdatePartLeaderQuestionSettingsDto,
} from './dto/evaluation-question.dto';

/**
 * 평가 질문 관리 컨트롤러
 *
 * 평가 질문 및 질문 그룹 관리 기능을 제공합니다.
 */
@ApiTags('C-4. 관리자 - 성과평가 - 평가 질문 관리')
@ApiBearerAuth('Bearer')
@Controller('admin/performance-evaluation/evaluation-questions')
export class EvaluationQuestionManagementController {
  constructor(
    private readonly evaluationQuestionManagementService: EvaluationQuestionManagementService,
  ) {}

  // ==================== 질문 그룹 관리 ====================

  /**
   * 질문 그룹 생성
   */
  @CreateQuestionGroup()
  async createQuestionGroup(
    @Body() dto: CreateQuestionGroupDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SuccessResponseDto> {
    const createdBy = user.id;

    const groupId =
      await this.evaluationQuestionManagementService.질문그룹을_생성한다(
        {
          name: dto.name,
          isDefault: dto.isDefault,
        },
        createdBy,
      );

    return {
      id: groupId,
      message: '질문 그룹이 성공적으로 생성되었습니다.',
    };
  }

  /**
   * 질문 그룹 수정
   */
  @UpdateQuestionGroup()
  async updateQuestionGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuestionGroupDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SuccessResponseDto> {
    const updatedBy = user.id;

    await this.evaluationQuestionManagementService.질문그룹을_수정한다(
      id,
      {
        name: dto.name,
        isDefault: dto.isDefault,
      },
      updatedBy,
    );

    return {
      id,
      message: '질문 그룹이 성공적으로 수정되었습니다.',
    };
  }

  /**
   * 질문 그룹 삭제
   */
  @DeleteQuestionGroup()
  async deleteQuestionGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const deletedBy = user.id;

    await this.evaluationQuestionManagementService.질문그룹을_삭제한다(
      id,
      deletedBy,
    );
  }

  /**
   * 질문 그룹 목록 조회
   */
  @GetQuestionGroups()
  async getQuestionGroups(): Promise<QuestionGroupResponseDto[]> {
    return await this.evaluationQuestionManagementService.질문그룹목록을_조회한다();
  }

  /**
   * 기본 질문 그룹 조회
   */
  @GetDefaultQuestionGroup()
  async getDefaultQuestionGroup(): Promise<QuestionGroupResponseDto> {
    return await this.evaluationQuestionManagementService.기본질문그룹을_조회한다();
  }

  /**
   * 질문 그룹 조회
   */
  @GetQuestionGroup()
  async getQuestionGroup(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QuestionGroupResponseDto> {
    return await this.evaluationQuestionManagementService.질문그룹을_조회한다(
      id,
    );
  }

  // ==================== 평가 질문 관리 ====================

  // 🔹 주의: 정적 라우트를 동적 라우트(:id)보다 먼저 정의해야 합니다!

  /**
   * 파트장 질문 설정 조회
   */
  @GetPartLeaderQuestionSettings()
  async getPartLeaderQuestionSettings(): Promise<PartLeaderQuestionSettingsResponseDto> {
    // "파트장 평가 질문" 그룹 조회
    const questionGroups =
      await this.evaluationQuestionManagementService.질문그룹목록을_조회한다({
        nameSearch: '파트장 평가 질문',
      });

    const partLeaderGroup = questionGroups.find(
      (group) => group.name === '파트장 평가 질문',
    );

    if (!partLeaderGroup) {
      throw new Error('파트장 평가 질문 그룹을 찾을 수 없습니다.');
    }

    // 그룹의 질문 목록 조회 (displayOrder 순)
    const questions =
      await this.evaluationQuestionManagementService.그룹의_질문목록을_조회한다(
        partLeaderGroup.id,
      );

    return {
      group: partLeaderGroup,
      questions,
    };
  }

  /**
   * 파트장 질문 설정 업데이트
   */
  @UpdatePartLeaderQuestionSettings()
  async updatePartLeaderQuestionSettings(
    @Body() dto: UpdatePartLeaderQuestionSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PartLeaderQuestionSettingsResponseDto> {
    const updatedBy = user.id;

    // "파트장 평가 질문" 그룹 조회
    const questionGroups =
      await this.evaluationQuestionManagementService.질문그룹목록을_조회한다({
        nameSearch: '파트장 평가 질문',
      });

    const partLeaderGroup = questionGroups.find(
      (group) => group.name === '파트장 평가 질문',
    );

    if (!partLeaderGroup) {
      throw new Error('파트장 평가 질문 그룹을 찾을 수 없습니다.');
    }

    // 기존 매핑 모두 제거
    const existingMappings =
      await this.evaluationQuestionManagementService.그룹의_질문목록을_조회한다(
        partLeaderGroup.id,
      );

    for (const mapping of existingMappings) {
      await this.evaluationQuestionManagementService.그룹에서_질문을_제거한다(
        mapping.id,
        updatedBy,
      );
    }

    // 새로운 질문들 추가
    if (dto.questionIds.length > 0) {
      await this.evaluationQuestionManagementService.그룹에_여러_질문을_추가한다(
        partLeaderGroup.id,
        dto.questionIds,
        0, // startDisplayOrder
        updatedBy,
      );
    }

    // 업데이트된 설정 조회
    const updatedQuestions =
      await this.evaluationQuestionManagementService.그룹의_질문목록을_조회한다(
        partLeaderGroup.id,
      );

    return {
      group: partLeaderGroup,
      questions: updatedQuestions,
    };
  }

  /**
   * 평가 질문 생성
   */
  @CreateEvaluationQuestion()
  async createEvaluationQuestion(
    @Body() dto: CreateEvaluationQuestionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SuccessResponseDto> {
    const createdBy = user.id;

    const questionId =
      await this.evaluationQuestionManagementService.평가질문을_생성한다(
        {
          text: dto.text,
          minScore: dto.minScore,
          maxScore: dto.maxScore,
          groupId: dto.groupId,
          displayOrder: dto.displayOrder,
        },
        createdBy,
      );

    return {
      id: questionId,
      message: '평가 질문이 성공적으로 생성되었습니다.',
    };
  }

  /**
   * 평가 질문 수정
   */
  @UpdateEvaluationQuestion()
  async updateEvaluationQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEvaluationQuestionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SuccessResponseDto> {
    const updatedBy = user.id;

    await this.evaluationQuestionManagementService.평가질문을_수정한다(
      id,
      {
        text: dto.text,
        minScore: dto.minScore,
        maxScore: dto.maxScore,
      },
      updatedBy,
    );

    return {
      id,
      message: '평가 질문이 성공적으로 수정되었습니다.',
    };
  }

  /**
   * 평가 질문 삭제
   */
  @DeleteEvaluationQuestion()
  async deleteEvaluationQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const deletedBy = user.id;

    await this.evaluationQuestionManagementService.평가질문을_삭제한다(
      id,
      deletedBy,
    );
  }

  /**
   * 평가 질문 목록 조회
   */
  @GetEvaluationQuestions()
  async getEvaluationQuestions(): Promise<EvaluationQuestionResponseDto[]> {
    return await this.evaluationQuestionManagementService.평가질문목록을_조회한다();
  }

  /**
   * 평가 질문 복사
   */
  @CopyEvaluationQuestion()
  async copyEvaluationQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SuccessResponseDto> {
    const copiedBy = user.id;

    const newQuestionId =
      await this.evaluationQuestionManagementService.평가질문을_복사한다(
        id,
        copiedBy,
      );

    return {
      id: newQuestionId,
      message: '평가 질문이 성공적으로 복사되었습니다.',
    };
  }

  /**
   * 평가 질문 조회
   */
  @GetEvaluationQuestion()
  async getEvaluationQuestion(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EvaluationQuestionResponseDto> {
    return await this.evaluationQuestionManagementService.평가질문을_조회한다(
      id,
    );
  }

  // ==================== 질문-그룹 매핑 관리 ====================

  /**
   * 그룹에 질문 추가
   */
  @AddQuestionToGroup()
  async addQuestionToGroup(
    @Body() dto: AddQuestionToGroupDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SuccessResponseDto> {
    const createdBy = user.id;

    const mappingId =
      await this.evaluationQuestionManagementService.그룹에_질문을_추가한다(
        {
          groupId: dto.groupId,
          questionId: dto.questionId,
          displayOrder: dto.displayOrder,
        },
        createdBy,
      );

    return {
      id: mappingId,
      message: '그룹에 질문이 성공적으로 추가되었습니다.',
    };
  }

  /**
   * 그룹에 여러 질문 추가
   */
  @AddMultipleQuestionsToGroup()
  async addMultipleQuestionsToGroup(
    @Body() dto: AddMultipleQuestionsToGroupDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BatchSuccessResponseDto> {
    const createdBy = user.id;

    const mappingIds =
      await this.evaluationQuestionManagementService.그룹에_여러_질문을_추가한다(
        dto.groupId,
        dto.questionIds,
        dto.startDisplayOrder ?? 0,
        createdBy,
      );

    return {
      ids: mappingIds,
      message: '그룹에 여러 질문이 성공적으로 추가되었습니다.',
      successCount: mappingIds.length,
      totalCount: dto.questionIds.length,
    };
  }

  /**
   * 그룹 내 질문 순서 재정의
   */
  @ReorderGroupQuestions()
  async reorderGroupQuestions(
    @Body() dto: ReorderGroupQuestionsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SuccessResponseDto> {
    const updatedBy = user.id;

    await this.evaluationQuestionManagementService.그룹내_질문순서를_재정의한다(
      dto.groupId,
      dto.questionIds,
      updatedBy,
    );

    return {
      id: dto.groupId,
      message: '그룹 내 질문 순서가 성공적으로 재정의되었습니다.',
    };
  }

  /**
   * 그룹에서 질문 제거
   */
  @RemoveQuestionFromGroup()
  async removeQuestionFromGroup(
    @Param('mappingId', ParseUUIDPipe) mappingId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const deletedBy = user.id;

    await this.evaluationQuestionManagementService.그룹에서_질문을_제거한다(
      mappingId,
      deletedBy,
    );
  }

  /**
   * 질문 순서 위로 이동
   */
  @MoveQuestionUp()
  async moveQuestionUp(
    @Param('mappingId', ParseUUIDPipe) mappingId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SuccessResponseDto> {
    const updatedBy = user.id;

    await this.evaluationQuestionManagementService.질문순서를_위로_이동한다(
      mappingId,
      updatedBy,
    );

    return {
      id: mappingId,
      message: '질문 순서가 성공적으로 위로 이동되었습니다.',
    };
  }

  /**
   * 질문 순서 아래로 이동
   */
  @MoveQuestionDown()
  async moveQuestionDown(
    @Param('mappingId', ParseUUIDPipe) mappingId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SuccessResponseDto> {
    const updatedBy = user.id;

    await this.evaluationQuestionManagementService.질문순서를_아래로_이동한다(
      mappingId,
      updatedBy,
    );

    return {
      id: mappingId,
      message: '질문 순서가 성공적으로 아래로 이동되었습니다.',
    };
  }

  /**
   * 그룹의 질문 목록 조회
   */
  @GetGroupQuestions()
  async getGroupQuestions(
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ): Promise<QuestionGroupMappingResponseDto[]> {
    return await this.evaluationQuestionManagementService.그룹의_질문목록을_조회한다(
      groupId,
    );
  }

  /**
   * 질문이 속한 그룹 목록 조회
   */
  @GetQuestionGroupsByQuestion()
  async getQuestionGroupsByQuestion(
    @Param('questionId', ParseUUIDPipe) questionId: string,
  ): Promise<QuestionGroupMappingResponseDto[]> {
    return await this.evaluationQuestionManagementService.질문이_속한_그룹목록을_조회한다(
      questionId,
    );
  }
}
