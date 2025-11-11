import { EntityManager } from 'typeorm';
import type { CreateEvaluationProjectAssignmentData, UpdateEvaluationProjectAssignmentData, OrderDirection } from '../evaluation-project-assignment.types';
import type { IEvaluationProjectAssignment } from './evaluation-project-assignment.interface';
export interface IEvaluationProjectAssignmentService {
    ID로_조회한다(id: string, manager?: EntityManager): Promise<IEvaluationProjectAssignment | null>;
    생성한다(createData: CreateEvaluationProjectAssignmentData, manager?: EntityManager): Promise<IEvaluationProjectAssignment>;
    업데이트한다(id: string, updateData: UpdateEvaluationProjectAssignmentData, updatedBy: string, manager?: EntityManager): Promise<IEvaluationProjectAssignment>;
    삭제한다(id: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    할당_존재_확인한다(periodId: string, employeeId: string, projectId: string, manager?: EntityManager): Promise<boolean>;
    평가기간_할당_전체삭제한다(periodId: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    직원_할당_전체삭제한다(employeeId: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    프로젝트_할당_전체삭제한다(projectId: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    순서를_변경한다(assignmentId: string, direction: OrderDirection, updatedBy: string, manager?: EntityManager): Promise<IEvaluationProjectAssignment>;
    순서를_재정렬한다(periodId: string, employeeId: string, updatedBy: string, manager?: EntityManager): Promise<void>;
}
