import { BaseEntity } from '@libs/database/base/base.entity';
import { IEvaluationWbsAssignment } from './interfaces/evaluation-wbs-assignment.interface';
import type { EvaluationWbsAssignmentDto, CreateEvaluationWbsAssignmentData } from './evaluation-wbs-assignment.types';
export declare class EvaluationWbsAssignment extends BaseEntity<EvaluationWbsAssignmentDto> implements IEvaluationWbsAssignment {
    periodId: string;
    employeeId: string;
    projectId: string;
    wbsItemId: string;
    assignedDate: Date;
    assignedBy: string;
    displayOrder: number;
    weight: number;
    constructor(data?: CreateEvaluationWbsAssignmentData);
    평가기간과_일치하는가(periodId: string): boolean;
    해당_직원의_할당인가(employeeId: string): boolean;
    해당_프로젝트의_WBS_할당인가(projectId: string): boolean;
    해당_WBS_항목의_할당인가(wbsItemId: string): boolean;
    순서를_변경한다(newOrder: number): void;
    가중치를_설정한다(weight: number): void;
    DTO로_변환한다(): EvaluationWbsAssignmentDto;
}
