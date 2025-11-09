import { BaseEntity } from '@libs/database/base/base.entity';
import { IEvaluationProjectAssignment } from './interfaces/evaluation-project-assignment.interface';
import type { EvaluationProjectAssignmentDto, CreateEvaluationProjectAssignmentData } from './evaluation-project-assignment.types';
export declare class EvaluationProjectAssignment extends BaseEntity<EvaluationProjectAssignmentDto> implements IEvaluationProjectAssignment {
    periodId: string;
    employeeId: string;
    projectId: string;
    assignedDate: Date;
    assignedBy: string;
    displayOrder: number;
    constructor(data?: CreateEvaluationProjectAssignmentData);
    평가기간과_일치하는가(periodId: string): boolean;
    해당_직원의_할당인가(employeeId: string): boolean;
    해당_프로젝트_할당인가(projectId: string): boolean;
    순서를_변경한다(newOrder: number): void;
    DTO로_변환한다(): EvaluationProjectAssignmentDto;
}
