import { EvaluationQuestionManagementService } from '@context/evaluation-question-management-context/evaluation-question-management.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { AddMultipleQuestionsToGroupDto, AddQuestionToGroupDto, BatchSuccessResponseDto, CreateEvaluationQuestionDto, CreateQuestionGroupDto, EvaluationQuestionResponseDto, QuestionGroupMappingResponseDto, QuestionGroupResponseDto, ReorderGroupQuestionsDto, SuccessResponseDto, UpdateEvaluationQuestionDto, UpdateQuestionGroupDto } from './dto/evaluation-question.dto';
export declare class EvaluationQuestionManagementController {
    private readonly evaluationQuestionManagementService;
    constructor(evaluationQuestionManagementService: EvaluationQuestionManagementService);
    createQuestionGroup(dto: CreateQuestionGroupDto, user: AuthenticatedUser): Promise<SuccessResponseDto>;
    updateQuestionGroup(id: string, dto: UpdateQuestionGroupDto, user: AuthenticatedUser): Promise<SuccessResponseDto>;
    deleteQuestionGroup(id: string, user: AuthenticatedUser): Promise<void>;
    getQuestionGroups(): Promise<QuestionGroupResponseDto[]>;
    getDefaultQuestionGroup(): Promise<QuestionGroupResponseDto>;
    getQuestionGroup(id: string): Promise<QuestionGroupResponseDto>;
    createEvaluationQuestion(dto: CreateEvaluationQuestionDto, user: AuthenticatedUser): Promise<SuccessResponseDto>;
    updateEvaluationQuestion(id: string, dto: UpdateEvaluationQuestionDto, user: AuthenticatedUser): Promise<SuccessResponseDto>;
    deleteEvaluationQuestion(id: string, user: AuthenticatedUser): Promise<void>;
    getEvaluationQuestion(id: string): Promise<EvaluationQuestionResponseDto>;
    getEvaluationQuestions(): Promise<EvaluationQuestionResponseDto[]>;
    copyEvaluationQuestion(id: string, user: AuthenticatedUser): Promise<SuccessResponseDto>;
    addQuestionToGroup(dto: AddQuestionToGroupDto, user: AuthenticatedUser): Promise<SuccessResponseDto>;
    addMultipleQuestionsToGroup(dto: AddMultipleQuestionsToGroupDto, user: AuthenticatedUser): Promise<BatchSuccessResponseDto>;
    reorderGroupQuestions(dto: ReorderGroupQuestionsDto, user: AuthenticatedUser): Promise<SuccessResponseDto>;
    removeQuestionFromGroup(mappingId: string, user: AuthenticatedUser): Promise<void>;
    moveQuestionUp(mappingId: string, user: AuthenticatedUser): Promise<SuccessResponseDto>;
    moveQuestionDown(mappingId: string, user: AuthenticatedUser): Promise<SuccessResponseDto>;
    getGroupQuestions(groupId: string): Promise<QuestionGroupMappingResponseDto[]>;
    getQuestionGroupsByQuestion(questionId: string): Promise<QuestionGroupMappingResponseDto[]>;
}
