import { IBaseEntity } from '@libs/database/base/base.entity';
import type { EvaluationWbsAssignmentDto } from '../evaluation-wbs-assignment.types';
export interface IEvaluationWbsAssignment extends IBaseEntity {
    periodId: string;
    employeeId: string;
    projectId: string;
    wbsItemId: string;
    assignedDate: Date;
    assignedBy: string;
    displayOrder: number;
    weight: number;
    평가기간과_일치하는가(periodId: string): boolean;
    해당_직원의_할당인가(employeeId: string): boolean;
    해당_프로젝트의_WBS_할당인가(projectId: string): boolean;
    해당_WBS_항목의_할당인가(wbsItemId: string): boolean;
    DTO로_변환한다(): EvaluationWbsAssignmentDto;
}
