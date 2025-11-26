import { BaseEntity } from '@libs/database/base/base.entity';
export interface ProjectSecondaryEvaluatorDto {
    id: string;
    projectId: string;
    evaluatorId: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
}
export declare class ProjectSecondaryEvaluator extends BaseEntity<ProjectSecondaryEvaluatorDto> {
    projectId: string;
    evaluatorId: string;
    static 생성한다(projectId: string, evaluatorId: string, createdBy: string): ProjectSecondaryEvaluator;
    DTO로_변환한다(): ProjectSecondaryEvaluatorDto;
}
