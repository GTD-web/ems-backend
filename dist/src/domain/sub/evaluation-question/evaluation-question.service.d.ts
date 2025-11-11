import { Repository } from 'typeorm';
import { EvaluationQuestion } from './evaluation-question.entity';
import type { CreateEvaluationQuestionDto, UpdateEvaluationQuestionDto, EvaluationQuestionFilter } from './evaluation-question.types';
import type { IEvaluationQuestionService } from './interfaces/evaluation-question.service.interface';
export declare class EvaluationQuestionService implements IEvaluationQuestionService {
    private readonly evaluationQuestionRepository;
    private readonly logger;
    constructor(evaluationQuestionRepository: Repository<EvaluationQuestion>);
    ID로조회한다(id: string): Promise<EvaluationQuestion | null>;
    질문내용으로조회한다(text: string): Promise<EvaluationQuestion | null>;
    전체조회한다(): Promise<EvaluationQuestion[]>;
    필터조회한다(filter: EvaluationQuestionFilter): Promise<EvaluationQuestion[]>;
    생성한다(createDto: CreateEvaluationQuestionDto, createdBy: string): Promise<EvaluationQuestion>;
    업데이트한다(id: string, updateDto: UpdateEvaluationQuestionDto, updatedBy: string): Promise<EvaluationQuestion>;
    삭제한다(id: string, deletedBy: string): Promise<void>;
    복사한다(id: string, copiedBy: string): Promise<EvaluationQuestion>;
    질문내용중복확인한다(text: string, excludeId?: string): Promise<boolean>;
    질문응답존재확인한다(questionId: string): Promise<boolean>;
    질문응답개수조회한다(questionId: string): Promise<number>;
}
