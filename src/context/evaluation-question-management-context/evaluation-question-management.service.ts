import { Injectable } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import type {
  QuestionGroupDto,
  CreateQuestionGroupDto,
  UpdateQuestionGroupDto,
  QuestionGroupFilter,
} from '../../domain/sub/question-group/question-group.types';
import type {
  EvaluationQuestionDto,
  CreateEvaluationQuestionDto,
  UpdateEvaluationQuestionDto,
  EvaluationQuestionFilter,
} from '../../domain/sub/evaluation-question/evaluation-question.types';
import type {
  QuestionGroupMappingDto,
  CreateQuestionGroupMappingDto,
} from '../../domain/sub/question-group-mapping/question-group-mapping.types';
import type {
  EvaluationResponseDto,
  CreateEvaluationResponseDto,
  UpdateEvaluationResponseDto,
  EvaluationResponseFilter,
  EvaluationResponseStats,
} from '../../domain/sub/evaluation-response/evaluation-response.types';
import {
  CreateQuestionGroupCommand,
  UpdateQuestionGroupCommand,
  DeleteQuestionGroupCommand,
  SetDefaultQuestionGroupCommand,
  GetQuestionGroupQuery,
  GetQuestionGroupsQuery,
  GetDefaultQuestionGroupQuery,
} from './handlers/question-group';
import {
  CreateEvaluationQuestionCommand,
  UpdateEvaluationQuestionCommand,
  DeleteEvaluationQuestionCommand,
  CopyEvaluationQuestionCommand,
  GetEvaluationQuestionQuery,
  GetEvaluationQuestionsQuery,
} from './handlers/evaluation-question';
import {
  AddQuestionToGroupCommand,
  RemoveQuestionFromGroupCommand,
  UpdateQuestionDisplayOrderCommand,
  MoveQuestionUpCommand,
  MoveQuestionDownCommand,
  AddMultipleQuestionsToGroupCommand,
  ReorderGroupQuestionsCommand,
  GetGroupQuestionsQuery,
  GetQuestionGroupsByQuestionQuery,
} from './handlers/question-group-mapping';
import {
  CreateEvaluationResponseCommand,
  UpdateEvaluationResponseCommand,
  DeleteEvaluationResponseCommand,
  GetEvaluationResponsesQuery,
  GetEvaluationResponseStatsQuery,
} from './handlers/evaluation-response';

/**
 * 평가 질문 관리 서비스
 *
 * 평가 질문, 질문 그룹, 질문-그룹 매핑, 평가 응답을 관리하는 컨텍스트 서비스입니다.
 * CQRS 패턴을 사용하여 Command와 Query를 처리합니다.
 */
@Injectable()
export class EvaluationQuestionManagementService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  // ==================== 질문 그룹 관리 ====================

  /**
   * 질문 그룹을 생성한다
   */
  async 질문그룹을_생성한다(
    data: CreateQuestionGroupDto,
    createdBy: string,
  ): Promise<string> {
    return await this.commandBus.execute(
      new CreateQuestionGroupCommand(data, createdBy),
    );
  }

  /**
   * 질문 그룹을 수정한다
   */
  async 질문그룹을_수정한다(
    id: string,
    data: UpdateQuestionGroupDto,
    updatedBy: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateQuestionGroupCommand(id, data, updatedBy),
    );
  }

  /**
   * 질문 그룹을 삭제한다
   */
  async 질문그룹을_삭제한다(id: string, deletedBy: string): Promise<void> {
    await this.commandBus.execute(
      new DeleteQuestionGroupCommand(id, deletedBy),
    );
  }

  /**
   * 기본 질문 그룹을 설정한다
   */
  async 기본질문그룹을_설정한다(
    groupId: string,
    updatedBy: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new SetDefaultQuestionGroupCommand(groupId, updatedBy),
    );
  }

  /**
   * 질문 그룹을 조회한다
   */
  async 질문그룹을_조회한다(id: string): Promise<QuestionGroupDto> {
    return await this.queryBus.execute(new GetQuestionGroupQuery(id));
  }

  /**
   * 질문 그룹 목록을 조회한다
   */
  async 질문그룹목록을_조회한다(
    filter?: QuestionGroupFilter,
  ): Promise<QuestionGroupDto[]> {
    return await this.queryBus.execute(new GetQuestionGroupsQuery(filter));
  }

  /**
   * 기본 질문 그룹을 조회한다
   */
  async 기본질문그룹을_조회한다(): Promise<QuestionGroupDto> {
    return await this.queryBus.execute(new GetDefaultQuestionGroupQuery());
  }

  // ==================== 평가 질문 관리 ====================

  /**
   * 평가 질문을 생성한다
   */
  async 평가질문을_생성한다(
    data: CreateEvaluationQuestionDto,
    createdBy: string,
  ): Promise<string> {
    return await this.commandBus.execute(
      new CreateEvaluationQuestionCommand(data, createdBy),
    );
  }

  /**
   * 평가 질문을 수정한다
   */
  async 평가질문을_수정한다(
    id: string,
    data: UpdateEvaluationQuestionDto,
    updatedBy: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateEvaluationQuestionCommand(id, data, updatedBy),
    );
  }

  /**
   * 평가 질문을 삭제한다
   */
  async 평가질문을_삭제한다(id: string, deletedBy: string): Promise<void> {
    await this.commandBus.execute(
      new DeleteEvaluationQuestionCommand(id, deletedBy),
    );
  }

  /**
   * 평가 질문을 복사한다
   */
  async 평가질문을_복사한다(id: string, copiedBy: string): Promise<string> {
    return await this.commandBus.execute(
      new CopyEvaluationQuestionCommand(id, copiedBy),
    );
  }

  /**
   * 평가 질문을 조회한다
   */
  async 평가질문을_조회한다(id: string): Promise<EvaluationQuestionDto> {
    return await this.queryBus.execute(new GetEvaluationQuestionQuery(id));
  }

  /**
   * 평가 질문 목록을 조회한다
   */
  async 평가질문목록을_조회한다(
    filter?: EvaluationQuestionFilter,
  ): Promise<EvaluationQuestionDto[]> {
    return await this.queryBus.execute(new GetEvaluationQuestionsQuery(filter));
  }

  // ==================== 질문 그룹 매핑 관리 ====================

  /**
   * 그룹에 질문을 추가한다
   */
  async 그룹에_질문을_추가한다(
    data: CreateQuestionGroupMappingDto,
    createdBy: string,
  ): Promise<string> {
    return await this.commandBus.execute(
      new AddQuestionToGroupCommand(data, createdBy),
    );
  }

  /**
   * 그룹에서 질문을 제거한다
   */
  async 그룹에서_질문을_제거한다(
    mappingId: string,
    deletedBy: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new RemoveQuestionFromGroupCommand(mappingId, deletedBy),
    );
  }

  /**
   * 질문의 표시 순서를 변경한다
   */
  async 질문표시순서를_변경한다(
    mappingId: string,
    displayOrder: number,
    updatedBy: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateQuestionDisplayOrderCommand(mappingId, displayOrder, updatedBy),
    );
  }

  /**
   * 질문 순서를 위로 이동한다
   */
  async 질문순서를_위로_이동한다(
    mappingId: string,
    updatedBy: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new MoveQuestionUpCommand(mappingId, updatedBy),
    );
  }

  /**
   * 질문 순서를 아래로 이동한다
   */
  async 질문순서를_아래로_이동한다(
    mappingId: string,
    updatedBy: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new MoveQuestionDownCommand(mappingId, updatedBy),
    );
  }

  /**
   * 그룹에 여러 질문을 추가한다
   */
  async 그룹에_여러_질문을_추가한다(
    groupId: string,
    questionIds: string[],
    startDisplayOrder: number,
    createdBy: string,
  ): Promise<string[]> {
    return await this.commandBus.execute(
      new AddMultipleQuestionsToGroupCommand(
        groupId,
        questionIds,
        startDisplayOrder,
        createdBy,
      ),
    );
  }

  /**
   * 그룹 내 질문 순서를 재정의한다
   */
  async 그룹내_질문순서를_재정의한다(
    groupId: string,
    questionIds: string[],
    updatedBy: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new ReorderGroupQuestionsCommand(groupId, questionIds, updatedBy),
    );
  }

  /**
   * 그룹의 질문 목록을 조회한다
   */
  async 그룹의_질문목록을_조회한다(
    groupId: string,
  ): Promise<QuestionGroupMappingDto[]> {
    return await this.queryBus.execute(new GetGroupQuestionsQuery(groupId));
  }

  /**
   * 질문이 속한 그룹 목록을 조회한다
   */
  async 질문이_속한_그룹목록을_조회한다(
    questionId: string,
  ): Promise<QuestionGroupMappingDto[]> {
    return await this.queryBus.execute(
      new GetQuestionGroupsByQuestionQuery(questionId),
    );
  }

  // ==================== 평가 응답 관리 ====================

  /**
   * 평가 응답을 생성한다
   */
  async 평가응답을_생성한다(
    data: CreateEvaluationResponseDto,
    createdBy: string,
  ): Promise<string> {
    return await this.commandBus.execute(
      new CreateEvaluationResponseCommand(data, createdBy),
    );
  }

  /**
   * 평가 응답을 수정한다
   */
  async 평가응답을_수정한다(
    id: string,
    data: UpdateEvaluationResponseDto,
    updatedBy: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateEvaluationResponseCommand(id, data, updatedBy),
    );
  }

  /**
   * 평가 응답을 삭제한다
   */
  async 평가응답을_삭제한다(id: string, deletedBy: string): Promise<void> {
    await this.commandBus.execute(
      new DeleteEvaluationResponseCommand(id, deletedBy),
    );
  }

  /**
   * 평가 응답 목록을 조회한다
   */
  async 평가응답목록을_조회한다(
    filter: EvaluationResponseFilter,
  ): Promise<EvaluationResponseDto[]> {
    return await this.queryBus.execute(new GetEvaluationResponsesQuery(filter));
  }

  /**
   * 평가 응답 통계를 조회한다
   */
  async 평가응답통계를_조회한다(
    evaluationId: string,
  ): Promise<EvaluationResponseStats> {
    return await this.queryBus.execute(
      new GetEvaluationResponseStatsQuery(evaluationId),
    );
  }
}
