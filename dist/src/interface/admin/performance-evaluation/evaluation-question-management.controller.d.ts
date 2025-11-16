import { EvaluationQuestionManagementService } from '@context/evaluation-question-management-context/evaluation-question-management.service';
import type { AuthenticatedUser } from '@interface/decorators';
import { CreateQuestionGroupDto, UpdateQuestionGroupDto, QuestionGroupResponseDto, CreateEvaluationQuestionDto, UpdateEvaluationQuestionDto, EvaluationQuestionResponseDto, AddQuestionToGroupDto, AddMultipleQuestionsToGroupDto, ReorderGroupQuestionsDto, QuestionGroupMappingResponseDto, SuccessResponseDto, BatchSuccessResponseDto, PartLeaderQuestionSettingsResponseDto, UpdatePartLeaderQuestionSettingsDto } from './dto/evaluation-question.dto';
export declare class EvaluationQuestionManagementController {
    private readonly evaluationQuestionManagementService;
    constructor(evaluationQuestionManagementService: EvaluationQuestionManagementService);
    createQuestionGroup(dto: CreateQuestionGroupDto, user: AuthenticatedUser): Promise<SuccessResponseDto>;
    updateQuestionGroup(id: string, dto: UpdateQuestionGroupDto, user: AuthenticatedUser): Promise<SuccessResponseDto>;
    deleteQuestionGroup(id: string, user: AuthenticatedUser): Promise<void>;
    getQuestionGroups(): Promise<QuestionGroupResponseDto[]>;
    getDefaultQuestionGroup(): Promise<QuestionGroupResponseDto>;
    getQuestionGroup(id: string): Promise<QuestionGroupResponseDto>;
    getPartLeaderQuestionSettings(): Promise<PartLeaderQuestionSettingsResponseDto>;
    updatePartLeaderQuestionSettings(dto: UpdatePartLeaderQuestionSettingsDto, user: AuthenticatedUser): Promise<PartLeaderQuestionSettingsResponseDto>;
    createEvaluationQuestion(dto: CreateEvaluationQuestionDto, user: AuthenticatedUser): Promise<SuccessResponseDto>;
    updateEvaluationQuestion(id: string, dto: UpdateEvaluationQuestionDto, user: AuthenticatedUser): Promise<SuccessResponseDto>;
    deleteEvaluationQuestion(id: string, user: AuthenticatedUser): Promise<void>;
    getEvaluationQuestions(): Promise<EvaluationQuestionResponseDto[]>;
    copyEvaluationQuestion(id: string, user: AuthenticatedUser): Promise<SuccessResponseDto>;
    getEvaluationQuestion(id: string): Promise<EvaluationQuestionResponseDto>;
    addQuestionToGroup(dto: AddQuestionToGroupDto, user: AuthenticatedUser): Promise<SuccessResponseDto>;
    addMultipleQuestionsToGroup(dto: AddMultipleQuestionsToGroupDto, user: AuthenticatedUser): Promise<BatchSuccessResponseDto>;
    reorderGroupQuestions(dto: ReorderGroupQuestionsDto, user: AuthenticatedUser): Promise<SuccessResponseDto>;
    removeQuestionFromGroup(mappingId: string, user: AuthenticatedUser): Promise<void>;
    moveQuestionUp(mappingId: string, user: AuthenticatedUser): Promise<SuccessResponseDto>;
    moveQuestionDown(mappingId: string, user: AuthenticatedUser): Promise<SuccessResponseDto>;
    getGroupQuestions(groupId: string): Promise<QuestionGroupMappingResponseDto[]>;
    getQuestionGroupsByQuestion(questionId: string): Promise<QuestionGroupMappingResponseDto[]>;
}
