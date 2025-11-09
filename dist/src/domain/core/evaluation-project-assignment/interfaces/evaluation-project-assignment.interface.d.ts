import { IBaseEntity } from '@libs/database/base/base.entity';
import type { EvaluationProjectAssignmentDto } from '../evaluation-project-assignment.types';
export interface IEvaluationProjectAssignment extends IBaseEntity {
    periodId: string;
    employeeId: string;
    projectId: string;
    assignedDate: Date;
    assignedBy: string;
    평가기간과_일치하는가(periodId: string): boolean;
    해당_직원의_할당인가(employeeId: string): boolean;
    해당_프로젝트_할당인가(projectId: string): boolean;
    DTO로_변환한다(): EvaluationProjectAssignmentDto;
}
