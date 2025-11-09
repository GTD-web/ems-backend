import { Repository } from 'typeorm';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import { PeerEvaluationStatus } from '../../../interfaces/dashboard-context.interface';
export declare function 동료평가_상태를_조회한다(evaluationPeriodId: string, employeeId: string, peerEvaluationRepository: Repository<PeerEvaluation>): Promise<{
    totalRequestCount: number;
    completedRequestCount: number;
}>;
export declare function 동료평가_상태를_계산한다(totalRequestCount: number, completedRequestCount: number): PeerEvaluationStatus;
