import { Body, Controller, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { EvaluationQuestionManagementService } from '@context/evaluation-question-management-context/evaluation-question-management.service';
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
  RemoveQuestionFromGroup,
  UpdateQuestionDisplayOrder,
  GetGroupQuestions,
  GetQuestionGroupsByQuestion,
} from './decorators/evaluation-question-api.decorators';
import {
  CreateQuestionGroupDto,
  UpdateQuestionGroupDto,
  QuestionGroupResponseDto,
  CreateEvaluationQuestionDto,
  UpdateEvaluationQuestionDto,
  EvaluationQuestionResponseDto,
  AddQuestionToGroupDto,
  UpdateQuestionDisplayOrderDto,
  QuestionGroupMappingResponseDto,
  SuccessResponseDto,
} from './dto/evaluation-question.dto';

/**
 * 평가 질문 관리 컨트롤러
 *
 * 평가 질문 및 질문 그룹 관리 기능을 제공합니다.
 */
@ApiTags('C-3. 관리자 - 성과평가 - 평가 질문 관리')
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
  ): Promise<SuccessResponseDto> {
    const createdBy = dto.createdBy || uuidv4();

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
  ): Promise<SuccessResponseDto> {
    const updatedBy = dto.updatedBy || uuidv4();

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
  ): Promise<void> {
    const deletedBy = uuidv4();

    await this.evaluationQuestionManagementService.질문그룹을_삭제한다(
      id,
      deletedBy,
    );
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

  // ==================== 평가 질문 관리 ====================

  /**
   * 평가 질문 생성
   */
  @CreateEvaluationQuestion()
  async createEvaluationQuestion(
    @Body() dto: CreateEvaluationQuestionDto,
  ): Promise<SuccessResponseDto> {
    const createdBy = dto.createdBy || uuidv4();

    const questionId =
      await this.evaluationQuestionManagementService.평가질문을_생성한다(
        {
          text: dto.text,
          minScore: dto.minScore,
          maxScore: dto.maxScore,
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
  ): Promise<SuccessResponseDto> {
    const updatedBy = dto.updatedBy || uuidv4();

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
  ): Promise<void> {
    const deletedBy = uuidv4();

    await this.evaluationQuestionManagementService.평가질문을_삭제한다(
      id,
      deletedBy,
    );
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
  ): Promise<SuccessResponseDto> {
    const copiedBy = uuidv4();

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

  // ==================== 질문-그룹 매핑 관리 ====================

  /**
   * 그룹에 질문 추가
   */
  @AddQuestionToGroup()
  async addQuestionToGroup(
    @Body() dto: AddQuestionToGroupDto,
  ): Promise<SuccessResponseDto> {
    const createdBy = dto.createdBy || uuidv4();

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
   * 그룹에서 질문 제거
   */
  @RemoveQuestionFromGroup()
  async removeQuestionFromGroup(
    @Param('mappingId', ParseUUIDPipe) mappingId: string,
  ): Promise<void> {
    const deletedBy = uuidv4();

    await this.evaluationQuestionManagementService.그룹에서_질문을_제거한다(
      mappingId,
      deletedBy,
    );
  }

  /**
   * 질문 표시 순서 변경
   */
  @UpdateQuestionDisplayOrder()
  async updateQuestionDisplayOrder(
    @Param('mappingId', ParseUUIDPipe) mappingId: string,
    @Body() dto: UpdateQuestionDisplayOrderDto,
  ): Promise<SuccessResponseDto> {
    const updatedBy = dto.updatedBy || uuidv4();

    await this.evaluationQuestionManagementService.질문표시순서를_변경한다(
      mappingId,
      dto.displayOrder,
      updatedBy,
    );

    return {
      id: mappingId,
      message: '질문 표시 순서가 성공적으로 변경되었습니다.',
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
